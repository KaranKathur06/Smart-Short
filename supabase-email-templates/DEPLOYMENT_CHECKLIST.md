# Supabase Email Templates Deployment Checklist

## ✅ Pre-Deployment Verification

Before deploying templates to Supabase, verify each template has:

- [ ] `<meta name="supabase:subject" content="...">` in `<head>` section
- [ ] `{{ .ConfirmationURL }}` appears in button link
- [ ] `{{ .ConfirmationURL }}` appears as fallback text link
- [ ] `{{ .User.Email }}` appears in greeting
- [ ] No unsupported variables (only `.ConfirmationURL` and `.User.Email`)
- [ ] All CSS is inline
- [ ] Table-based layout structure
- [ ] No external CSS or JavaScript
- [ ] All image URLs use HTTPS (if any)

---

## 📧 Template Mapping

| Template File | Supabase Template Name | Subject Line |
|--------------|----------------------|--------------|
| `01-confirm-signup.html` | **Confirm sign up** | Confirm your SmartShort account 🚀 |
| `02-invite-user.html` | **Invite user** | You're invited to SmartShort 🎉 |
| `03-reset-password.html` | **Reset password** | Reset your SmartShort password 🔐 |
| `04-change-email.html` | **Change email address** | Verify your SmartShort email change request |
| `05-magic-link.html` | **Magic link** | Your SmartShort login link ✨ |
| `06-reauthentication.html` | **Reauthentication** | Verify to continue — SmartShort Security |

---

## 🚀 Step-by-Step Deployment

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Deploy Each Template

For **each** of the 6 templates:

#### A. HTML Version

1. Click on the template name (e.g., "Confirm sign up")
2. In the **HTML** editor, delete existing content
3. Copy the entire HTML from the corresponding file:
   - `01-confirm-signup.html` → Paste in "Confirm sign up"
   - `02-invite-user.html` → Paste in "Invite user"
   - `03-reset-password.html` → Paste in "Reset password"
   - `04-change-email.html` → Paste in "Change email address"
   - `05-magic-link.html` → Paste in "Magic link"
   - `06-reauthentication.html` → Paste in "Reauthentication"
4. Click **Save**

#### B. Plain Text Version

1. In the same template editor, find the **Text Version** tab/editor
2. Copy the corresponding plain text from `PLAIN_TEXT_VERSIONS.md`
3. Paste into the **Text Version** editor
4. Click **Save**

### Step 3: Verify Template Preview

1. After saving each template, check the **Preview** section
2. Verify:
   - Subject line appears correctly
   - Variables show as placeholders (not errors)
   - Layout renders properly
   - No parsing errors

### Step 4: Test Email Delivery

1. Go to **Authentication** → **Users**
2. Create a test user or use existing user
3. Trigger each email type:
   - **Signup**: Create new account
   - **Password Reset**: Click "Forgot password"
   - **Magic Link**: Request magic link login
   - **Invite**: Invite a user (if admin)
4. Check email inbox for delivery
5. Verify links work correctly

---

## 🔧 Troubleshooting

### Issue: Emails not sending

**Solutions:**
- ✅ Verify plain text version is added (REQUIRED)
- ✅ Check subject meta tag exists in HTML
- ✅ Ensure `{{ .ConfirmationURL }}` is present
- ✅ Check Supabase email logs in dashboard
- ✅ Verify email service is enabled

### Issue: Template preview shows errors

**Solutions:**
- ✅ Check for unsupported variables
- ✅ Verify all `{{ }}` syntax is correct
- ✅ Ensure no broken HTML tags
- ✅ Check for missing closing tags

### Issue: Links not working

**Solutions:**
- ✅ Verify redirect URLs are configured in Supabase
- ✅ Check `{{ .ConfirmationURL }}` is in both button and fallback
- ✅ Test link in email client
- ✅ Verify callback route is set up correctly

---

## ✅ Final Verification Checklist

After deployment, confirm:

- [ ] All 6 templates deployed with HTML versions
- [ ] All 6 templates have plain text versions
- [ ] Subject lines appear correctly in preview
- [ ] Test signup email arrives successfully
- [ ] Test password reset email arrives successfully
- [ ] All email links redirect correctly
- [ ] Emails render properly in Gmail, Outlook, Apple Mail
- [ ] No errors in Supabase email logs

---

## 📝 Notes

- **Plain text versions are REQUIRED** - Supabase will not send emails without them
- **Subject meta tag is REQUIRED** - Without it, Supabase rejects the template
- **Variables must be exact** - Use `{{ .ConfirmationURL }}` and `{{ .User.Email }}` exactly as shown
- **Test thoroughly** - Always test each email type after deployment

---

**Last Updated**: 2025
**Status**: Ready for Deployment ✅

