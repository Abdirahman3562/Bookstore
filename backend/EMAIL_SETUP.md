# Email Configuration for OTP

To enable OTP emails to be sent to users, you need to configure email settings in your `.env` file.

## Option 1: Gmail (Recommended for Development)

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Bookstore OTP" as the name
   - Copy the generated 16-character password

4. Add to your `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM=your_email@gmail.com
```

## Option 2: SMTP (Any Email Provider)

Add to your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Option 3: Development Mode (No Email Sent)

If no email credentials are configured, the system will:
- Log the OTP to the console
- Show the OTP in the API response (development only)
- Display the OTP in the frontend toast message

This is useful for testing without setting up email.

## OTP Expiration

By default, OTP codes expire after 10 minutes. You can change this in your `.env` file:

```env
OTP_EXPIRATION_MINUTES=10
```

## Testing

After configuration, restart your backend server and try sending an OTP. Check:
1. Your email inbox for the OTP code
2. Backend console for any errors
3. Frontend toast message (in dev mode, OTP will be shown)

## Important Notes

- **Gmail App Password**: You MUST use an App Password, not your regular Gmail password
- **2-Step Verification**: Must be enabled on your Google Account
- **Email Delivery**: Check spam folder if email doesn't arrive
- **OTP Expiration**: OTP codes expire after the configured time (default: 10 minutes)

