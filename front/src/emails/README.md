# React Email Templates

Professional React email templates for the Bookstore Pro SaaS subscription system, built with Tailwind CSS.

## Templates

### 1. Subscription Cancelled (`SubscriptionCancelledEmail`)
**Purpose:** Notify users when their subscription has been cancelled

**Props:**
- `firstName` - User's first name
- `subscriptionName` - Name of the cancelled subscription
- `resubscribeUrl` - URL for resubscribing
- `accountUrl` - URL for managing account

### 2. Subscription Expired (`SubscriptionExpiredEmail`)
**Purpose:** Notify users when their subscription has expired

**Props:**
- `firstName` - User's first name
- `subscriptionName` - Name of the expired subscription
- `expiryDate` - Date when subscription expired
- `renewUrl` - URL for renewing subscription

### 3. Subscription Renewed (`SubscriptionRenewedEmail`)
**Purpose:** Confirm successful subscription renewal

**Props:**
- `firstName` - User's first name
- `subscriptionName` - Name of the renewed subscription
- `renewalDate` - New expiry date after renewal
- `accountUrl` - URL for managing account

## Usage

```jsx
import { SubscriptionCancelledEmail, SubscriptionExpiredEmail, SubscriptionRenewedEmail } from '../emails/components';

// Example usage
const cancelledEmail = (
  <SubscriptionCancelledEmail
    firstName="John"
    subscriptionName="Premium Plan"
    resubscribeUrl="https://app.bookstorepro.com/resubscribe"
    accountUrl="https://app.bookstorepro.com/account"
  />
);

const expiredEmail = (
  <SubscriptionExpiredEmail
    firstName="John"
    subscriptionName="Premium Plan"
    expiryDate="December 31, 2024"
    renewUrl="https://app.bookstorepro.com/renew"
  />
);

const renewedEmail = (
  <SubscriptionRenewedEmail
    firstName="John"
    subscriptionName="Premium Plan"
    renewalDate="January 31, 2025"
    accountUrl="https://app.bookstorepro.com/account"
  />
);
```

## Email Service Integration

To use these templates with an email service:

```jsx
import { renderToString } from 'react-dom/server';
import { SubscriptionCancelledEmail } from '../emails/components';

// Convert React component to HTML string
const htmlContent = renderToString(
  <SubscriptionCancelledEmail
    firstName="John"
    subscriptionName="Premium Plan"
    resubscribeUrl="https://app.bookstorepro.com/resubscribe"
    accountUrl="https://app.bookstorepro.com/account"
  />
);

// Send with your email service (e.g., SendGrid, Mailgun, etc.)
await emailService.send({
  to: 'user@example.com',
  subject: 'Subscription Cancelled',
  html: htmlContent
});
```

## Features

- **Mobile-Responsive:** Optimized for all screen sizes
- **Email Client Compatible:** Uses inline styles for better compatibility
- **Professional Design:** Clean, modern SaaS branding
- **Tailwind CSS:** Styled with utility-first CSS framework
- **Dynamic Content:** Supports all required placeholders
- **No OTP Codes:** Pure informational emails only

## Placeholders

Replace these placeholders with actual data:

- `{{firstName}}` - User's first name
- `{{subscriptionName}}` - Subscription plan name
- `{{expiryDate}}` - Expiration date (for expired emails)
- `{{renewalDate}}` - New expiry date (for renewed emails)
- `{{resubscribeUrl}}` - Link to resubscribe
- `{{renewUrl}}` - Link to renew subscription
- `{{accountUrl}}` - Link to account management

## Styling Notes

- Uses inline styles for email client compatibility
- Tailwind CSS classes are used in comments for reference
- Gradients and modern CSS features are email-client safe
- Responsive design works across all devices

## Important Notes

- **No OTP codes** are generated or sent with these templates
- These are purely informational emails about subscription status changes
- Authentication OTP codes remain separate and unchanged
- Templates are designed for transactional email services