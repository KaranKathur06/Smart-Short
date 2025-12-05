# SmartShort - Quick Start Guide

Get SmartShort running in 10 minutes!

## Prerequisites
- Node.js 18+
- Supabase account (free)

## 5-Minute Setup

### 1. Install & Configure

```bash
cd "c:/STUDY/FREELANCING PROJECTS/LINK SHORTNER"
npm install
cp .env.example .env.local
```

### 2. Add Supabase Credentials to `.env.local`

Get these from [supabase.com](https://supabase.com):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Create Database

1. In Supabase, go to **SQL Editor**
2. Create new query
3. Copy-paste from `database/schema.sql`
4. Click **Run**

### 4. Start Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Create Admin Account

1. Sign up at `/auth/signup`
2. In Supabase, update your user: `role = 'admin'`
3. Access `/admin`

## Done! 🎉

## Key URLs

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Login | `http://localhost:3000/auth/login` |
| Signup | `http://localhost:3000/auth/signup` |
| Dashboard | `http://localhost:3000/dashboard` |
| My Links | `http://localhost:3000/links` |
| Analytics | `http://localhost:3000/analytics` |
| Earnings | `http://localhost:3000/earnings` |
| Admin | `http://localhost:3000/admin` |

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## File Structure

```
app/
├── api/              # API endpoints
├── auth/             # Auth pages
├── dashboard/        # Dashboard page
├── links/            # Links page
├── analytics/        # Analytics page
├── earnings/         # Earnings page
└── admin/            # Admin page

lib/
├── supabase.ts       # Supabase client
├── utils.ts          # Utilities
└── middleware.ts     # Auth & rate limiting

components/
└── Sidebar.tsx       # Navigation

database/
└── schema.sql        # Database schema
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SmartShort

# Admin
ADMIN_SECRET_KEY=your-secret-key

# Ads
NEXT_PUBLIC_AD_DISPLAY_DURATION=3000
NEXT_PUBLIC_AD_REVENUE_PER_CLICK=0.001

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Supabase connection fails
- Check `.env.local` credentials
- Verify no extra spaces in keys

### Can't sign up
- Enable Email auth in Supabase
- Check Authentication → Providers → Email is ON

### Admin access denied
- Go to Supabase → users table
- Change your user's `role` to `admin`

## API Examples

### Create Link
```bash
curl -X POST http://localhost:3000/api/links/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Movie",
    "movieLinks": [
      {"quality": "720p", "targetUrl": "https://example.com/720p"}
    ]
  }'
```

### Get Links
```bash
curl http://localhost:3000/api/links/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Analytics
```bash
curl "http://localhost:3000/api/analytics?linkId=LINK_ID&period=7d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

### Deploy to Vercel

```bash
git push origin main
```

Then:
1. Go to [vercel.com](https://vercel.com)
2. Import repository
3. Add environment variables
4. Deploy

## Next Steps

1. **Customize** - Update colors in `tailwind.config.js`
2. **Add features** - Implement payment system
3. **Monitor** - Set up error tracking
4. **Scale** - Upgrade to Redis for rate limiting

## Documentation

- **README.md** - Full feature overview
- **SETUP_GUIDE.md** - Detailed setup instructions
- **PROJECT_SUMMARY.md** - Project overview

## Support

Check the documentation files or review the code comments for help.

---

**You're all set! Start creating short links and earning money! 🚀**
