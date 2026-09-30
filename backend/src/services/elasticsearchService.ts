import { esClient } from '../config/elasticsearch';

export const indexEmail = async (email: any) => {
  try {
    await esClient.index({
      index: 'emails',
      id: email.id,
      body: {
        id: email.id,
        userId: email.userId,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt,
        sentAt: email.sentAt,
      },
    });
  } catch (error) {
    console.error(`Failed to index email ${email.id} to Elasticsearch:`, error);
  }
};

export const updateIndexedEmailStatus = async (id: string, status: string, sentAt?: Date) => {
  try {
    const doc: any = { status };
    if (sentAt) doc.sentAt = sentAt;

    await esClient.update({
      index: 'emails',
      id,
      body: {
        doc,
      },
    });
  } catch (error) {
    console.error(`Failed to update email ${id} in Elasticsearch:`, error);
  }
};
