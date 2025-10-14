# ZhenGrowth Deployment Checklist

Complete guide to deploying ZhenGrowth to production.

## Pre-Deployment Checklist

### 1. Content & Assets

- [ ] **Replace Hero Video/Image**
  - Current: Placeholder hero.jpg
  - Action: Add real video to `/src/assets/video/hero.webm` or high-quality image
  
- [ ] **Create Lead Magnet PDF**
  - Current: Missing
  - Action: Create and upload `/public/downloads/7-day-clarity-sprint.pdf`
  - See: `/public/downloads/README.md` for content suggestions

- [ ] **Add Real Testimonials**
  - Current: Sample data in Home.tsx
  - Action: Replace with real client testimonials

- [ ] **Write Blog Posts**
  - Current: One sample post
  - Action: Create 3-5 high-quality blog posts in `/src/blog/`

### 2. Configuration

#### Required API Keys

- [ ] **Umami Analytics** (Optional but recommended)
  ```
  1. Sign up: https://cloud.umami.is/
  2. Add website
  3. Copy Website ID
  4. Update in index.html: Replace "VITE_UMAMI_WEBSITE_ID" with actual ID
  ```

- [ ] **PostHog Analytics** (Optional - for advanced funnels)
  ```
  1. Sign up: https://posthog.com/
  2. Create project
  3. Copy API key
  4. Add to production environment: VITE_POSTHOG_KEY=phc_xxxxx
  ```

- [ ] **Resend Email** (Required for quiz automation)
  ```
  1. Go to https://resend.com/domains
  2. Add and verify zhengrowth.com domain
  3. API key already configured in Lovable Cloud
  4. Update edge function email "from" to: hello@zhengrowth.com
  ```

- [ ] **Cal.com Booking** (Required for booking flow)
  ```
  1. Sign up: https://cal.com
  2. Create "discovery" event type (30min)
  3. Update in src/pages/BookSession.tsx:
     <Cal calLink="YOUR-USERNAME/discovery" />
  ```

- [ ] **Airwallex Payment** (Required for payments)
  ```
  1. Sign up: https://www.airwallex.com/
  2. Complete business verification
  3. Get API credentials from dashboard
  4. Add to production environment:
     - AIRWALLEX_API_KEY
     - AIRWALLEX_CLIENT_ID
  ```

- [ ] **hCaptcha** (Optional - spam protection)
  ```
  1. Sign up: https://www.hcaptcha.com/
  2. Create site
  3. Add to production: VITE_HCAPTCHA_SITE_KEY
  ```

### 3. Backend Configuration

- [x] **Lovable Cloud Enabled**
- [x] **Leads Table Created**
- [x] **Email Edge Function Deployed**
- [x] **Auth Auto-Confirm Enabled**

Still needed:
- [ ] **Verify Resend Domain**
- [ ] **Test Quiz → Email Flow**
- [ ] **Monitor Edge Function Logs**

### 4. China Deployment (Optional)

If deploying to China:

- [ ] **Deploy Edge Worker**
  ```bash
  # Cloudflare Workers
  npm install -g wrangler
  wrangler login
  wrangler deploy edge/country-redirect-worker.js
  ```

- [ ] **Setup Baidu Tongji**
  ```
  1. Sign up: https://tongji.baidu.com
  2. Add cn.zhengrowth.com
  3. Copy site ID to index-cn.html
  ```

- [ ] **Create Feishu Form**
  ```
  1. Sign up: https://www.feishu.cn/
  2. Create booking form
  3. Update src/pages/BookSession.cn.tsx with form ID
  ```

- [ ] **Get AMap API Key**
  ```
  1. Sign up: https://lbs.amap.com/
  2. Create web application
  3. Add key to index-cn.html
  ```

- [ ] **Configure DNS**
  ```
  cn.zhengrowth.com → Your HK/China hosting
  ```

See: `IMPLEMENTATION.md` Section 13 for detailed China deployment guide

## Deployment Steps

### Option 1: Deploy via Lovable (Recommended)

1. Click the **Publish** button in Lovable editor
2. Connect custom domain `zhengrowth.com`
3. SSL certificate auto-configured
4. Done! 🎉

### Option 2: Export to GitHub → Vercel/Netlify

1. **Export to GitHub**
   ```
   1. Click GitHub icon in Lovable
   2. Connect your GitHub account
   3. Create new repo: zhengrowth
   4. Push code
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

3. **Deploy to Netlify**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   
   In Vercel/Netlify dashboard, add:
   ```
   VITE_SITE_URL=https://zhengrowth.com
   VITE_POSTHOG_KEY=phc_xxxxx (if using)
   VITE_UMAMI_WEBSITE_ID=xxxxx (configured in HTML)
   VITE_REGION=global
   
   # Supabase (auto-configured by Lovable Cloud)
   VITE_SUPABASE_URL=xxxxx
   VITE_SUPABASE_PUBLISHABLE_KEY=xxxxx
   
   # Payment (if ready)
   AIRWALLEX_API_KEY=xxxxx
   AIRWALLEX_CLIENT_ID=xxxxx
   ```

### Option 3: Export to GitHub → China Build

For China mirror at `cn.zhengrowth.com`:

```bash
# Build China version
VITE_REGION=china npm run build

# Deploy to China hosting (Aliyun, Tencent Cloud, or Vercel HK)
```

## Custom Domain Setup

### DNS Configuration

Add these records to your domain registrar (Namecheap, GoDaddy, etc.):

```
Type    Name    Value
A       @       <your-deployment-ip>
CNAME   www     <your-deployment-url>
CNAME   cn      <china-deployment-url>
```

For Lovable:
```
1. Go to Project Settings → Domains
2. Add zhengrowth.com
3. Follow DNS instructions
4. SSL auto-configured
```

For Vercel/Netlify:
- They provide automatic DNS configuration after domain verification

## Post-Deployment

### Testing Checklist

- [ ] **Homepage loads correctly**
- [ ] **All navigation links work**
- [ ] **Language switcher functions**
- [ ] **Quiz completes and saves lead**
- [ ] **Email received after quiz**
- [ ] **Booking page displays Cal.com**
- [ ] **Payment flow works (if configured)**
- [ ] **Mobile responsive on all pages**
- [ ] **Analytics tracking events**

### Monitoring

1. **Lovable Cloud Dashboard**
   - Monitor edge function logs
   - Check database for new leads
   - View error logs

2. **Analytics**
   - Umami: Track page views and events
   - PostHog: Monitor conversion funnels

3. **Resend Dashboard**
   - Monitor email delivery rates
   - Check bounce/spam rates

### Performance Optimization

- [ ] **Run Lighthouse audit** (Target: >90 score)
- [ ] **Compress images** (Use AVIF/WebP)
- [ ] **Enable CDN** (Cloudflare or Vercel Edge)
- [ ] **Check Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### SEO

- [ ] **Submit sitemap** to Google Search Console
  - https://zhengrowth.com/sitemap.xml

- [ ] **Verify robots.txt** accessible
  - https://zhengrowth.com/robots.txt

- [ ] **Set up Google Analytics** (optional)

- [ ] **Build backlinks** from relevant sites

## Troubleshooting

### Common Issues

**Email not sending:**
- Verify Resend domain in dashboard
- Check edge function logs for errors
- Ensure RESEND_API_KEY is set

**Booking page not loading:**
- Update Cal.com username in BookSession.tsx
- Verify Cal.com account is active

**Analytics not tracking:**
- Replace "VITE_UMAMI_WEBSITE_ID" with actual ID in index.html
- Check browser console for errors

**Payment errors:**
- Verify Airwallex API keys
- Check Airwallex account status
- Monitor api/create-payment-link.ts logs

### Support Resources

- **Lovable Docs**: https://docs.lovable.dev/
- **Lovable Discord**: https://discord.gg/lovable
- **Resend Docs**: https://resend.com/docs
- **Cal.com Docs**: https://cal.com/docs
- **Airwallex Docs**: https://www.airwallex.com/docs

## Success Metrics to Track

**Week 1-2: Setup Phase**
- [ ] Lead magnet CVR: 20-30% (quiz completion → email)
- [ ] Email open rate: 40-60%
- [ ] Email click rate: 15-25%

**Week 3-4: Optimization**
- [ ] Booking page → form submit: 20-30%
- [ ] Form submit → booked session: 50-70%
- [ ] Average session duration: >3min

**Month 2+: Growth**
- [ ] Traffic sources diversified
- [ ] Blog posts driving organic traffic
- [ ] Return visitor rate: >20%
- [ ] Payment CVR: 5-10% of discovery calls

## Next Steps After Launch

1. **Week 1**: Monitor analytics, fix any bugs
2. **Week 2**: Publish 2-3 blog posts
3. **Week 3**: Start email nurture sequence for leads
4. **Week 4**: A/B test quiz questions and lead magnet offer
5. **Month 2**: Launch paid advertising (Google/Meta)
6. **Month 3**: Consider mobile app (if demand exists)

---

**Ready to launch?** 🚀

Follow this checklist top-to-bottom, and you'll have a professional coaching platform generating leads within 2-3 weeks!
