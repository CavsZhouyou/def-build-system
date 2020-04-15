/*
 * @Author: zhouyou@werun
 * @Descriptions: 封装发布相关方法
 * @TodoList: 无
 * @Date: 2020-04-15 16:18:55
 * @Last Modified by: zhouyou@werun
 * @Last Modified time: 2020-04-15 16:51:02
 */

const fs = require('fs');
const DOCKER_REGISTRY = '192.168.3.61:5000';

/**
 * 文件变化监听
 *
 * @param {string} filename
 */
const watchFile = (filename: string) => {
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
          readFile(fd, buffer, curr.size - prev.size, prev.size);
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
const readFile = (fd: any, buffer: any, length: number, position: number) => {
  //  读取文件
  fs.read(fd, buffer, 0, length, position, function (
    err: any,
    bytesRead: any,
    buffer: any
  ) {
    if (err) {
      console.error(err);
    }

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
        docker build --network=host -t ${dockerImageName} .
        docker push ${dockerImageName} 
        docker images | grep none | awk '{print $3}' | xargs docker rmi
        `;
  return deployFileContent;
};

const getDockerfileContent = (
  appRepository: string,
  appName: string,
  branch: string
) => {
  const appFileName = appName.split('/')[0];
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
        reject(false);
      }

      // 创建成功
      resolve(true);
    });
  }).then((result: any) => {
    return result;
  });
};
