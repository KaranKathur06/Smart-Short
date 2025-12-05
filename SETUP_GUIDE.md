# SmartShort - Complete Setup Guide

This guide will walk you through setting up SmartShort from scratch.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm or yarn
- Git
- A Supabase account ([Sign up free](https://supabase.com))

## Step-by-Step Setup

### 1. Clone the Repository

```bash
cd "c:/STUDY/FREELANCING PROJECTS/LINK SHORTNER"
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TailwindCSS
- Supabase client
- Lucide icons
- Recharts

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or email
4. Create a new organization
5. Create a new project:
   - **Project name**: `smartshort`
   - **Database password**: Create a strong password
   - **Region**: Choose closest to you
   - Click "Create new project"

Wait for the project to initialize (2-3 minutes).

### 4. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` (under "API URL")
   - `anon public` key (under "Project API keys")
   - `service_role` key (under "Project API keys" - click "Reveal")

### 5. Set Up Environment Variables

1. In the project root, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SmartShort

ADMIN_SECRET_KEY=your-secure-admin-key-here

NEXT_PUBLIC_AD_DISPLAY_DURATION=3000
NEXT_PUBLIC_AD_REVENUE_PER_CLICK=0.001

RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 6. Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `database/schema.sql`
4. Paste it into the SQL editor
5. Click **Run**

Wait for the query to complete. You should see:
- ✅ Tables created (users, links, movie_links, clicks)
- ✅ Indexes created
- ✅ RLS policies enabled
- ✅ Triggers created

### 7. Enable Email Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Find "Email" and make sure it's enabled
3. Go to **Email Templates** and verify they look good
4. (Optional) Configure SMTP for custom emails

### 8. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 9. Create Admin Account

1. Visit `http://localhost:3000/auth/signup`
2. Sign up with:
   - Email: `admin@example.com`
   - Password: `Admin@123456`
   - Name: `Admin User`

3. Go to Supabase → **Table Editor** → **users**
4. Find your user record
5. Change the `role` column from `user` to `admin`

### 10. Verify Setup

1. Visit `http://localhost:3000`
2. Click "Get Started"
3. Sign in with your admin account
4. You should see the dashboard

## Testing the Application

### Create a Test Link

1. Go to **My Links**
2. Click **Create Link**
3. Fill in:
   - Title: "Test Movie"
   - Add movie links:
     - 480p: `https://example.com/480p`
     - 720p: `https://example.com/720p`
     - 1080p: `https://example.com/1080p`
4. Click Create

### View Analytics

1. Go to **Analytics**
2. Select your link
3. View click data (will be empty initially)

### Check Admin Dashboard

1. Visit `http://localhost:3000/admin`
2. View platform statistics
3. See user management options

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Run `npm install` again

```bash
npm install
```

### Issue: Supabase connection fails

**Solution**: Check your `.env.local` file:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure there are no extra spaces

### Issue: Database tables not created

**Solution**: 
1. Go to Supabase SQL Editor
2. Run the schema.sql again
3. Check for error messages

### Issue: Can't sign up

**Solution**:
1. Check Supabase Authentication is enabled
2. Go to **Authentication** → **Providers** → **Email**
3. Make sure it's toggled ON

### Issue: Admin access denied

**Solution**:
1. Go to Supabase Table Editor
2. Find your user in the `users` table
3. Change `role` to `admin` (not `'admin'`, just `admin`)

### Issue: Redirects not working

**Solution**:
1. Check `NEXT_PUBLIC_APP_URL` matches your domain
2. For local development, it should be `http://localhost:3000`

## Database Schema Overview

### users
- `id`: UUID (Primary Key)
- `email`: Email address
- `role`: 'user' | 'admin' | 'banned'
- `created_at`: Timestamp
- `updated_at`: Timestamp

### links
- `id`: UUID (Primary Key)
- `user_id`: FK to users
- `slug`: Unique short code
- `main_title`: Link title
- `created_at`: Timestamp
- `expires_at`: Optional expiry date
- `earnings`: Total earnings
- `clicks`: Click count
- `is_active`: Active status

### movie_links
- `id`: UUID (Primary Key)
- `link_id`: FK to links
- `quality`: '480p' | '720p' | '1080p'
- `target_url`: Destination URL
- `created_at`: Timestamp

### clicks
- `id`: UUID (Primary Key)
- `link_id`: FK to links
- `timestamp`: Click time
- `country`: Country (from IP)
- `city`: City (from IP)
- `device`: 'desktop' | 'mobile' | 'tablet'
- `os`: Operating system
- `referrer`: Referrer source
- `earnings`: Earnings from this click
- `ip_hash`: Hashed IP for privacy

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/callback` - OAuth callback

### Links
- `POST /api/links/create` - Create link
- `GET /api/links/list` - List user's links
- `DELETE /api/links/delete?id=linkId` - Delete link

### Redirect
- `GET /api/redirect/[slug]` - Redirect with ad

### Analytics
- `GET /api/analytics?linkId=id&period=7d` - Get analytics

### Admin
- `GET /api/admin/stats` - Platform stats
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users` - Manage users

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smartshort.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
   - `ADMIN_SECRET_KEY`
5. Click "Deploy"

### 3. Update Supabase CORS

1. Go to Supabase → **Project Settings** → **API**
2. Add your Vercel domain to CORS allowed origins

## Next Steps

1. **Customize branding**: Update colors in `tailwind.config.js`
2. **Add payment integration**: Implement Stripe/Razorpay
3. **Set up email notifications**: Configure Supabase SMTP
4. **Add more analytics**: Integrate Google Analytics
5. **Implement withdrawal system**: Add payment processing

## Support

For issues or questions:
1. Check the README.md
2. Review the troubleshooting section above
3. Check Supabase documentation
4. Check Next.js documentation

## Security Checklist

- [ ] Change `ADMIN_SECRET_KEY` to a strong random value
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting (upgrade to Redis)
- [ ] Enable RLS policies in Supabase
- [ ] Set up backup strategy
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets

---

**Happy coding! 🚀**
