/*
 * @Author: zhouyou@werun
 * @Descriptions: 封装发布相关方法
 * @TodoList: 无
 * @Date: 2020-04-15 16:18:55
 * @Last Modified by: zhouyou@werun
 * @Last Modified time: 2020-04-16 12:07:50
 */

const fs = require('fs');
// const DOCKER_REGISTRY = '192.168.3.61:5000';
const DOCKER_REGISTRY = '123.57.239.134:5000';
const GIT_USER_NAME = 'root';
const GIT_USER_EMAIL = 'zhouyou.world@outlook.com';

/**
 * 文件变化监听
 *
 * @param {string} filename
 */
const watchFile = (filename: string, logData: { log: string }) => {
  fs.open(filename, 'a+', function (err: any, fd: any) {
    if (err) {
      throw err;
    }
    var buffer;
    fs.watchFile(
      filename,
      {
        persistent: true,
        interval: 1000,
      },
      (curr: any, prev: any) => {
        /// 比较时间间隔
        if (curr.mtime > prev.mtime) {
          // 根据文档修改内容创建 buffer
          buffer = Buffer.alloc(curr.size - prev.size);
          // 获取新增加内容
          readFile(fd, buffer, curr.size - prev.size, prev.size, logData);
        }
      }
    );
  });
};

/**
 * 读取新增文件内容
 *
 * @param {*} fd
 * @param {*} buffer
 * @param {number} length
 * @param {number} position
 */
const readFile = (
  fd: any,
  buffer: any,
  length: number,
  position: number,
  logData: { log: string }
) => {
  //  读取文件
  fs.read(fd, buffer, 0, length, position, function (
    err: any,
    bytesRead: any,
    buffer: any
  ) {
    if (err) {
      console.error(err);
    }

    logData.log += buffer.toString();

    console.log(buffer.toString());
  });
};

/**
 * 获取 deploy.sh 内容
 *
 * @param {number} port
 * @param {string} appName
 * @param {string} appSubName
 * @param {string} version
 * @returns
 */
const getDeployFileContent = (
  port: number,
  appName: string,
  appSubName: string,
  version: string
) => {
  const dockerImageName = `${DOCKER_REGISTRY}/${appName}:${version}`;
  // const exec = require('child_process').execSync;
  // const result = exec(`docker ps | grep ${appSubName} | awk '{print $1}'`)
  //   .toString('utf8')
  //   .trim();
  // const hasDeployed = result.length !== 0;

  // const firstDeployFileContent = `
  //       #!/bin/bash
  //       docker build --network=host -t ${dockerImageName} src/publish/.
  //       docker push ${dockerImageName}
  //       docker images | grep none | awk '{print $3}' | xargs docker rmi
  //       `;
  // const deployFileContent = `
  //       #!/bin/bash
  //       docker build --network=host -t ${dockerImageName} src/publish/.
  //       docker push ${dockerImageName}
  //       docker stop ${appSubName}
  //       docker images | grep none | awk '{print $3}' | xargs docker rmi
  //       `;
  // return hasDeployed ? deployFileContent : firstDeployFileContent;

  const deployCmd = `cd ~ && sh deploy.sh ${port} ${appSubName} ${dockerImageName}`;
  const deployFileContent = `
        #!/bin/bash
        docker build --network=host -t ${dockerImageName} src/publish/.
        docker push ${dockerImageName} 
        docker images | grep none | awk '{print $3}' | xargs docker rmi

        ssh -t -i ~/.ssh/def.pem root@123.57.239.134 "bash -c \'${deployCmd}\'"
        `;
  return deployFileContent;
};

const getDockerfileContent = (
  appRepository: string,
  appFileName: string,
  branch: string
) => {
  const dockerfileContent = `
        FROM node:latest as builder

        ENV PROJECT_ENV production
        ENV NODE_ENV production

        RUN git clone ${appRepository} 

        WORKDIR /${appFileName}

        RUN git checkout ${branch} && npm config set registry https://registry.npm.taobao.org/ 
        RUN npm install --production && npm run build

        # 选择更小体积的基础镜像
        FROM nginx:alpine

        COPY --from=builder ${appFileName}/dist /usr/share/nginx/html
        COPY --from=builder ${appFileName}/nginx /etc/nginx/conf.d
        `;

  return dockerfileContent;
};

/**
 * 获取 git_merge.sh
 *
 * @param {string} appRepository
 * @param {string} appFileName
 * @param {string} branch
 * @param {string} version
 * @returns
 */
const getGitFileContent = (
  appRepository: string,
  appFileName: string,
  branch: string,
  version: string
) => {
  const gitFileContent = `
        #!/bin/bash

        git clone ${appRepository} 

        cd ${appFileName} 

        git config user.name = "${GIT_USER_NAME}"
        git config user.email = "${GIT_USER_EMAIL}"

        git checkout ${branch} 
        git tag ${version} 
        git checkout master

        git merge ${branch}
        git push
        git push --tags

        cd ../
        rm -rf ${appFileName}
        `;

  return gitFileContent;
};

/**
 * 创建文件 Promise 封装
 *
 * @param {string} filename
 * @param {string} content
 * @returns
 */
export const writeFilePromise = async (filename: string, content: string) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, function (err: any) {
      if (err) {
        // 创建失败
        reject(err);
      }

      // 创建成功
      resolve();
    });
  });
};

/**
 * exec Promise 封装
 *
 * @param {string} command
 * @returns
 */
export const execPromise = async (command: string) => {
  const exec = require('child_process').exec;

  return new Promise((resolve, reject) => {
    exec(command, function (err: any) {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
};

/**
 * unlink Promise 封装
 *
 * @param {string} filename
 * @returns
 */
export const deleteFilePromise = async (filename: string) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filename, function (err: any) {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
};

export const publishApp = async (
  appRepository: string,
  appName: string,
  branch: string,
  publishEnv: string,
  port: number
) => {
  const logData = {
    log: '',
  };

  try {
    const appSubName = appName.split('/')[1];
    const version = branch.split('/')[1];
    const dockerImageName = `${DOCKER_REGISTRY}/${appName}:${version}`;
    const dockerfilePath = 'src/publish/Dockerfile';
    const dockerfileContent = getDockerfileContent(
      appRepository,
      appSubName,
      branch
    );
    const deployFilePath = 'src/publish/deploy.sh';
    const deployFileContent = getDeployFileContent(
      port,
      appName,
      appSubName,
      version
    );
    const deployLogFilePath = 'src/publish/deploy.log';
    const deployLogFileContent = '';

    // 创建 dockerfile 文件
    await writeFilePromise(dockerfilePath, dockerfileContent);
    // 创建 deploy.sh 文件
    await writeFilePromise(deployFilePath, deployFileContent);
    // 赋予 deploy.sh 文件执行权限
    await execPromise(`chmod +x ${deployFilePath}`);
    // 创建 log 文件
    await writeFilePromise(deployLogFilePath, deployLogFileContent);
    // 监听 log 文件
    watchFile(deployLogFilePath, logData);
    // 执行发布命令
    await execPromise(`${deployFilePath} > ${deployLogFilePath} 2>&1`);
    // 取消监听 log 文件
    fs.unwatchFile(deployLogFilePath);
    // // 启动 docker 镜像
    // await execPromise(
    //   `docker run -d -p ${port}:80 --rm --name ${appSubName} ${dockerImageName}`
    // );

    // 线上发布时，合并当前分支到 master
    if (publishEnv === 'online') {
      const gitFilePath = 'src/publish/git_merge.sh';
      const gitFileContent = getGitFileContent(
        appRepository,
        appSubName,
        branch,
        version
      );
      const gitLogFilePath = 'src/publish/git_merge.log';
      const gitLogFileContent = '';

      // 创建 git_merge.sh 文件
      await writeFilePromise(gitFilePath, gitFileContent);
      // 赋予 git_merge.sh 文件执行权限
      await execPromise(`chmod +x ${gitFilePath}`);
      // 创建 log 文件
      await writeFilePromise(gitLogFilePath, gitLogFileContent);
      // 监听 log 文件
      watchFile(gitLogFilePath, logData);
      // 执行 merge 命令
      await execPromise(`${gitFilePath} > ${gitLogFilePath} 2>&1`);
      // 取消监听 log 文件
      fs.unwatchFile(gitLogFilePath);
    }

    return {
      success: true,
      log: logData.log,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      log: logData.log,
    };
  }
};
