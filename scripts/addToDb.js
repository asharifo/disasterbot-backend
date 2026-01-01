import 'dotenv/config';
import { AstraDBVectorStore } from '@langchain/community/vectorstores/astradb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { parse_docs } from './ingest.js';

async function main() {
  const splitDocs = await parse_docs();
  console.log(`Loaded ${splitDocs.length} chunks`);

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small', 
    openAIApiKey: process.env.OPENAI_API_KEY,
    batchSize: 128,
  });

  const store = await AstraDBVectorStore.fromDocuments([], embeddings, {
    token: process.env.ASTRA_DB_APPLICATION_TOKEN,
    endpoint: process.env.ASTRA_DB_API_ENDPOINT,
    namespace: process.env.KEYSPACE_NAME,
    collection: process.env.COLLECTION_NAME,
    collectionOptions: { vector: { dimension: 1536, metric: 'cosine' } },
  });

  const BATCH = 200;
  for (let i = 0; i < splitDocs.length; i += BATCH) {
    await store.addDocuments(splitDocs.slice(i, i + BATCH));
    console.log(`Indexed ${Math.min(i + BATCH, splitDocs.length)} / ${splitDocs.length}`);
  }

  console.log('Ingestion complete');
}

main().catch((e) => {
  console.error('Ingestion failed:', e);
  process.exit(1);
});
