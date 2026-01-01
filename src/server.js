import express from 'express'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import ragbotRoutes from './routes/ragbotRoutes.js'
import authMiddleware from './middleware/authMiddleware.js'

const app = express()
const PORT = process.env.PORT || 3000

// __dirname setup 
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

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


