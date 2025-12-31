import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body

    const hashedPassword = bcrypt.hashSync(password, 10)

    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            }
        })

        // create a token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token})

    } catch (err) {
        res.sendStatus(503)
    }
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body
    
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if (!user) {   
            return res.sendStatus(401)
        }

        const passwordMatch = bcrypt.compareSync(password, user.password)

        if (!passwordMatch) {
            return res.sendStatus(401)
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token })

    } catch (err) {
        res.sendStatus(503)
    }
})

export default router;