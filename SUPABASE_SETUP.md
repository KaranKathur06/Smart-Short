# Supabase Authentication Setup Guide for SmartShort

This guide will help you configure Supabase Authentication with branded email templates and proper redirect handling.

## 📋 Prerequisites

- Supabase project created
- Access to Supabase Dashboard
- Production domain: `https://smartshort.in`
- Development domain: `http://localhost:3000`

---

## 🔧 Part 1: URL Configuration

### Step 1: Configure Site URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://smartshort.in`
3. Click **Save**

### Step 2: Add Redirect URLs

In the same section, add the following to **Redirect URLs**:

```
https://smartshort.in/auth/login
https://smartshort.in/auth/callback
https://smartshort.in/auth/reset-password
http://localhost:3000/auth/login
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
```

**Important**: Add both production and localhost URLs for development.

---

## 📧 Part 2: Email Templates Configuration

### Step 1: Access Email Templates

1. Go to **Authentication** → **Email Templates**
2. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password
   - OTP

### Step 2: Update Confirm Signup Template

1. Click on **Confirm sign up** template
2. Copy the content from `supabase-email-templates/01-confirm-signup.html`
3. Paste into the HTML editor
4. Set **Subject** to: `Verify Your SmartShort Account`
5. Click **Save**

### Step 3: Update Invite User Template

1. Click on **Invite user** template
2. Copy the content from `supabase-email-templates/02-invite-user.html`
3. Paste into the HTML editor
4. Set **Subject** to: `You've Been Invited to SmartShort`
5. Click **Save**

### Step 4: Update Reset Password Template

1. Click on **Reset password** template
2. Copy the content from `supabase-email-templates/03-reset-password.html`
3. Paste into the HTML editor
4. Set **Subject** to: `Reset Your SmartShort Password`
5. Click **Save**

### Step 5: Update Change Email Address Template

1. Click on **Change email address** template
2. Copy the content from `supabase-email-templates/04-change-email.html`
3. Paste into the HTML editor
4. Set **Subject** to: `Verify Your New Email Address`
5. Click **Save**

### Step 6: Update Magic Link Template

1. Click on **Magic link** template
2. Copy the content from `supabase-email-templates/05-magic-link.html`
3. Paste into the HTML editor
4. Set **Subject** to: `Your SmartShort Magic Link`
5. Click **Save**

### Step 7: Update Reauthentication Template

1. Click on **Reauthentication** template
2. Copy the content from `supabase-email-templates/06-reauthentication.html`
3. Paste into the HTML editor
4. Set **Subject** to: `Re-authentication Required`
5. Click **Save**

---

## ⚙️ Part 3: Auth Settings Configuration

### Step 1: Enable Email Confirmation

1. Go to **Authentication** → **Settings** → **Auth Config**
2. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is checked
   - ✅ **Email Confirmation Redirect Enabled** is checked
   - ✅ **Generate a session automatically after email confirmation** is checked

### Step 2: Configure Email Settings

1. In the same section, scroll to **Email** settings
2. Configure:
   - **SMTP Host**: (Optional - use custom SMTP if needed)
   - **SMTP Port**: (If using custom SMTP)
   - **SMTP User**: (If using custom SMTP)
   - **SMTP Password**: (If using custom SMTP)

**Note**: By default, Supabase uses their email service. You can configure custom SMTP for better deliverability.

---

## 🔐 Part 4: Frontend Configuration

### Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://smartshort.in
```

### Signup Flow

The signup page (`app/auth/signup/page.tsx`) is already configured with:
- ✅ `emailRedirectTo` pointing to login page
- ✅ Toast notifications for success/error
- ✅ Proper error handling

### Callback Handler

The callback route (`app/api/auth/callback/route.ts`) handles:
- ✅ Email verification redirects
- ✅ Password reset token handling
- ✅ OAuth callbacks

---

## ✅ Part 5: Testing Checklist

### Test Signup Flow

1. [ ] Sign up with a new email
2. [ ] Check email inbox for verification email
3. [ ] Verify email design matches brand
4. [ ] Click verification link
5. [ ] Verify redirect to login page
6. [ ] Check for success toast: "🎉 Email Verified Successfully!"
7. [ ] Login with verified account

### Test Password Reset

1. [ ] Go to login page
2. [ ] Click "Forgot your password?"
3. [ ] Enter email address
4. [ ] Check email inbox for reset email
5. [ ] Verify email design
6. [ ] Click reset link
7. [ ] Verify redirect to reset password page
8. [ ] Set new password
9. [ ] Verify redirect to login
10. [ ] Login with new password

### Test OTP (if enabled)

1. [ ] Request OTP login
2. [ ] Check email for OTP code
3. [ ] Verify OTP code is clearly displayed
4. [ ] Verify expiration notice (10 minutes)

---

## 🚨 Troubleshooting

### Issue: Email not received

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email logs in dashboard
- Ensure email templates are saved correctly

### Issue: Redirect not working

**Solutions**:
- Verify redirect URLs are added in Supabase dashboard
- Check `NEXT_PUBLIC_APP_URL` environment variable
- Ensure callback route is accessible
- Check browser console for errors

### Issue: Email templates not rendering

**Solutions**:
- Verify HTML is valid (no syntax errors)
- Check Supabase template editor for errors
- Test with a simple template first
- Ensure all variables ({{ .User.Email }}) are correct

### Issue: Session not created after verification

**Solutions**:
- Enable "Generate a session automatically after email confirmation"
- Check callback route is handling verification correctly
- Verify redirect URL is correct

---

## 📊 Email Template Variables Reference

Supabase provides these variables in email templates:

| Variable | Description | Available In |
|----------|-------------|--------------|
| `{{ .User.Email }}` | User's email address | All templates |
| `{{ .ConfirmationURL }}` | Verification/reset link | Signup, Reset Password, Magic Link |
| `{{ .Token }}` | OTP code | OTP template |
| `{{ .SiteURL }}` | Your site URL | All templates |
| `{{ .RedirectTo }}` | Redirect URL after action | All templates |

---

## 🎨 Brand Guidelines

When customizing templates, maintain:

- **Background**: `#0D1117` (Dark navy)
- **Primary Blue**: `#3A85FF`
- **Text**: `#FFFFFF` / `#E5E7EB`
- **Font**: System fonts (San Francisco, Segoe UI, Roboto)
- **Button Style**: Rounded corners, blue background, white text
- **Tone**: Professional, friendly, security-focused

---

## 📞 Support

If you encounter issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Review email template syntax
3. Check application logs
4. Contact support: support@smartshort.in

---

## ✅ Final Checklist

Before going to production:

- [ ] All email templates deployed
- [ ] Redirect URLs configured
- [ ] Auth settings enabled
- [ ] Environment variables set
- [ ] Tested signup flow
- [ ] Tested password reset
- [ ] Tested email verification
- [ ] Mobile email client testing
- [ ] Production domain configured
- [ ] SSL certificate valid

---

**Last Updated**: 2024
**Version**: 1.0

