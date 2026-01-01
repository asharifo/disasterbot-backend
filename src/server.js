import express from 'express'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import ragbotRoutes from './routes/ragbotRoutes.js'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,               // max 100 requests per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

// __dirname setup 
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../public')))
app.use(limiter)
const corsOptions = {
    origin: ['https://your-frontend.example.com'],
    credentials: true,
  }

// Serve HTML file (change it so that frontend is in a seperate project)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'))
})

// Routes
app.use('/auth', authRoutes)
app.use('/ragbot', ragbotRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})


