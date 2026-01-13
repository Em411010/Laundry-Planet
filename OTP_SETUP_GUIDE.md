# OTP Email Verification Setup Guide

## Overview
The Laundry Planet application now includes email verification using OTP (One-Time Password) sent via Brevo (formerly Sendinblue).

## Features Implemented

### Backend
- ✅ OTP generation (6-digit code)
- ✅ Email sending via Brevo API
- ✅ OTP expiry (10 minutes)
- ✅ Email verification check on login
- ✅ Resend OTP functionality
- ✅ Welcome email after successful verification

### Frontend
- ✅ OTP verification page with 6-digit input
- ✅ Auto-focus and paste support
- ✅ Resend OTP with 60-second cooldown
- ✅ Redirect to verification if email not verified on login

## Setup Instructions

### 1. Create Brevo Account
1. Go to https://www.brevo.com/
2. Sign up for a free account
3. Verify your account via email

### 2. Get API Key
1. Log in to Brevo dashboard
2. Go to **Settings** > **SMTP & API** > **API Keys**
3. Click "Generate a new API key"
4. Copy the API key

### 3. Add Sender Email
1. Go to **Senders** in Brevo dashboard
2. Add and verify your sender email address
3. Follow the verification process (DNS records or email confirmation)

### 4. Configure Backend Environment
1. Navigate to `backend` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your credentials:
   ```env
   BREVO_API_KEY=your-actual-api-key-here
   BREVO_SENDER_EMAIL=your-verified-email@yourdomain.com
   FRONTEND_URL=http://localhost:5173
   ```

### 5. Install Dependencies
```bash
cd backend
npm install
```

The `@getbrevo/brevo` package is already installed.

### 6. Start the Application
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## How It Works

### Registration Flow
1. User fills registration form
2. Backend generates 6-digit OTP
3. OTP is saved to user document with 10-minute expiry
4. Email is sent via Brevo with OTP
5. User redirected to OTP verification page
6. User enters OTP
7. Backend verifies OTP and marks email as verified
8. Welcome email is sent
9. User is logged in and redirected to dashboard

### Login Flow
1. User enters email and password
2. Backend checks if email is verified
3. If not verified:
   - Returns error message
   - Frontend redirects to OTP verification page
4. If verified:
   - User is logged in normally

## API Endpoints

### POST /api/auth/register
Creates user account and sends OTP email.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the OTP.",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "firstName": "John"
  }
}
```

### POST /api/auth/verify-otp
Verifies OTP code and activates account.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

### POST /api/auth/resend-otp
Generates and sends new OTP.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully. Please check your email."
}
```

### POST /api/auth/login
Modified to check email verification.

**Response (if not verified):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "requiresVerification": true
}
```

## Email Templates

### OTP Email
- Professional design with Laundry Planet branding
- 6-digit code prominently displayed
- 10-minute expiry notice
- Security warning

### Welcome Email
- Congratulations message
- Getting started guide
- Quick actions
- Dashboard link

## User Model Updates

```javascript
{
  isEmailVerified: Boolean, // default: false
  otp: String, // 6-digit code
  otpExpiry: Date, // 10 minutes from generation
}
```

## Frontend Components

### VerifyOTPPage
- Location: `frontend/src/pages/public/VerifyOTPPage.jsx`
- Features:
  - 6-digit input fields with auto-focus
  - Paste support
  - Resend OTP button with cooldown
  - Email display
  - Error and success messages

## Testing

### Test the Flow
1. Register a new account with your real email
2. Check your email for OTP (check spam folder)
3. Enter OTP on verification page
4. Verify successful login
5. Check for welcome email

### Test Resend
1. On OTP page, click "Resend OTP"
2. Wait for cooldown (60 seconds)
3. Check email for new OTP

### Test Login Without Verification
1. Create account but don't verify
2. Try to login
3. Should redirect to OTP page

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify sender email is confirmed in Brevo
- Check Brevo API key is correct
- Check Brevo account sending limit

### API Key Issues
- Ensure no spaces in API key
- Verify key has transactional email permissions
- Check key is active in Brevo dashboard

### OTP Expired
- OTP is valid for 10 minutes
- Click "Resend OTP" to get new code

## Production Checklist
- [ ] Update `FRONTEND_URL` in production `.env`
- [ ] Use production-grade email sender
- [ ] Monitor Brevo sending limits
- [ ] Set up proper DNS records for sender domain
- [ ] Test email delivery in production
- [ ] Configure DKIM/SPF for better deliverability

## Brevo Free Tier Limits
- 300 emails per day
- Unlimited contacts
- Sufficient for development and small production

## Security Features
- OTP expires after 10 minutes
- OTP deleted after successful verification
- Resend cooldown prevents spam
- Email verification required before login
- Secure password hashing
- JWT token authentication

## Next Steps
Consider adding:
- Password reset with OTP
- Phone number verification (SMS OTP)
- Two-factor authentication (2FA)
- Email notification preferences
- Account deactivation emails
