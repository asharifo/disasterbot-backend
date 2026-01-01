import express from 'express';
import ragbotController from '../controllers/ragbotController.js'

const router = express.Router();

router.route('/')
    .get(authMiddleware, ragbotController.getAllQueries)
    .post(authMiddleware, ragbotController.createQuery)

export default router

