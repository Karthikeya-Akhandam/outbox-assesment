import axios from 'axios';

const scheduleTestEmails = async () => {
  try {
    const to = Array.from({ length: 15 }, (_, i) => `recipient${i}@example.com`);
    
    console.log(`Scheduling ${to.length} emails to test rate limiting and staggering...`);
    
    const response = await axios.post('http://localhost:3001/api/emails/schedule', {
      to,
      subject: 'Load Test Email',
      body: 'This is a test of the rate limiter and staggering.',
      scheduledAt: new Date().toISOString(),
      delayBetween: 500, // 0.5s stagger
      hourlyLimit: 10,   // Should hit limit after 10, rescheduling the rest
      userId: 'test-user-id' // Mock user ID for testing
    });

    console.log('Response:', response.data);
    console.log('Test emails successfully sent to queue! Check worker logs to verify rate limit hit.');
  } catch (error: any) {
    console.error('Error scheduling test emails:', error.response?.data || error.message);
  }
};

scheduleTestEmails();
