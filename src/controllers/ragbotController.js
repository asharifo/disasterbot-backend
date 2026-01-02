import { prisma } from "../prismaClient.js";
import { queryCountry } from "../services/ragbotService.js";

// Get all queries for logged-in user
const getAllQueries = async (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401).json({
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
    res.sendStatus(503).json({
      error: "DatabaseError",
      message: "Unable to fetch queries",
    });
  }
};

// Create new query
const createQuery = async (req, res) => {
  const { question, country } = req.body;
  if (!req.userId) {
    return res.sendStatus(401).json({
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

export default { getAllQueries, createQuery };
