import { DataAPIClient } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const {
  OPENAI_API_KEY,
  KEYSPACE_NAME,
  COLLECTION_NAME,
} = process.env;

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  openAIApiKey: OPENAI_API_KEY,
  batchSize: 128,
});

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
  namespace: KEYSPACE_NAME,
});
const collection = db.collection(COLLECTION_NAME);

export async function queryCountry(question, country) {
  // Open AI embeddings call
  try {
    const qvec = await embeddings.embedQuery(question);
  } catch (err) {
    console.error("Embedding failed:", err);
    throw new Error("EMBEDDING_FAILED");
  }

  // Asta DB vector search call
  try {
    const filter = { "metadata.region": { $eq: country } };
    const cursor = collection.find(filter, {
      sort: { $vector: qvec },
      limit: 4,
      includeSimilarity: true,
    });

    const results = await cursor.toArray();
  } catch (err) {
    console.error("Vector search failed:", err);
    throw new Error("VECTOR_SEARCH_FAILED");
  }

  const context = results.length
    ? results
        .map((r, i) => {
          const content = r.text.toString().trim();
          return `--- Document ${i + 1} ---\n${content}`;
        })
        .join("\n\n")
    : "(none)";

  // Open AI LLM call
  try {
    const messages = [
      new SystemMessage(
        `You are an expert on natural disaster preparedness for ${country}. Use the context in your answer.`
      ),
      new HumanMessage(`Context:\n${context}\n\nQuestion:\n${question}`),
    ];

    const res = await llm.invoke(messages);
  } catch (err) {
    console.error("LLM failed:", err);
    throw new Error("LLM_FAILED");
  }

  // Parse output

  try {
    return Array.isArray(res.content)
      ? res.content.map((p) => p?.text ?? "").join("")
      : res.content ?? "";
  } catch (err) {
    console.error("LLM output parse failed:", err);
    throw new Error("LLM_OUTPUT_INVALID");
  }
}
