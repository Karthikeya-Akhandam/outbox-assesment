import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const esNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

export const esClient = new Client({
  node: esNode,
});

// Helper to initialize index
export const initElasticsearch = async () => {
  try {
    const indexName = 'emails';
    const indexExists = await esClient.indices.exists({ index: indexName });

    if (!indexExists) {
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              to: { type: 'text' },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
            }
          }
        }
      });
      console.log(`Elasticsearch index '${indexName}' created successfully.`);
    } else {
      console.log(`Elasticsearch index '${indexName}' already exists.`);
    }
  } catch (error) {
    console.error('Failed to initialize Elasticsearch index:', error);
  }
};
