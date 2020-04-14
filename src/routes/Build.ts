import { Request, Response, Router } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
// Init shared
const router = Router();

/******************************************************************************
 *                buildPublish - "GET /api/build/buildPublish"
 ******************************************************************************/

router.get('/buildPublish', async (req: Request, res: Response) => {
  return res.status(OK).json({ data: 123 });
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
