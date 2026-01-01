import express from 'express';
import ragbotController from '../controllers/ragbotController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(authMiddleware, ragbotController.getAllQueries)
    .post(authMiddleware, ragbotController.createQuery)

export default router

