import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

export const sendSlackNotification = async (message: string) => {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack Webhook URL is not configured. Skipping notification.');
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: message,
    });
    console.log('Slack notification sent successfully.');
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
};
