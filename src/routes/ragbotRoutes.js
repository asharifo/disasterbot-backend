import express from 'express';
import prisma from '../prismaClient.js';
import { queryCountry } from '../services/ragbotService.js';

const router = express.Router();

// Get all queries for logged-in user
router.get('/', async (req, res) => {
    res.json({ queries})
    if (!req.userId) {
        return res.sendStatus(401)
    }
    try {
        const queries = await prisma.query.findMany({
            where: {
                userId: req.userId
            }
        })
        res.json({ queries })
    } catch (err) {
        res.sendStatus(503)
    }
})

// Create new query
router.post('/', async (req, res) => {
    const { question, country } = req.body
    if (!req.userId) {
        return res.sendStatus(401)
    }
    if (!question || !country) {
        return res.status(400).json({ error: 'Question and country are required.' })
    }
    try {
        const answer = await queryCountry(question, country)
        const query = await prisma.query.create({
            data: {
                question,
                answer,
                userId: req.userId
            }
        })
        res.json({ query })
    } catch (err) {
        res.sendStatus(503)
    }
})

export default router;