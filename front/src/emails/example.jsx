// Example usage of React Email Templates
import React from 'react';
import { SubscriptionCancelledEmail, SubscriptionExpiredEmail, SubscriptionRenewedEmail } from './components';

// Example data
const userData = {
  firstName: 'John',
  subscriptionName: 'Premium Plan'
};

const urls = {
  resubscribeUrl: 'https://app.bookstorepro.com/resubscribe',
  renewUrl: 'https://app.bookstorepro.com/renew',
  accountUrl: 'https://app.bookstorepro.com/account'
};

// Example: Subscription Cancelled Email
export const CancelledEmailExample = () => (
  <SubscriptionCancelledEmail
    firstName={userData.firstName}
    subscriptionName={userData.subscriptionName}
    resubscribeUrl={urls.resubscribeUrl}
    accountUrl={urls.accountUrl}
  />
);

// Example: Subscription Expired Email
export const ExpiredEmailExample = () => (
  <SubscriptionExpiredEmail
    firstName={userData.firstName}
    subscriptionName={userData.subscriptionName}
    expiryDate="December 31, 2024"
    renewUrl={urls.renewUrl}
  />
);

// Example: Subscription Renewed Email
export const RenewedEmailExample = () => (
  <SubscriptionRenewedEmail
    firstName={userData.firstName}
    subscriptionName={userData.subscriptionName}
    renewalDate="January 31, 2025"
    accountUrl={urls.accountUrl}
  />
);

// Usage with email service
export const sendEmails = async () => {
  const { renderToString } = await import('react-dom/server');

  // Cancelled email
  const cancelledHtml = renderToString(<CancelledEmailExample />);
  await emailService.send({
    to: 'user@example.com',
    subject: 'Subscription Cancelled',
    html: cancelledHtml
  });

  // Expired email
  const expiredHtml = renderToString(<ExpiredEmailExample />);
  await emailService.send({
    to: 'user@example.com',
    subject: 'Your Subscription has Expired',
    html: expiredHtml
  });

  // Renewed email
  const renewedHtml = renderToString(<RenewedEmailExample />);
  await emailService.send({
    to: 'user@example.com',
    subject: 'Subscription Renewed Successfully',
    html: renewedHtml
  });
};







