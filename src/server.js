import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import ragbotRoutes from "./routes/ragbotRoutes.js";
import cookieParser from "cookie-parser";
import { limiter, authLimiter } from "./middleware/rateLimiters.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS setup
const corsOptions = {
  origin: ["https://your-frontend.example.com"],
  credentials: true,
}

// Middleware
// Security
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// Rate limiting
app.use(limiter);
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);

// Routes
app.use("/auth", authRoutes);
app.use("/ragbot", ragbotRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
