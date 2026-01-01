import React from 'react';

const SubscriptionCancelledEmail = ({
  firstName = '{{firstName}}',
  subscriptionName = '{{subscriptionName}}',
  resubscribeUrl = '{{resubscribeUrl}}',
  accountUrl = '{{accountUrl}}'
}) => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold' }}>Bookstore Pro</h1>
        <p style={{ margin: '8px 0 0 0', opacity: '0.9', fontSize: '14px' }}>Professional Book Management Platform</p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 20px' }}>
        {/* Greeting */}
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
          Hi {firstName},
        </h2>

        {/* Cancellation Notice */}
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '24px', margin: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
              <span style={{ color: 'white', fontSize: '16px' }}>🚫</span>
            </div>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>Subscription Cancelled</h3>
          </div>

          <p style={{ margin: '0 0 16px 0', color: '#dc2626', fontSize: '16px', lineHeight: '1.5' }}>
            Your <strong>{subscriptionName}</strong> subscription has been successfully cancelled.
          </p>

          <p style={{ margin: '0', color: '#dc2626', fontSize: '14px', lineHeight: '1.5' }}>
            We're sorry to see you go. You can resubscribe at any time to regain access to all features.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={resubscribeUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              marginRight: '12px',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
          >
            Resubscribe
          </a>

          <a
            href={accountUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(107, 114, 128, 0.3)'
            }}
          >
            Manage Account
          </a>
        </div>

        {/* Additional Information */}
        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', margin: '24px 0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>What happens next?</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Your subscription will remain active until the current billing period ends</li>
            <li>You can resubscribe at any time without losing your data</li>
            <li>Your account and all stored information will be preserved</li>
          </ul>
        </div>

        {/* Support */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
            Need help or have questions? Our support team is here for you.
          </p>
          <a
            href="mailto:support@bookstorepro.com"
            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
          >
            Contact Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#f9fafb', padding: '24px 20px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px' }}>
          © 2024 Bookstore Pro. All rights reserved.
        </p>
        <p style={{ margin: '0', color: '#9ca3af', fontSize: '12px' }}>
          You're receiving this email because you have an account with us.
        </p>
        <div style={{ marginTop: '16px' }}>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '12px', margin: '0 8px' }}>Unsubscribe</a>
          <span style={{ color: '#d1d5db', fontSize: '12px' }}>•</span>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '12px', margin: '0 8px' }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelledEmail;




