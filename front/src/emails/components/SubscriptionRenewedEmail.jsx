import React from 'react';

const SubscriptionRenewedEmail = ({
  firstName = '{{firstName}}',
  subscriptionName = '{{subscriptionName}}',
  renewalDate = '{{renewalDate}}',
  accountUrl = '{{accountUrl}}'
}) => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold' }}>Bookstore Pro</h1>
        <p style={{ margin: '8px 0 0 0', opacity: '0.9', fontSize: '14px' }}>Professional Book Management Platform</p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 20px' }}>
        {/* Greeting */}
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
          Hi {firstName},
        </h2>

        {/* Renewal Confirmation */}
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '24px', margin: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
              <span style={{ color: 'white', fontSize: '16px' }}>✅</span>
            </div>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#065f46' }}>Subscription Renewed!</h3>
          </div>

          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Renewal Details:</p>
            <p style={{ margin: '4px 0', color: '#1f2937', fontSize: '14px' }}><strong>{subscriptionName}</strong></p>
            <p style={{ margin: '4px 0', color: '#1f2937', fontSize: '14px' }}>Next billing date: <strong>{renewalDate}</strong></p>
          </div>

          <p style={{ margin: '0', color: '#065f46', fontSize: '14px', lineHeight: '1.5' }}>
            Thank you for continuing your journey with Bookstore Pro! Your subscription has been successfully renewed and all features are now fully accessible.
          </p>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={accountUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
          >
            Manage Account
          </a>
        </div>

        {/* What's New / Benefits */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', margin: '24px 0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>⚡</span>
            Keep Exploring Bookstore Pro
          </h4>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Continue managing your book inventory seamlessly</li>
            <li>Access all premium features and analytics</li>
            <li>Enjoy priority customer support</li>
            <li>Stay updated with the latest platform enhancements</li>
          </ul>
        </div>

        {/* Appreciation Message */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: '24px', borderRadius: '8px', margin: '24px 0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#065f46' }}>Thank You for Your Continued Trust</h4>
          <p style={{ margin: '0', color: '#065f46', fontSize: '14px', lineHeight: '1.5' }}>
            We're committed to helping you grow your bookstore business. Your success is our success!
          </p>
        </div>

        {/* Support */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
            Questions about your subscription? We're here to help.
          </p>
          <a
            href="mailto:support@bookstorepro.com"
            style={{ color: '#10b981', textDecoration: 'none', fontWeight: '500' }}
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

export default SubscriptionRenewedEmail;




