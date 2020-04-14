import { Router } from 'express';
import BuildRouter from './Build';

// Init router and path
const router = Router();

// Add sub-routes
router.use('/build', BuildRouter);

// Export the base-router
export default router;
