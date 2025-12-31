import express from 'express';
import prisma from '../prismaClient.js';
import { queryCountry } from '../services/ragbotService.js';

const router = express.Router();

// Get all queries for logged-in user
router.get('/', async (req, res) => {
    const queries = await prisma.query.findMany({
        where: {
            userId: req.userId
        }
    })
    res.json({ queries})
})

// Create new query
router.post('/', async (req, res) => {
    const { question, country } = req.body
    const answer = await queryCountry(question, country)
    const query = await prisma.query.create({
        data: {
            question,
            answer,
            userId: req.userId
        }
    })
    res.json({ query })
})

export default router;