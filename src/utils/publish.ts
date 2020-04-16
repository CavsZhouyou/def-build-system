/*
 * @Author: zhouyou@werun
 * @Descriptions: 封装发布相关方法
 * @TodoList: 无
 * @Date: 2020-04-15 16:18:55
 * @Last Modified by: zhouyou@werun
 * @Last Modified time: 2020-04-16 11:41:55
 */

const fs = require('fs');
const DOCKER_REGISTRY = '192.168.3.61:5000';

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
 * @param {string} appName
 * @param {string} version
 * @returns
 */
const getDeployFileContent = (appName: string, version: string) => {
  const dockerImageName = `${DOCKER_REGISTRY}/${appName}:${version}`;
  const deployFileContent = `
        #!/bin/bash
        docker build --network=host -t ${dockerImageName} src/publish/.
        docker push ${dockerImageName} 
        docker images | grep none | awk '{print $3}' | xargs docker rmi
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
  branch: string
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
    const deployFileContent = getDeployFileContent(appName, version);
    const logFilePath = 'src/publish/deploy.log';
    const logFileContent = '';

    // 创建 dockerfile 文件
    await writeFilePromise(dockerfilePath, dockerfileContent);
    // 创建 deploy.sh 文件
    await writeFilePromise(deployFilePath, deployFileContent);
    // 赋予 deploy.sh 文件执行权限
    await execPromise(`chmod +x ${deployFilePath}`);
    // 创建 log 文件
    await writeFilePromise(logFilePath, logFileContent);
    // 监听 log 文件
    watchFile(logFilePath, logData);
    // 执行发布命令
    await execPromise(`${deployFilePath} > ${logFilePath} 2>&1`);
    // 取消监听 log 文件
    fs.unwatchFile(logFilePath);
    // 关闭容器
    await execPromise(`docker stop ${appSubName}`);
    // 启动 docker 镜像
    await execPromise(
      `docker run -d -p 9000:80 --rm --name ${appSubName} ${dockerImageName}`
    );

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
