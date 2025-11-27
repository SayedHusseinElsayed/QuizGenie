# Fix Email Redirect URLs - Supabase Configuration

## Problem
Email verification links are redirecting to `localhost` instead of your production URL: `https://quizgeni.vercel.app`

## Solution (2 Steps)

### Step 1: Update Supabase Dashboard Settings ⚠️ REQUIRED

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in the left sidebar
   - Click "URL Configuration"

3. **Update Site URL**
   - **Site URL:** Change from `http://localhost:3000` to:
     ```
     https://quizgeni.vercel.app
     ```
   - This is the default redirect URL for email confirmations

4. **Add Redirect URLs (Allow List)**
   Add these URLs to the "Redirect URLs" list:
   ```
   http://localhost:5173/**
   https://quizgeni.vercel.app/**
   https://*.vercel.app/**
   ```
   
   Why:
   - `localhost:5173` - For local development
   - `quizgeni.vercel.app` - Your production URL
   - `*.vercel.app` - For Vercel preview deployments

5. **Save Changes**
   - Click "Save" at the bottom

### Step 2: Update Code ✅ DONE

I've already updated `authService.ts` to include:
```typescript
emailRedirectTo: window.location.origin + '/dashboard'
```

This ensures:
- **Production:** Redirects to `https://quizgeni.vercel.app/dashboard`
- **Local:** Redirects to `http://localhost:5173/dashboard`
- **Preview:** Redirects to preview URL automatically

## Testing

After updating Supabase settings:

1. **Sign up with a new email**
2. **Check your email**
3. **Click the verification link**
4. **Should redirect to:** `https://quizgeni.vercel.app/dashboard`

## Deploy Updated Code

Since I updated the code, you need to push to GitHub:

```bash
git add services/authService.ts
git commit -m "Fix: Add emailRedirectTo for production deployment"
git push
```

Vercel will automatically redeploy in ~2 minutes.

## Troubleshooting

### Still redirecting to localhost?
- Clear browser cache
- Check Supabase URL Configuration was saved
- Verify the redirect URL is in the allow list

### Email not arriving?
- Check spam folder
- Verify email in Supabase → Authentication → Users
- Check Supabase → Authentication → Email Templates

### "Invalid redirect URL" error?
- Ensure the URL is in the Redirect URLs allow list
- Check for typos in the URL
- Wildcards must match exactly

## Additional Configuration (Optional)

### Custom Email Templates
If you want to customize the email:
1. Go to Supabase → Authentication → Email Templates
2. Edit "Confirm your sign-up" template
3. Change `{{ .SiteURL }}` to `{{ .RedirectTo }}` to use the dynamic redirect URL

### Password Reset
The same configuration applies to password reset emails automatically.
