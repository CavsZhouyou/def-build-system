import { Request, Response, Router } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { writeFilePromise, publishApp } from 'src/utils/publish';
import { paramMissingError } from '@shared/constants';
import { createPublishLog, updatePublishLog } from 'src/utils/requests';
// Init shared
const router = Router();

/******************************************************************************
 *                buildPublish - "POST /api/build/buildPublish"
 ******************************************************************************/

router.post('/buildPublish', async (req: Request, res: Response) => {
  const { branch, userId, appName, commit, publishEnv } = req.body;

  if (!(branch && userId && appName && commit && publishEnv)) {
    return res.status(OK).json({
      success: false,
      message: paramMissingError,
    });
  }

  const result = await createPublishLog(
    userId,
    appName,
    branch,
    commit,
    publishEnv
  );

  if (result.success) {
    const { repository, publishId } = result.data;
    const publishResult = await publishApp(repository, appName, branch);

    const { log } = publishResult;
    const publishStatus = publishResult.success ? '4001' : '4002';

    await updatePublishLog(publishId, log, publishStatus);
    return res.status(OK).json({
      success: true,
      message: publishResult.success ? '发布成功！' : '发布失败',
    });
  } else {
    return res.status(OK).json({ ...result });
  }

  // const appRepository =
  //   'http://192.168.3.61:10080/taobao-fe/def-deploy-demo.git';
  // const appName = 'taobao-fe/def-deploy-demo';
  // const branch = 'daily/0.0.1';
  // const result = await publishApp(appRepository, appName, branch);

  // if (result.success) {
  //   return res.status(OK).json({ success: true, data: result.log });
  // } else {
  //   return res.status(OK).json({ success: false, data: '发布失败' });
  // }
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
