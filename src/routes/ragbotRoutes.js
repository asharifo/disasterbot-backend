import express from 'express';
import ragbotController from '../controllers/ragbotController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { queryLimiter } from '../middleware/rateLimiters.js'

const router = express.Router();

router.route('/')
    .get(authMiddleware, ragbotController.getAllQueries)
    .post(authMiddleware, queryLimiter, ragbotController.createQuery)

export default router

