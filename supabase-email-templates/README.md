# SmartShort Email Templates

This directory contains branded HTML email templates for Supabase Authentication. These templates are designed with SmartShort's brand identity using a dark theme with blue accents.

## 🎨 Brand Colors

- **Background**: `#0D1117` (Dark navy)
- **Card Background**: `#161B22` (Slightly lighter dark)
- **Primary Blue**: `#3A85FF`
- **Text**: `#FFFFFF` / `#E5E7EB`
- **Secondary Text**: `#9CA3AF` / `#6B7280`

## 📧 Templates Included

1. **01-confirm-signup.html** - Email verification for new signups
2. **02-invite-user.html** - Invite users who don't yet have an account
3. **03-reset-password.html** - Password reset email
4. **04-change-email.html** - Verify new email address after changing it
5. **05-magic-link.html** - Magic link for passwordless login
6. **06-reauthentication.html** - Re-authentication for sensitive actions

**Note**: OTP (One-Time Password) emails are typically handled through Magic Link or can be configured separately in Supabase Auth settings if OTP is enabled.

## 🚀 How to Deploy to Supabase

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Each Template

For each template file:

1. Open the HTML file in this directory
2. Copy the entire HTML content
3. In Supabase, select the corresponding template:
   - **Confirm sign up** → Paste `01-confirm-signup.html`
   - **Invite user** → Paste `02-invite-user.html`
   - **Reset password** → Paste `03-reset-password.html`
   - **Change email address** → Paste `04-change-email.html`
   - **Magic link** → Paste `05-magic-link.html`
   - **Reauthentication** → Paste `06-reauthentication.html`
4. Click **Save**

### Step 3: Configure Email Subject Lines

Update the subject lines in Supabase:

- **Confirm sign up**: `Verify Your SmartShort Account`
- **Invite user**: `You've Been Invited to SmartShort`
- **Reset password**: `Reset Your SmartShort Password`
- **Change email address**: `Verify Your New Email Address`
- **Magic link**: `Your SmartShort Magic Link`
- **Reauthentication**: `Re-authentication Required`

## 🔧 Supabase Configuration

### URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Add the following to **Site URL**:
   - `https://smartshort.in`
   - `http://localhost:3000` (for development)

3. Add to **Redirect URLs**:
   - `https://smartshort.in/auth/login`
   - `https://smartshort.in/auth/callback`
   - `https://smartshort.in/auth/reset-password`
   - `http://localhost:3000/auth/login`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

### Auth Settings

1. Go to **Authentication** → **Settings** → **Auth Config**
2. Enable:
   - ✅ **Email Confirmation Redirect Enabled**
   - ✅ **Generate a session automatically after email confirmation**

## 📝 Template Variables

Supabase provides these variables that are automatically replaced:

- `{{ .User.Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Verification/reset link URL
- `{{ .Token }}` - OTP code (for OTP emails)

## ✨ Features

- ✅ Fully responsive design
- ✅ Dark theme matching SmartShort brand
- ✅ Professional blue-themed CTA buttons
- ✅ Mobile-friendly layout
- ✅ Security notices and warnings
- ✅ Consistent branding across all emails

## 🎯 Testing

After deploying templates:

1. Test signup flow - verify email design
2. Test password reset - check email formatting
3. Test OTP (if enabled) - verify code display
4. Test on multiple email clients (Gmail, Outlook, Apple Mail)

## 📱 Email Client Compatibility

These templates are tested and compatible with:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (iOS, macOS)
- Yahoo Mail
- Other major email clients

---

**Note**: Always test email templates in a staging environment before deploying to production.

