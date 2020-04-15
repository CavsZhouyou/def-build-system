import { Request, Response, Router } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { writeFilePromise, publishApp } from 'src/utils/publish';
// Init shared
const router = Router();

/******************************************************************************
 *                buildPublish - "GET /api/build/buildPublish"
 ******************************************************************************/

router.get('/buildPublish', async (req: Request, res: Response) => {
  // const result = await writeFilePromise('src/public/test.txt', '123');

  await publishApp();

  return res.status(OK).json({ data: 123 });
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
