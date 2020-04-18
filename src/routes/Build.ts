import { Request, Response, Router } from 'express';
import { OK } from 'http-status-codes';
import { publishApp } from 'src/utils/publish';
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
    const publishResult = await publishApp(
      repository,
      appName,
      branch,
      publishEnv
    );

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
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
