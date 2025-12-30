import nodemailer from 'nodemailer';
import { sendVerificationCode, sendOTPEmail, sendHTMLEmail } from './email.js';

/**
 * Send subscription expiry notification to tenant admin
 */
export const sendSubscriptionExpiryNotification = async (tenantEmail, tenantName, subscriptionDetails) => {
  try {
    const { planName, endDate, daysLeft } = subscriptionDetails;

    const subject = 'Subscription Expiring Soon - ' + tenantName;

    const details = '<div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Plan:</span><span style="color: #333;">' + planName + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Expiry Date:</span><span style="color: #333;">' + new Date(endDate).toLocaleDateString() + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;"><span style="font-weight: 600; color: #495057;">Days Remaining:</span><span style="color: #333;">' + daysLeft + '</span></div>';

    const actionButton = {
      text: 'Renew Now',
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
      message: `Your subscription will expire in ${daysLeft} days. To avoid service interruption, please renew your subscription before it expires.`
    };

    const html = createSubscriptionEmailTemplate(
      tenantName,
      'Subscription Expiring Soon',
      '#f093fb 0%, #f5576c 100%',
      '⚠️',
      'Your subscription is about to expire',
      details,
      actionButton
    );

    await sendHTMLEmail(tenantEmail, 'Subscription Expiring Soon - ' + tenantName, html);
    console.log('✅ Subscription expiry notification sent to ' + tenantEmail);
  } catch (error) {
    console.error('❌ Error sending subscription expiry notification:', error);
    throw error;
  }
};

/**
 * Reusable HTML email template for subscription notifications
 */
const createSubscriptionEmailTemplate = (userName, title, statusColor, statusIcon, mainMessage, details, actionButton = null) => {
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + title + '</title></head><body style="font-family: \'system-ui, -apple-system, sans-serif\', line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;"><div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><div style="background: linear-gradient(135deg, ' + statusColor + '); padding: 30px 20px; text-align: center; color: white;"><h1 style="margin: 0; font-size: 24px; font-weight: 600;">' + statusIcon + ' ' + title + '</h1></div><div style="padding: 40px;"><p style="font-size: 18px; font-weight: 500; margin-bottom: 25px; color: #333;">Hello ' + userName + ',</p><div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0;"><h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 10px;">' + statusIcon + ' ' + mainMessage + '</h2><div style="background: white; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-top: 15px;">' + details + '</div></div><p style="font-size: 16px; color: #666; margin: 25px 0; line-height: 1.6;">' + (actionButton ? actionButton.message : 'Thank you for being part of our platform.') + '</p>' + (actionButton ? '<div style="text-align: center; margin: 35px 0;"><a href="' + actionButton.url + '" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">' + actionButton.text + '</a></div>' : '') + '<div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; margin-top: 30px;"><p style="margin: 5px 0;">This is an automated message. Please do not reply to this email.</p><p style="margin: 5px 0;">&copy; 2024 Bookstore Platform. All rights reserved.</p></div></div></div></body></html>';

  return html;
};

/**
 * Send subscription cancelled notification to tenant admin
 */
export const sendSubscriptionCancelledNotification = async (tenantEmail, tenantName, subscriptionDetails) => {
  try {
    console.log(`📧 Preparing to send subscription cancelled notification to ${tenantEmail}`);

    const { planName, cancelledDate, resubscribeUrl, accountUrl } = subscriptionDetails;

    const subject = 'Subscription Cancelled - ' + tenantName;

    const details = '<div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Plan:</span><span style="color: #333;">' + planName + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;"><span style="font-weight: 600; color: #495057;">Cancellation Date:</span><span style="color: #333;">' + new Date(cancelledDate).toLocaleDateString() + '</span></div>';

    const actionButton = {
      text: 'Resubscribe',
      url: resubscribeUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
      message: 'You can resubscribe at any time to regain access to all features.'
    };

    const html = createSubscriptionEmailTemplate(
      tenantName,
      'Subscription Cancelled',
      '#6c757d 0%, #495057 100%',
      '🚫',
      '<p class="text-base mb-4">We would like to inform you that your subscription has been <span class="text-red-600 font-semibold">cancelled</span>.</p><p class="text-sm text-gray-700">Your access to paid features has ended immediately. You can renew your subscription at any time to regain access.</p>',
      details,
      actionButton
    );

    await sendHTMLEmail(tenantEmail, 'Subscription Cancelled - ' + tenantName, html);
    console.log('✅ Subscription cancelled notification sent to ' + tenantEmail);
  } catch (error) {
    console.error('❌ Failed to send subscription cancelled notification to ' + tenantEmail + ':', error.message);
    console.error('❌ Error details:', error);
    // Don't throw error - just log it so subscription operations can continue
    console.log('⚠️ Continuing without sending email notification');
  }
};

/**
 * Send subscription expired notification to tenant admin
 */
export const sendSubscriptionExpiredNotification = async (tenantEmail, tenantName, subscriptionDetails) => {
  try {
    const { planName, endDate, renewUrl } = subscriptionDetails;

    const subject = 'Subscription Expired - ' + tenantName;

    const details = '<div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Plan:</span><span style="color: #333;">' + planName + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;"><span style="font-weight: 600; color: #495057;">Expiry Date:</span><span style="color: #333;">' + new Date(endDate).toLocaleDateString() + '</span></div>';

    const actionButton = {
      text: 'Renew Subscription',
      url: renewUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
      message: 'Your account has been suspended due to the expired subscription. To restore access, please renew your subscription immediately.'
    };

    const html = createSubscriptionEmailTemplate(
      tenantName,
      'Subscription Expired',
      '#dc3545 0%, #c82333 100%',
      '🚫',
      '<p class="text-base mb-4">Your subscription has <span class="text-yellow-600 font-semibold">expired</span> as the subscription period has ended.</p><p class="text-sm text-gray-700">To continue enjoying our services, please renew your subscription.</p>',
      details,
      actionButton
    );

    await sendHTMLEmail(tenantEmail, 'Subscription Expired - ' + tenantName, html);
    console.log('✅ Subscription expired notification sent to ' + tenantEmail);
  } catch (error) {
    console.error('❌ Error sending subscription expired notification:', error.message);
    console.error('❌ Error details:', error);
    // Don't throw error - just log it so subscription operations can continue
    console.log('⚠️ Continuing without sending email notification');
  }
};

/**
 * Send subscription renewed notification to tenant admin
 */
export const sendSubscriptionRenewedNotification = async (tenantEmail, tenantName, renewalDetails) => {
  try {
    const { planName, renewalDate, newEndDate, amount, currency, accountUrl } = renewalDetails;

    const subject = 'Subscription Renewed - ' + tenantName;

    const details = '<div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Plan:</span><span style="color: #333;">' + planName + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Renewal Date:</span><span style="color: #333;">' + new Date(renewalDate).toLocaleDateString() + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">New Expiry Date:</span><span style="color: #333;">' + new Date(newEndDate).toLocaleDateString() + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;"><span style="font-weight: 600; color: #495057;">Amount Paid:</span><span style="color: #333;">$' + amount + ' ' + currency + '</span></div>';

    const actionButton = {
      text: 'Access Dashboard',
      url: accountUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/superadmin/dashboard`,
      message: 'Thank you for continuing with our service. Your account is now active and all features are restored.'
    };

    const html = createSubscriptionEmailTemplate(
      tenantName,
      'Subscription Renewed',
      '#28a745 0%, #20c997 100%',
      '✅',
      '<p class="text-base mb-4">Great news! Your subscription has been <span class="text-green-600 font-semibold">successfully renewed</span>.</p><p class="text-sm text-gray-700">Thank you for continuing with us. Your access to all paid features remains active.</p>',
      details,
      actionButton
    );

    await sendHTMLEmail(tenantEmail, 'Subscription Renewed - ' + tenantName, html);
    console.log('✅ Subscription renewed notification sent to ' + tenantEmail);
  } catch (error) {
    console.error('❌ Error sending subscription renewed notification:', error.message);
    console.error('❌ Error details:', error);
    // Don't throw error - just log it so subscription operations can continue
    console.log('⚠️ Continuing without sending email notification');
  }
};

/**
 * Send admin access revoked notification
 */
export const sendAdminAccessRevokedNotification = async (adminEmail, adminName, tenantName, expiryDate) => {
  try {
    const subject = 'Account Suspended - ' + tenantName;

    const details = '<div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #f8f9fa;"><span style="font-weight: 600; color: #495057;">Tenant:</span><span style="color: #333;">' + tenantName + '</span></div><div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;"><span style="font-weight: 600; color: #495057;">Subscription Expired:</span><span style="color: #333;">' + new Date(expiryDate).toLocaleDateString() + '</span></div>';

    const html = createSubscriptionEmailTemplate(
      adminName,
      'Account Suspended',
      '#6c757d 0%, #5a6268 100%',
      '⚠️',
      'Your account has been suspended',
      details,
      null
    );

    await sendHTMLEmail(adminEmail, 'Account Suspended - ' + tenantName, html);
    console.log('✅ Admin access revoked notification sent to ' + adminEmail);
  } catch (error) {
    console.error('❌ Error sending admin access revoked notification:', error.message);
    console.error('❌ Error details:', error);
    // Don't throw error - just log it so subscription operations can continue
    console.log('⚠️ Continuing without sending email notification');
  }
};