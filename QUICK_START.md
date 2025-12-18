# ⚡ Quick Start Guide - Monetized Short Links

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Database Schema (2 min)
```bash
1. Open Supabase Dashboard → SQL Editor
2. Copy contents from: database/monetization-schema.sql
3. Click "Run" to execute
4. Verify success message
```

### Step 2: Configure AdSense (1 min)
```bash
1. Open: app/ads/[clickId]/page.tsx
2. Replace ad slot IDs on lines 180 and 195:
   data-ad-slot="YOUR_ACTUAL_AD_SLOT_ID"
3. Save file
```

### Step 3: Build & Test (2 min)
```bash
npm run build
npm run dev
```

Visit: http://localhost:3000/dashboard

---

## 🧪 Quick Test Flow

### Test the Complete Journey:

1. **Create Short Link**
   - Login to dashboard
   - Enter a long URL (e.g., https://example.com)
   - Click "Shorten"
   - Copy the generated short link

2. **Test Visitor Flow**
   - Open incognito/private window
   - Paste short link: `http://localhost:3000/r/[shortcode]`
   - Should redirect to ad interstitial page
   - Wait 15 seconds for countdown
   - Click "Continue to Destination"
   - Should redirect to original URL

3. **Verify Earnings**
   - Return to dashboard
   - Navigate to "CPM Center" in sidebar
   - Should show:
     - ✅ Today's Earnings: $0.01 (if CPM = $10)
     - ✅ Total Clicks: 1
     - ✅ Valid Clicks: 1
     - ✅ Average CPM: $10.00

---

## 📊 Check Database Records

```sql
-- View recent clicks
SELECT * FROM clicks ORDER BY timestamp DESC LIMIT 5;

-- View earnings
SELECT * FROM earnings ORDER BY created_at DESC LIMIT 5;

-- Check link earnings
SELECT slug, clicks, earnings FROM links ORDER BY created_at DESC LIMIT 5;
```

---

## 🔧 Adjust Settings

```sql
-- Change CPM rate (default: $10.00 USD)
UPDATE settings SET value = '12.00' WHERE key = 'default_cpm';

-- Change ad duration (default: 15 seconds)
UPDATE settings SET value = '20' WHERE key = 'ad_display_duration';

-- Change minimum view time (default: 10 seconds)
UPDATE settings SET value = '12' WHERE key = 'min_ad_view_time';
```

---

## 🐛 Troubleshooting

### TypeScript Errors?
```bash
# These will resolve after schema is applied
# Restart TypeScript server or run:
npm run build
```

### Earnings Not Showing?
```sql
-- Check if click was marked valid and completed
SELECT is_valid, is_completed FROM clicks WHERE id = 'click_uuid';

-- Check if earning was created
SELECT * FROM earnings WHERE click_id = 'click_uuid';
```

### Ad Page Not Loading?
- Verify click record exists in database
- Check browser console for errors
- Ensure link is active: `SELECT is_active FROM links WHERE slug = 'shortcode'`

---

## 📈 Monitor Performance

### Dashboard Metrics
- **Today's Earnings**: Money earned today
- **Total Earnings**: All-time earnings
- **Valid Clicks**: Non-bot, legitimate clicks
- **Average CPM**: Your earning rate per 1000 views
- **Valid Click Rate**: % of clicks that are legitimate
- **Completion Rate**: % of visitors who complete ad view

### Key Performance Indicators
- **Good Valid Rate**: > 70%
- **Good Completion Rate**: > 80%
- **Typical CPM**: ₹400-800 (varies by region/niche)

---

## ✅ Production Checklist

Before going live:

- [ ] Database schema applied successfully
- [ ] AdSense ad units configured
- [ ] Test flow completed successfully
- [ ] Earnings calculation verified
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Google AdSense account approved
- [ ] Fraud protection tested

---

## 🎯 What's Next?

### Optimize Earnings
1. **Increase Traffic**: Share your short links
2. **Monitor CPM**: Track which links perform best
3. **Reduce Invalid Clicks**: Monitor fraud patterns
4. **Improve Completion Rate**: Optimize ad placement

### Advanced Features
- Set up automated payouts
- Add country-based CPM rates
- Implement referral program
- Create mobile app
- Add advanced analytics

---

## 📞 Need Help?

Check the full documentation: `MONETIZATION_SETUP.md`

### Common Issues
1. **No earnings after click** → Check `is_valid` and `is_completed` flags
2. **TypeScript errors** → Run schema, restart dev server
3. **Ad page blank** → Check AdSense approval status
4. **High invalid rate** → Review fraud protection settings

---

**🎉 You're all set! Start earning from your short links.**

Create links → Share them → Watch earnings grow in real-time!
