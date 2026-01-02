# DisasterBot Backend

A Node.js/Express backend that powers DisasterBot, a natural‑disaster preparedness assistant. The service provides JWT-based authentication, persists user queries in Postgres via Prisma, and runs a RAG (retrieval‑augmented generation) pipeline using OpenAI + Astra DB vector search to answer country‑specific questions.

## Features

- **Authentication**: JWT access tokens + refresh token cookie.
- **RAG pipeline**: OpenAI embeddings + Astra DB vector search + OpenAI chat completion.
- **Postgres persistence**: Users and saved queries are stored in Postgres with Prisma.
- **Rate limiting**: Global and auth‑specific rate limiters.
- **Express 5**: Modern middleware setup with CORS + JSON + cookie parsing.

## Tech Stack

- **Runtime**: Node.js (ESM modules)
- **Web**: Express 5
- **Database**: Postgres + Prisma ORM
- **Vector Store**: DataStax Astra DB Data API
- **AI**: OpenAI (embeddings + chat)

## Project Structure

```
src/
  controllers/      # Request handlers (auth + ragbot)
  middleware/       # Auth + rate limiters
  routes/           # Express routes
  services/         # RAG pipeline and external integrations
  prismaClient.js   # Prisma connection helpers
  server.js         # App bootstrap
prisma/             # Prisma schema + migrations
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create a `.env` file in the project root (see the variables below). The dev script automatically loads it.

```bash
cp .env.example .env
```

> If you don’t have an example file, copy the block below and fill in values.

### 3) Database setup

This project expects a Postgres database. Use Prisma to apply migrations:

```bash
npx prisma migrate dev
```

### 4) Start the server

```bash
npm run dev
```

The server listens on `PORT` (defaults to `3000`).

## Environment Variables

| Name | Required | Description |
| ---- | -------- | ----------- |
| `DATABASE_URL` | ✅ | Postgres connection string used by Prisma. |
| `ACCESS_TOKEN_SECRET` | ✅ | Secret for signing access tokens (JWT). |
| `REFRESH_TOKEN_SECRET` | ✅ | Secret for signing refresh tokens (JWT). |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for embeddings + chat completions. |
| `ASTRA_DB_APPLICATION_TOKEN` | ✅ | Astra DB Data API token. |
| `ASTRA_DB_API_ENDPOINT` | ✅ | Astra DB Data API endpoint URL. |
| `KEYSPACE_NAME` | ✅ | Astra DB keyspace/namespace. |
| `COLLECTION_NAME` | ✅ | Vector collection name. |
| `PORT` | ➖ | Express server port (default: `3000`). |
| `NODE_ENV` | ➖ | `development` or `production` (affects logging and rate limits). |

## API Overview

Base URL: `http://localhost:3000`

### Auth

- **POST `/auth/register`**
  - Body: `{ "username": "...", "password": "..." }`
  - Response: `{ "accessToken": "..." }` + refresh token cookie

- **POST `/auth/login`**
  - Body: `{ "username": "...", "password": "..." }`
  - Response: `{ "accessToken": "..." }` + refresh token cookie

- **GET `/auth/refresh`**
  - Requires refresh token cookie
  - Response: `{ "accessToken": "..." }`

- **POST `/auth/logout`**
  - Clears refresh token cookie

### RAG Bot

- **GET `/ragbot`**
  - Headers: `Authorization: Bearer <accessToken>`
  - Response: `{ "queries": [ ... ] }`

- **POST `/ragbot`**
  - Headers: `Authorization: Bearer <accessToken>`
  - Body: `{ "question": "...", "country": "..." }`
  - Response: `{ "query": { ... } }`

## RAG Pipeline Details

1. **Embedding**: The user question is embedded with OpenAI (`text-embedding-3-small`).
2. **Vector search**: Astra DB is queried for the top 4 similar documents scoped by `metadata.region`.
3. **Generation**: The LLM (`gpt-4o-mini`) answers using retrieved context.
4. **Persistence**: The question + answer are stored in Postgres linked to the user.

If any upstream service is unavailable, the API returns structured error responses such as `EmbeddingServiceDown`, `KnowledgeBaseUnavailable`, or `AIServiceDown`.

## Rate Limiting

- Global limiter: 1000 requests/15 min in dev, 100/15 min in prod.
- Auth limiter (`/auth/login` + `/auth/register`): 1000/15 min in dev, 5/15 min in prod.

## Development Tips

- Run Prisma Studio to inspect the database:
  ```bash
  npx prisma studio
  ```
- Update the allowed frontend origin in `src/server.js` if your UI runs on a different host.

## License

ISC