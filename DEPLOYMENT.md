# Deploying QuizGenie to Vercel

## Quick Deploy (5 Minutes)

### 1. Prepare Your Code
Ensure all changes are committed to Git:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Sign Up for Vercel
1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with your GitHub account (recommended)
3. Authorize Vercel to access your repositories

### 3. Import Your Project
1. Click "Add New Project" on Vercel dashboard
2. Select your GitHub repository: `Gemini 3- New App`
3. Vercel will auto-detect Vite configuration

### 4. Configure Environment Variables
**CRITICAL:** Add these environment variables in Vercel:

Click "Environment Variables" and add:

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API |
| `VITE_API_KEY` | Your Gemini API key | Google AI Studio |

**How to find Supabase credentials:**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

### 5. Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Post-Deployment Steps

### Update Supabase URL Whitelist
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL": `https://your-project-name.vercel.app`
3. Add to "Redirect URLs": `https://your-project-name.vercel.app/**`

### Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration script: `database/update_subscription_schema.sql`
3. This adds subscription columns to the `profiles` table

### Test Your Deployment
1. Visit your Vercel URL
2. Sign up for a new account
3. Create 5 quizzes (free tier limit)
4. Try creating a 6th quiz → Payment modal should appear

---

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- **Main branch** → Production deployment
- **Other branches** → Preview deployments

Every commit gets a unique preview URL for testing!

---

## Custom Domain (Optional)

### Free Vercel Subdomain
Your app is automatically available at:
- `https://your-project-name.vercel.app`

### Add Custom Domain
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `quizgenie.com`)
3. Update DNS records as instructed
4. Vercel provides free SSL certificate

---

## Troubleshooting

### Build Fails
**Error:** "Module not found"
- **Fix:** Run `npm install` locally and commit `package-lock.json`

### Blank Page After Deploy
**Error:** Routes don't work (404 on refresh)
- **Fix:** Ensure `vercel.json` exists with SPA rewrites (already created)

### Supabase Connection Fails
**Error:** "Invalid API key"
- **Fix:** Double-check environment variables in Vercel dashboard
- **Fix:** Ensure variable names start with `VITE_` prefix

### Payment Modal Doesn't Work
**Error:** Subscription check fails
- **Fix:** Run the SQL migration in Supabase
- **Fix:** Check browser console for errors

---

## Monitoring & Analytics

### View Deployment Logs
1. Vercel Dashboard → Your Project → Deployments
2. Click on any deployment to see build logs
3. Check "Functions" tab for runtime logs

### Performance
Vercel provides:
- **Global CDN** - Fast loading worldwide
- **Edge Network** - Low latency
- **Analytics** - Free tier includes basic analytics

---

## Cost

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Custom domains

### Supabase Free Tier Includes:
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 5 GB bandwidth
- ⚠️ Projects pause after 1 week of inactivity

**Total Cost:** $0/month for testing and hobby projects!

---

## Next Steps After Deployment

1. **Share the URL** with testers
2. **Monitor usage** in Vercel and Supabase dashboards
3. **Collect feedback** before going to production
4. **Upgrade plans** when ready for production traffic

Your app is now live and accessible worldwide! 🚀
