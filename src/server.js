import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import ragbotRoutes from "./routes/ragbotRoutes.js";
import cookieParser from "cookie-parser";
import { limiter, authLimiter } from "./middleware/rateLimiters.js";
import cors from "cors";
import { connectDb, disconnectDb } from "./prismaClient.js";

// !!! Add zod validation for routes and error-handling middleware

await connectDb();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS setup for development
const allowedOrigins = ["https://disasterbot.onrender.com"];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.startsWith("http://localhost:") ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

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

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDb();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDb();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
});
