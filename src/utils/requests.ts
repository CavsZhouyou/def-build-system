/*
 * @Author: zhouyou@werun
 * @Descriptions: 封装一些通用的请求
 * @TodoList: 无
 * @Date: 2020-04-14 17:29:17
 * @Last Modified by: zhouyou@werun
 * @Last Modified time: 2020-04-16 11:06:54
 */
const axios = require('axios');

const host = 'http://192.168.3.61:4000';

/**
 * 创建发布记录
 *
 * @param {string} userId
 * @param {string} appName
 * @param {string} branch
 * @param {string} commit
 * @param {string} publishEnv
 * @returns
 */
export const createPublishLog = async (
  userId: string,
  appName: string,
  branch: string,
  commit: string,
  publishEnv: string
) => {
  const api = `${host}/def/publish/createPublish`;

  return axios
    .post(api, { branch, userId, appName, commit, publishEnv })
    .then((response: any) => {
      const { data } = response;
      return data;
    })
    .catch((error: any) => {
      return {
        success: false,
        message: '创建发布失败！',
      };
    });
};

/**
 * 更新发布记录
 *
 * @param {string} userId
 * @param {string} appName
 * @param {string} branch
 * @param {string} commit
 * @param {string} publishEnv
 * @returns
 */
export const updatePublishLog = async (
  publishId: number,
  publishLog: string,
  publishStatus: string
) => {
  const api = `${host}/def/publish/updateAppPublishInfo`;

  return axios
    .post(api, { publishId, publishLog, publishStatus })
    .then((response: any) => {
      const { data } = response;
      return data;
    })
    .catch((error: any) => {
      return {
        success: false,
        message: '发布更新失败！',
      };
    });
};
