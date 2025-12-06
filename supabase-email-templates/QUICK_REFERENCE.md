# Quick Reference: Supabase Email Templates

## 📋 Template Mapping

Match each Supabase template with the corresponding HTML file:

| Supabase Template | HTML File | Subject Line |
|-------------------|-----------|--------------|
| **Confirm sign up** | `01-confirm-signup.html` | `Verify Your SmartShort Account` |
| **Invite user** | `02-invite-user.html` | `You've Been Invited to SmartShort` |
| **Reset password** | `03-reset-password.html` | `Reset Your SmartShort Password` |
| **Change email address** | `04-change-email.html` | `Verify Your New Email Address` |
| **Magic link** | `05-magic-link.html` | `Your SmartShort Magic Link` |
| **Reauthentication** | `06-reauthentication.html` | `Re-authentication Required` |

## 🚀 Quick Setup Steps

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click on each template (one by one)
3. Copy the HTML from the corresponding file
4. Paste into Supabase's HTML editor
5. Update the subject line
6. Click **Save**
7. Repeat for all 6 templates

## ✅ Checklist

- [ ] Confirm sign up template updated
- [ ] Invite user template updated
- [ ] Reset password template updated
- [ ] Change email address template updated
- [ ] Magic link template updated
- [ ] Reauthentication template updated
- [ ] All subject lines updated
- [ ] Tested signup email
- [ ] Tested password reset email

---

**Note**: OTP emails are not a separate template in Supabase. If you need OTP functionality, it's typically handled through Magic Link or configured in Auth settings.

