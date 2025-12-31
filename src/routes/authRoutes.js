import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
//import db from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body

    const hashedPassword = bcrypt.hashSync(password, 10)

    try {
        const insertUser = db.prepare()
        const result = insertUser.run(username, hashedPassword)

        // create a token
        const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token})

    } catch (err) {
        res.sendStatus(503)
    }
})

router.post('/login', async (req, res) => {
    
})

export default router;