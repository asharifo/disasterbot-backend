import express from 'express';

const router = express.Router();

router.route('/register')
    .post(registerLimiter, authController.register)

router.route('/login')
    .post(loginLimiter, authController.login)

router.route('/refresh')
    .get(authController.refresh)

router.route('/logout')
    .post(authController.logout)

export default router

