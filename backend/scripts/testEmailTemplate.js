import { createSubscriptionEmailTemplate } from '../utils/emailService.js';
import fs from 'fs';
import path from 'path';

// Test the email template
const testEmailTemplate = () => {
  console.log('🧪 Testing email template...');

  // Test data for different scenarios
  const testCases = [
    {
      name: 'Subscription Expiring',
      userName: 'John Doe',
      title: 'Subscription Expiring Soon',
      statusColor: '#f093fb 0%, #f5576c 100%',
      statusIcon: '⚠️',
      mainMessage: 'Your subscription is about to expire',
      details: `
        <div class="detail-row">
          <span class="detail-label">Plan:</span>
          <span class="detail-value">Pro Plan</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expiry Date:</span>
          <span class="detail-value">Dec 31, 2024</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Days Remaining:</span>
          <span class="detail-value">3</span>
        </div>
      `,
      actionButton: {
        text: 'Renew Now',
        url: 'https://example.com/renew',
        message: 'Your subscription will expire in 3 days. To avoid service interruption, please renew your subscription before it expires.'
      }
    },
    {
      name: 'Subscription Cancelled',
      userName: 'Jane Smith',
      title: 'Subscription Cancelled',
      statusColor: '#6c757d 0%, #495057 100%',
      statusIcon: '🚫',
      mainMessage: 'Your subscription has been cancelled',
      details: `
        <div class="detail-row">
          <span class="detail-label">Plan:</span>
          <span class="detail-value">Basic Plan</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cancellation Date:</span>
          <span class="detail-value">Dec 15, 2024</span>
        </div>
      `,
      actionButton: null
    },
    {
      name: 'Subscription Renewed',
      userName: 'Mike Johnson',
      title: 'Subscription Renewed',
      statusColor: '#28a745 0%, #20c997 100%',
      statusIcon: '✅',
      mainMessage: 'Your subscription has been renewed!',
      details: `
        <div class="detail-row">
          <span class="detail-label">Plan:</span>
          <span class="detail-value">Premium Plan</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Renewal Date:</span>
          <span class="detail-value">Dec 10, 2024</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">New Expiry Date:</span>
          <span class="detail-value">Dec 10, 2025</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">$99.99 USD</span>
        </div>
      `,
      actionButton: {
        text: 'Access Dashboard',
        url: 'https://example.com/dashboard',
        message: 'Thank you for continuing with our service. Your account is now active and all features are restored.'
      }
    }
  ];

  // Generate HTML files for each test case
  testCases.forEach((testCase, index) => {
    const html = createSubscriptionEmailTemplate(
      testCase.userName,
      testCase.title,
      testCase.statusColor,
      testCase.statusIcon,
      testCase.mainMessage,
      testCase.details,
      testCase.actionButton
    );

    const filename = `email-template-test-${index + 1}-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    const filepath = path.join(process.cwd(), filename);

    fs.writeFileSync(filepath, html);
    console.log(`✅ Generated: ${filename}`);
  });

  console.log('🎉 Email template testing completed!');
  console.log('📁 HTML files generated in the project root for manual inspection.');
};

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailTemplate();
}

export default testEmailTemplate;







