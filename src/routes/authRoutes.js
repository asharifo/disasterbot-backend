import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.route('/register')
    .post(authController.register)

router.route('/login')
    .post(authController.login)

router.route('/refresh')
    .post(authController.refresh)

router.route('/logout')
    .post(authController.logout)

export default router

