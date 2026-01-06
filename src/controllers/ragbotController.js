import { prisma } from "../prismaClient.js";
import {
  queryCountry,
  streamCountryAnswer,
  parseStreamChunk,
} from "../services/ragbotService.js";

// Get all queries for logged-in user
const getAllQueries = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to view your queries",
    });
  }
  try {
    const queries = await prisma.query.findMany({
      where: {
        userId: req.userId,
      },
    });
    res.json({ queries });
  } catch (err) {
    console.error("getAllQueries failed:", err);
    res.status(503).json({
      error: "DatabaseError",
      message: "Unable to fetch queries",
    });
  }
};

// Create new query
const createQuery = async (req, res) => {
  const { question, country } = req.body;
  if (!req.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to submit a query",
    });
  }
  if (!question || !country) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Both question and country are required",
    });
  }

  let answer;
  // RAG pipe calls
  try {
    answer = await queryCountry(question, country);
  } catch (err) {
    console.error("RAG failed:", err);

    switch (err.message) {
      case "EMBEDDING_FAILED":
        return res.status(502).json({
          error: "EmbeddingServiceDown",
          message: "Failed to generate embeddings for your question",
        });

      case "VECTOR_SEARCH_FAILED":
        return res.status(503).json({
          error: "KnowledgeBaseUnavailable",
          message: "The disaster knowledge base is currently unavailable",
        });

      case "LLM_FAILED":
        return res.status(502).json({
          error: "AIServiceDown",
          message: "The AI service failed to generate an answer",
        });

      case "LLM_OUTPUT_INVALID":
        return res.status(500).json({
          error: "AIResponseInvalid",
          message: "The AI returned an invalid response",
        });

      default:
        return res.status(500).json({
          error: "UnknownRAGError",
          message: "An unexpected error occurred while generating your answer",
        });
    }
  }

  // Write to DB
  try {
    const query = await prisma.query.create({
      data: {
        question,
        answer,
        userId: req.userId,
      },
    });

    res.status(201).json({ query });
  } catch (err) {
    console.error("DB write failed:", err);

    // The AI worked, but persistence failed
    res.status(503).json({
      error: "DatabaseError",
      message: "Your answer was generated but could not be saved",
      answer, // still return it so frontend doesn’t lose the result
    });
  }
};

const streamQuery = async (req, res) => {
  const { question, country } = req.body;
  if (!req.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You must be logged in to submit a query",
    });
  }
  if (!question || !country) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Both question and country are required",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Content-Encoding", "none");
  res.flushHeaders?.();

  let cancelled = false;
  req.on("close", () => {
    cancelled = true;
  });

  let answer = "";
  try {
    const stream = await streamCountryAnswer(question, country);

    for await (const chunk of stream) {
      if (cancelled) {
        break;
      }
      const token = parseStreamChunk(chunk);
      if (!token) {
        continue;
      }
      answer += token;
      res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      res.flush?.();
    }
  } catch (err) {
    console.error("RAG stream failed:", err);

    let response = {
      error: "UnknownRAGError",
      message: "An unexpected error occurred while generating your answer",
    };

    switch (err.message) {
      case "EMBEDDING_FAILED":
        response = {
          error: "EmbeddingServiceDown",
          message: "Failed to generate embeddings for your question",
        };
        break;
      case "VECTOR_SEARCH_FAILED":
        response = {
          error: "KnowledgeBaseUnavailable",
          message: "The disaster knowledge base is currently unavailable",
        };
        break;
      case "LLM_FAILED":
        response = {
          error: "AIServiceDown",
          message: "The AI service failed to generate an answer",
        };
        break;
      default:
        break;
    }

    res.write(`event: error\ndata: ${JSON.stringify(response)}\n\n`);
    res.flush?.();
    return res.end();
  }

  if (cancelled) {
    return res.end();
  }

  try {
    await prisma.query.create({
      data: {
        question,
        answer,
        userId: req.userId,
      },
    });

    res.write(`event: done\ndata: ${JSON.stringify({ saved: true })}\n\n`);
    res.flush?.();
  } catch (err) {
    console.error("DB write failed:", err);
    res.write(
      `event: done\ndata: ${JSON.stringify({
        saved: false,
        error: "DatabaseError",
        message: "Your answer was generated but could not be saved",
        answer,
      })}\n\n`
    );
    res.flush?.();
  }

  return res.end();
};

export default { getAllQueries, createQuery, streamQuery };
