// Test script for subscription email notifications
import { sendSubscriptionCancelledNotification, sendSubscriptionExpiredNotification, sendSubscriptionRenewedNotification } from './utils/emailService.js';

const testEmails = async () => {
  console.log('🧪 Testing subscription email notifications...\n');

  const testData = {
    tenantEmail: 'test@example.com', // 🔴 REPLACE WITH YOUR REAL EMAIL ADDRESS
    tenantName: 'Test Tenant',
    planName: 'Premium Plan',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    amount: 99.99,
    currency: 'USD',
    resubscribeUrl: 'https://app.bookstorepro.com/resubscribe',
    renewUrl: 'https://app.bookstorepro.com/renew',
    accountUrl: 'https://app.bookstorepro.com/account'
  };

  try {
    console.log('📧 Testing cancelled notification...');
    await sendSubscriptionCancelledNotification(testData.tenantEmail, testData.tenantName, {
      planName: testData.planName,
      cancelledDate: new Date(),
      resubscribeUrl: testData.resubscribeUrl,
      accountUrl: testData.accountUrl
    });
    console.log('✅ Cancelled notification sent!\n');

    console.log('📧 Testing expired notification...');
    await sendSubscriptionExpiredNotification(testData.tenantEmail, testData.tenantName, {
      planName: testData.planName,
      endDate: testData.endDate,
      renewUrl: testData.renewUrl
    });
    console.log('✅ Expired notification sent!\n');

    console.log('📧 Testing renewed notification...');
    await sendSubscriptionRenewedNotification(testData.tenantEmail, testData.tenantName, {
      planName: testData.planName,
      renewalDate: new Date(),
      newEndDate: testData.renewalDate,
      amount: testData.amount,
      currency: testData.currency,
      accountUrl: testData.accountUrl
    });
    console.log('✅ Renewed notification sent!\n');

    console.log('🎉 All subscription email tests completed successfully!');
    console.log('💡 Check your email inbox (and spam folder) for the test emails.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('💡 Make sure your .env file has correct email credentials:');
    console.error('   EMAIL_USER=your_email@gmail.com');
    console.error('   EMAIL_PASSWORD=your_app_password');
    console.error('   EMAIL_FROM=your_email@gmail.com');
  }
};

// Run the test
testEmails().catch(console.error);
