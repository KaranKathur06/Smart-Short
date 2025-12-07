# Plain Text Fallback Versions for Supabase Email Templates

⚠️ **IMPORTANT**: These plain text versions MUST be added in Supabase Dashboard → Authentication → Email Templates → [Template Name] → Text Version editor.

Without these, emails will silently fail to send.

---

## 1. Confirm Signup (Text Version)

```
Hi {{ .User.Email }},

Thank you for joining SmartShort! We're excited to have you on board.

To get started and start earning, please verify your email address by clicking the link below:

{{ .ConfirmationURL }}

This verification link will expire in 24 hours.

If you didn't create an account with SmartShort, you can safely ignore this email.

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 2. Invite User (Text Version)

```
Hi {{ .User.Email }},

You've been invited to join SmartShort! We're excited to have you on board.

Click the link below to accept the invitation and create your account:

{{ .ConfirmationURL }}

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 3. Reset Password (Text Version)

```
Hi {{ .User.Email }},

We received a request to reset your password.

Click the link below to create a new password for your SmartShort account:

{{ .ConfirmationURL }}

This link will expire in 1 hour for security reasons.

⚠️ Important: If you didn't request a password reset, you can safely ignore this email. Your account is safe and no changes have been made.

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 4. Change Email Address (Text Version)

```
Hi {{ .User.Email }},

You've requested to change your email address.

To complete this change, please verify your new email address by clicking the link below:

{{ .ConfirmationURL }}

Security Tip: If you didn't request this email change, please ignore this email and contact our support team immediately.

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 5. Magic Link (Text Version)

```
Hi {{ .User.Email }},

Click the link below to sign in to your SmartShort account. This magic link will log you in instantly without needing a password:

{{ .ConfirmationURL }}

🔒 Security: This magic link will expire in 1 hour. If you didn't request this, you can safely ignore this email.

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 6. Reauthentication (Text Version)

```
Hi {{ .User.Email }},

For security reasons, you need to re-authenticate before performing a sensitive action on your SmartShort account.

Click the link below to verify your identity:

{{ .ConfirmationURL }}

⚠️ Important: This link will expire in 1 hour. If you didn't request this action, please ignore this email and contact our support team immediately.

Need help? Contact us at support@smartshort.in

© 2025 SmartShort. All rights reserved.
https://smartshort.in
```

---

## 📋 Deployment Checklist

For each template in Supabase Dashboard:

1. ✅ Open **Authentication** → **Email Templates**
2. ✅ Click on the template (e.g., "Confirm sign up")
3. ✅ Paste the HTML version in the **HTML** editor
4. ✅ Paste the corresponding plain text version in the **Text Version** editor
5. ✅ Click **Save**
6. ✅ Repeat for all 6 templates

---

## ✅ Verification

After deploying:

1. Test signup flow → Check email arrives
2. Test password reset → Check email arrives
3. Verify all links work correctly
4. Check email renders properly in Gmail, Outlook, Apple Mail

---

**Note**: The `{{ .ConfirmationURL }}` and `{{ .User.Email }}` variables are automatically replaced by Supabase when sending emails.

