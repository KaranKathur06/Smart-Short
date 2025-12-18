# 🚀 Monetized Short-Link System - Complete Setup Guide

## Overview

This system implements a complete monetized short-link redirection flow with:
- ✅ Ad interstitial pages with countdown timers
- ✅ CPM-based earnings calculation
- ✅ Fraud protection (bot detection, IP throttling)
- ✅ Real-time earnings tracking
- ✅ Google AdSense integration
- ✅ Comprehensive dashboard analytics

---

## 📋 Setup Steps

### 1️⃣ Database Schema Update

Execute the monetization schema in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard → SQL Editor
# Run: database/monetization-schema.sql
```

This will:
- Add new columns to `clicks` table (user_id, user_agent, is_valid, is_completed, completed_at)
- Create `earnings` table for tracking CPM-based revenue
- Add PostgreSQL functions for earnings calculation
- Set up RLS policies
- Insert default settings (CPM rate, ad duration, etc.)

### 2️⃣ Verify Database Functions

After running the schema, verify these functions exist:
- `create_earning_from_click()`
- `get_user_total_earnings()`
- `get_user_earnings_by_date()`
- `get_user_stats()`

### 3️⃣ Configure Settings

Default settings are automatically inserted. You can modify them in the `settings` table:

```sql
-- View current settings
SELECT * FROM settings WHERE key IN ('default_cpm', 'cpm_currency', 'ad_display_duration', 'min_ad_view_time');

-- Update CPM rate (in USD per 1000 views)
UPDATE settings SET value = '10.00' WHERE key = 'default_cpm';

-- Update currency
UPDATE settings SET value = 'USD' WHERE key = 'cpm_currency';

-- Update ad display duration (in seconds)
UPDATE settings SET value = '15' WHERE key = 'ad_display_duration';

-- Update minimum ad view time (in seconds)
UPDATE settings SET value = '10' WHERE key = 'min_ad_view_time';
```

### 4️⃣ Google AdSense Configuration

The AdSense script is already integrated in `app/layout.tsx`. Now configure ad units:

1. **Go to Google AdSense Dashboard**
2. **Create Ad Units:**
   - Display Ads (for ad interstitial page)
   - In-feed Ads (optional)
3. **Update Ad Slots** in `app/ads/[clickId]/page.tsx`:
   ```tsx
   data-ad-slot="YOUR_AD_SLOT_ID_1"  // Line 180
   data-ad-slot="YOUR_AD_SLOT_ID_2"  // Line 195
   ```

### 5️⃣ Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🔄 How It Works - End-to-End Flow

### Step 1: User Creates Short Link
```
User → Dashboard → Creates short link → Stored in database
```

### Step 2: Visitor Clicks Short Link
```
Visitor → https://yourdomain.com/r/AbX91
         ↓
API validates link, checks for bots/fraud
         ↓
Creates click record (is_completed = false)
         ↓
Redirects to → /ads/[clickId]
```

### Step 3: Ad Interstitial Page
```
Ad Page Loads
    ↓
Displays Google AdSense ads
    ↓
15-second countdown timer
    ↓
"Continue" button unlocks
    ↓
User clicks "Continue"
```

### Step 4: Click Completion & Earnings
```
API marks click as completed
    ↓
Validates view time (min 10 seconds)
    ↓
Calculates earnings: CPM / 1000
    ↓
Creates earning record
    ↓
Updates link earnings
    ↓
Redirects to destination URL
```

---

## 🛡️ Fraud Protection Features

### Bot Detection
- User-Agent validation
- Checks for common bot patterns
- Blocks headless browsers

### IP Throttling
- Max 3 clicks per IP per link per hour
- Minimum 30 seconds between clicks
- IP hashing for privacy

### Click Validation
- Minimum ad view time: 10 seconds
- Maximum view time: 5 minutes (prevents abandoned tabs)
- User interaction required (no auto-redirect)

### Suspicious Activity Detection
- Missing headers
- Invalid user agents
- Direct access without referrer
- Multiple flags = invalid click

---

## 💰 CPM Earnings Calculation

### Formula
```
Earning per click = CPM Rate / 1000

Example:
CPM = $10.00 USD
Per click = $10.00 / 1000 = $0.01
```

### Only Valid Clicks Earn
- ✅ Valid: Real users, proper view time, no bot patterns
- ❌ Invalid: Bots, suspicious activity, too fast clicks

### Earnings Tracking
```sql
-- View user earnings
SELECT * FROM earnings WHERE user_id = 'user_uuid';

-- Get total earnings
SELECT SUM(amount) FROM earnings WHERE user_id = 'user_uuid';

-- Get earnings by date
SELECT 
  DATE(created_at) as date,
  SUM(amount) as daily_earnings,
  COUNT(*) as click_count
FROM earnings
WHERE user_id = 'user_uuid'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 📊 Dashboard Features

### Earnings Overview Widget
- Today's earnings
- Total earnings
- Valid clicks count
- Average CPM
- Valid click rate
- Completion rate

### Real-Time Updates
- Auto-refreshes every 60 seconds
- Live status indicator
- Instant earnings display

---

## 🧪 Testing Checklist

### ✅ Basic Flow Test
1. Create a short link in dashboard
2. Copy the short link URL
3. Open in incognito/private window
4. Verify redirect to ad interstitial page
5. Wait for countdown (15 seconds)
6. Click "Continue" button
7. Verify redirect to destination
8. Check dashboard for updated earnings

### ✅ Fraud Protection Test
1. **Bot Test:** Use curl/wget → Should be blocked
   ```bash
   curl https://yourdomain.com/r/shortcode
   ```
2. **IP Throttle:** Click same link 4 times quickly → 4th should fail
3. **Fast Click:** Click continue before timer → Should fail

### ✅ Earnings Calculation Test
```sql
-- After completing a click, verify:
SELECT * FROM clicks WHERE id = 'click_uuid';
-- is_completed should be true

SELECT * FROM earnings WHERE click_id = 'click_uuid';
-- amount should be CPM/1000

SELECT earnings FROM links WHERE id = 'link_uuid';
-- Should be incremented
```

### ✅ Dashboard Test
1. Login to dashboard
2. Verify Earnings Widget displays
3. Check all metrics are accurate
4. Verify real-time updates work

---

## 🔧 API Endpoints

### Short Link Resolver
```
GET /api/r/[shortCode]
→ Validates link, creates click, redirects to ad page
```

### Click Data Fetch
```
GET /api/clicks/[clickId]
→ Returns click data and redirect URL
```

### Click Completion
```
POST /api/clicks/[clickId]/complete
→ Validates, marks completed, calculates earnings
```

### Dashboard Statistics
```
GET /api/dashboard/stats
Authorization: Bearer {token}
→ Returns earnings, CPM, clicks statistics
```

---

## 🚨 Important Google AdSense Compliance

### ✅ DO
- Require user interaction (button click)
- Display ads clearly and visibly
- Use reasonable countdown (10-15 seconds)
- Show "Advertisement" labels
- Explain why ads are shown

### ❌ DON'T
- Auto-redirect after ad load
- Hide or obscure ads
- Force accidental clicks
- Use misleading buttons
- Violate AdSense policies

**Failure to comply = Account ban!**

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
- **Total Earnings:** Sum of all valid clicks
- **Valid Click Rate:** valid_clicks / total_clicks
- **Completion Rate:** completed_clicks / valid_clicks
- **Average CPM:** Average across all earnings
- **Daily Earnings:** Track growth over time

### SQL Queries for Monitoring
```sql
-- Daily performance
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_clicks,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_clicks,
  SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed_clicks
FROM clicks
WHERE user_id = 'user_uuid'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top performing links
SELECT 
  l.slug,
  l.main_title,
  l.clicks,
  l.earnings,
  ROUND((l.earnings / NULLIF(l.clicks, 0)) * 1000, 2) as effective_cpm
FROM links l
WHERE l.user_id = 'user_uuid'
ORDER BY l.earnings DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors
**Solution:** The TypeScript errors will resolve once:
1. Database schema is applied
2. TypeScript server reloads
3. Run: `npm run build` to verify

### Issue: Earnings Not Updating
**Check:**
1. Click is marked as `is_completed = true`
2. Click is marked as `is_valid = true`
3. Earning record exists in `earnings` table
4. Link earnings field is updated

### Issue: Ad Page Not Loading
**Check:**
1. Click record was created successfully
2. Click ID is valid UUID
3. Link exists and is active
4. Movie links exist for the link

### Issue: Bot Detection Too Strict
**Adjust in `lib/fraud-protection.ts`:**
- Modify `BOT_USER_AGENTS` array
- Adjust `detectSuspiciousActivity()` threshold
- Change minimum flags required

---

## 🔐 Security Best Practices

1. **Never expose service role key** in client-side code
2. **Always validate** click completion server-side
3. **Use RLS policies** to protect user data
4. **Hash IP addresses** for privacy
5. **Rate limit** API endpoints
6. **Monitor** for abuse patterns

---

## 🎯 Next Steps & Enhancements

### Immediate
- [ ] Apply database schema
- [ ] Configure AdSense ad units
- [ ] Test complete flow
- [ ] Monitor first earnings

### Future Enhancements
- [ ] Country-based CPM rates
- [ ] Publisher tier system
- [ ] Minimum payout threshold
- [ ] Automated payouts
- [ ] Advanced analytics dashboard
- [ ] A/B testing for ad placements
- [ ] Mobile app support
- [ ] Referral program

---

## 📞 Support & Documentation

### Files Created
- `database/monetization-schema.sql` - Database schema
- `lib/fraud-protection.ts` - Fraud detection utilities
- `app/api/r/[shortCode]/route.ts` - Short link resolver
- `app/ads/[clickId]/page.tsx` - Ad interstitial page
- `app/api/clicks/[clickId]/route.ts` - Click data API
- `app/api/clicks/[clickId]/complete/route.ts` - Completion API
- `app/api/dashboard/stats/route.ts` - Dashboard stats API
- `components/EarningsWidget.tsx` - Earnings display component
- `lib/supabase.ts` - Updated with new types

### Key Functions
- `isBot()` - Detect bot user agents
- `checkIPThrottle()` - Prevent spam clicks
- `validateClickCompletion()` - Ensure valid ad views
- `getDefaultCPM()` - Fetch CPM rate
- `getAdDisplayDuration()` - Get timer duration

---

## ✅ Production Deployment Checklist

- [ ] Database schema applied
- [ ] All environment variables set
- [ ] AdSense account approved
- [ ] Ad units configured
- [ ] Test flow completed successfully
- [ ] Fraud protection tested
- [ ] Dashboard displays correctly
- [ ] Earnings calculation verified
- [ ] Google AdSense policies reviewed
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

**🎉 Your monetized short-link system is now ready!**

Start creating short links and earning money from ad views. Monitor your dashboard for real-time earnings and analytics.
