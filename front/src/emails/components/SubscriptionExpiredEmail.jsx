import React from 'react';

const SubscriptionExpiredEmail = ({
  firstName = '{{firstName}}',
  subscriptionName = '{{subscriptionName}}',
  expiryDate = '{{expiryDate}}',
  renewUrl = '{{renewUrl}}'
}) => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold' }}>Bookstore Pro</h1>
        <p style={{ margin: '8px 0 0 0', opacity: '0.9', fontSize: '14px' }}>Professional Book Management Platform</p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 20px' }}>
        {/* Greeting */}
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
          Hi {firstName},
        </h2>

        {/* Expiration Notice */}
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '24px', margin: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
              <span style={{ color: 'white', fontSize: '16px' }}>⚠️</span>
            </div>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>Subscription Expired</h3>
          </div>

          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Subscription Details:</p>
            <p style={{ margin: '4px 0', color: '#1f2937', fontSize: '14px' }}><strong>{subscriptionName}</strong></p>
            <p style={{ margin: '4px 0', color: '#1f2937', fontSize: '14px' }}>Expired on: <strong>{expiryDate}</strong></p>
          </div>

          <p style={{ margin: '0', color: '#92400e', fontSize: '14px', lineHeight: '1.5' }}>
            To restore full access to your Bookstore Pro account, please renew your subscription immediately.
          </p>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={renewUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '14px 28px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)'
            }}
          >
            Renew Now
          </a>
        </div>

        {/* Limited Access Info */}
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px', margin: '24px 0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>Limited Access Active</h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#dc2626', fontSize: '14px', lineHeight: '1.6' }}>
            <li>You can still view your data but cannot make changes</li>
            <li>Export functionality is available for 30 days</li>
            <li>Renew now to restore full functionality immediately</li>
          </ul>
        </div>

        {/* Payment Reminder */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', margin: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💳</span>
            <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>Payment Information</h4>
          </div>
          <p style={{ margin: '0', color: '#1e40af', fontSize: '14px', lineHeight: '1.5' }}>
            Your saved payment method will be charged upon renewal. No action needed - just click "Renew Now" above.
          </p>
        </div>

        {/* Support */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
            Having trouble renewing? Our support team is ready to help.
          </p>
          <a
            href="mailto:support@bookstorepro.com"
            style={{ color: '#dc2626', textDecoration: 'none', fontWeight: '500' }}
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

export default SubscriptionExpiredEmail;

