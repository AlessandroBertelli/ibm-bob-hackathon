# 🚀 Group Food Tinder - Complete Deployment Guide

## 📋 Overview

This guide will help you deploy your Group Food Tinder app online using **free services**. Yes, you can use Render's free tier!

### What You'll Deploy
- **Frontend**: React app (Vercel Free)
- **Backend**: Node.js API (Render Free)
- **Database**: Firebase Realtime Database (Free tier)
- **AI**: OpenAI API (Pay-as-you-go, ~$0.002 per request)
- **Email**: Gmail SMTP (Free)

### Total Cost
- **Development/Testing**: $0 (using mock mode)
- **Production**: ~$5-10/month (mostly OpenAI usage)

---

## 🎯 Deployment Strategy

### Option 1: Quick Demo (Recommended for Hackathon)
**Time: 30 minutes**
- Deploy with mock mode (no API keys needed)
- Perfect for demos and testing
- Zero cost

### Option 2: Full Production
**Time: 2 hours**
- All services configured
- Real AI generation
- Email notifications
- Best for actual use

---

## 📝 Step-by-Step Deployment Plan

### Phase 1: Get Your API Keys (1 hour)

#### 1.1 Firebase Setup (15 min)
**What it does**: Database for sessions, votes, and user data

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it: `group-food-tinder`
4. Disable Google Analytics (optional)
5. Click "Create project"

**Enable Realtime Database:**
1. In left sidebar → Build → Realtime Database
2. Click "Create Database"
3. Choose location: `us-central1` (or closest to you)
4. Start in **test mode** (we'll secure it later)
5. Click "Enable"

**Get Service Account Credentials:**
1. Click gear icon → Project settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Open it and copy these values:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `client_email` → FIREBASE_CLIENT_EMAIL

**Security Rules (Important!):**
```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null || data.exists()"
      }
    },
    "votes": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Cost**: Free up to 1GB storage, 10GB/month downloads

---

#### 1.2 OpenAI API Setup (10 min)
**What it does**: Generates creative meal suggestions

**Steps:**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Click your profile → "View API keys"
4. Click "Create new secret key"
5. Name it: `group-food-tinder`
6. Copy the key (starts with `sk-`)
7. **IMPORTANT**: Save it immediately (you can't see it again!)

**Add Credits:**
1. Go to Settings → Billing
2. Add payment method
3. Set usage limit: $5/month (recommended for testing)

**Cost**: 
- GPT-3.5-turbo: ~$0.002 per meal generation
- 100 sessions = ~$0.20
- Recommended budget: $5-10/month

---

#### 1.3 Gmail SMTP Setup (10 min)
**What it does**: Sends magic link emails for authentication

**Steps:**
1. Go to [Google Account](https://myaccount.google.com)
2. Enable 2-Factor Authentication:
   - Security → 2-Step Verification → Get Started
3. Generate App Password:
   - Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other" → Name it "Group Food Tinder"
   - Click "Generate"
   - Copy the 16-character password

**Alternative Email Services:**
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: 62,000 emails/month free (if on AWS)

**Cost**: Free (Gmail has daily limits ~500 emails/day)

---

#### 1.4 JWT Secrets (5 min)
**What it does**: Secure token generation

**Generate Random Secrets:**
```bash
# Run these commands in your terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output for JWT_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output for MAGIC_LINK_SECRET
```

---

### Phase 2: Deploy Backend to Render (30 min)

#### 2.1 Prepare Backend for Deployment (10 min)

**1. Create `backend/.env.production` file:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

# Service Mode
SERVICE_MODE=production

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
EMAIL_FROM=noreply@groupfoodtinder.com

# JWT Configuration
JWT_SECRET=your_generated_jwt_secret_here
JWT_EXPIRES_IN=7d

# Magic Link Configuration
MAGIC_LINK_SECRET=your_generated_magic_link_secret_here
MAGIC_LINK_EXPIRES_IN=15m

# Logging
LOG_LEVEL=info
```

**2. Verify `backend/package.json` has these scripts:**
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "nodemon src/index.ts"
  }
}
```

---

#### 2.2 Deploy to Render (20 min)

**Why Render?**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Easy environment variable management
- ✅ Built-in SSL certificates

**Steps:**

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin neon
   ```

2. **Sign up for Render**:
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub
   - Authorize Render to access your repositories

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `ibm-bob-hackathon` repo
   - Click "Connect"

4. **Configure Service**:
   ```
   Name: group-food-tinder-api
   Region: Oregon (US West) or closest to you
   Branch: neon
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

5. **Add Environment Variables**:
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - Add ALL variables from your `.env.production` file
   - **IMPORTANT**: For `FIREBASE_PRIVATE_KEY`, paste the entire key including `\n` characters

6. **Deploy**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your API will be at: `https://group-food-tinder-api.onrender.com`

**Render Free Tier Limitations:**
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds
- ⚠️ 750 hours/month free (enough for one service)
- ✅ Perfect for demos and low-traffic apps

**Pro Tip**: Keep your service alive with a cron job:
```bash
# Use cron-job.org to ping your API every 14 minutes
curl https://group-food-tinder-api.onrender.com/api/health
```

---

### Phase 3: Deploy Frontend to Vercel (20 min)

#### 3.1 Prepare Frontend (5 min)

**1. Create `frontend/.env.production`:**
```env
VITE_API_URL=https://group-food-tinder-api.onrender.com/api
```

**2. Update `frontend/vite.config.ts` (if needed):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

---

#### 3.2 Deploy to Vercel (15 min)

**Why Vercel?**
- ✅ Free tier for personal projects
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant deployments
- ✅ Perfect for React apps

**Steps:**

1. **Sign up for Vercel**:
   - Go to [Vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Authorize Vercel

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import `ibm-bob-hackathon` repository
   - Click "Import"

3. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://group-food-tinder-api.onrender.com/api`
   - Click "Add"

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be at: `https://your-app.vercel.app`

6. **Update Backend CORS**:
   - Go back to Render dashboard
   - Update `FRONTEND_URL` environment variable
   - Set to: `https://your-app.vercel.app`
   - Redeploy backend

---

### Phase 4: Testing & Verification (20 min)

#### 4.1 Test Checklist

**Backend Health Check:**
```bash
curl https://group-food-tinder-api.onrender.com/api/health
# Should return: {"status":"ok","mode":"production"}
```

**Frontend Access:**
1. Open `https://your-app.vercel.app`
2. Should see landing page
3. Check browser console for errors

**Full Flow Test:**
1. ✅ Request magic link (check email)
2. ✅ Click magic link (should authenticate)
3. ✅ Create session with vibe and headcount
4. ✅ AI generates meals (wait 30-60 seconds)
5. ✅ Share link works
6. ✅ Voting interface loads
7. ✅ Swipe cards work
8. ✅ Winner displays correctly

---

#### 4.2 Common Issues & Fixes

**Issue: Backend takes 30+ seconds to respond**
- **Cause**: Render free tier cold start
- **Fix**: Normal behavior, or upgrade to paid tier ($7/month)

**Issue: CORS errors in browser**
- **Cause**: FRONTEND_URL mismatch
- **Fix**: Update FRONTEND_URL in Render to match Vercel URL exactly

**Issue: Firebase permission denied**
- **Cause**: Security rules too strict
- **Fix**: Update Firebase rules (see Phase 1.1)

**Issue: OpenAI rate limit errors**
- **Cause**: Too many requests
- **Fix**: Add rate limiting or upgrade OpenAI plan

**Issue: Email not sending**
- **Cause**: Gmail app password incorrect
- **Fix**: Regenerate app password, update SMTP_PASS

---

### Phase 5: Custom Domain (Optional, 10 min)

#### 5.1 Add Custom Domain to Vercel

**Steps:**
1. Buy domain from Namecheap, GoDaddy, etc. (~$10/year)
2. In Vercel dashboard → Settings → Domains
3. Add your domain: `groupfoodtinder.com`
4. Follow DNS configuration instructions
5. Wait 24-48 hours for DNS propagation

**Free Domain Options:**
- Use Vercel's free subdomain: `your-app.vercel.app`
- Use Render's free subdomain: `your-api.onrender.com`

---

## 🎭 Deployment Modes Comparison

### Mock Mode (Free, Instant)
```bash
# Deploy with mock mode for demos
SERVICE_MODE=mock
```
**Pros:**
- ✅ Zero cost
- ✅ No API keys needed
- ✅ Instant deployment
- ✅ Perfect for demos

**Cons:**
- ❌ No real AI generation
- ❌ No email sending
- ❌ Data resets on restart

---

### Production Mode (Paid, Full Features)
```bash
SERVICE_MODE=production
```
**Pros:**
- ✅ Real AI meal generation
- ✅ Email notifications
- ✅ Persistent data
- ✅ Production-ready

**Cons:**
- ❌ Requires API keys
- ❌ ~$5-10/month cost
- ❌ More setup time

---

## 💰 Cost Breakdown

### Free Tier (Mock Mode)
| Service | Cost | Limits |
|---------|------|--------|
| Render | $0 | 750 hours/month, cold starts |
| Vercel | $0 | 100GB bandwidth/month |
| **Total** | **$0/month** | Perfect for demos |

### Production Tier
| Service | Cost | Usage |
|---------|------|-------|
| Render | $0 | Free tier |
| Vercel | $0 | Free tier |
| Firebase | $0 | Free tier (1GB storage) |
| OpenAI | ~$5-10 | ~2,500 meal generations |
| Gmail | $0 | Free (500 emails/day limit) |
| **Total** | **~$5-10/month** | Light usage |

### Scaling Costs
| Users/Month | OpenAI Cost | Render Cost | Total |
|-------------|-------------|-------------|-------|
| 100 | ~$2 | $0 | ~$2 |
| 1,000 | ~$20 | $7 | ~$27 |
| 10,000 | ~$200 | $25 | ~$225 |

---

## 🚀 Quick Deploy Commands

### Deploy Everything (Mock Mode)
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin neon

# 2. Deploy backend to Render
# (Use Render dashboard - see Phase 2)

# 3. Deploy frontend to Vercel
# (Use Vercel dashboard - see Phase 3)
```

### Update Deployment
```bash
# Just push to GitHub - auto-deploys!
git add .
git commit -m "Update feature"
git push origin neon
```

---

## 📊 Monitoring & Maintenance

### Check Backend Logs
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Monitor for errors

### Check Frontend Logs
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment → "View Function Logs"

### Set Up Alerts
**Render:**
- Settings → Notifications
- Add email for deployment failures

**Vercel:**
- Settings → Notifications
- Enable deployment notifications

---

## 🔒 Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] Firebase security rules configured
- [ ] CORS properly configured
- [ ] JWT secrets are random and secure
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs

---

## 🎯 Recommended Deployment Path

### For Hackathon Demo (30 min)
1. ✅ Deploy backend in **mock mode** to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Test basic flow
4. ✅ Present demo

### For Production (2 hours)
1. ✅ Get all API keys (Phase 1)
2. ✅ Deploy backend in **production mode** to Render
3. ✅ Deploy frontend to Vercel
4. ✅ Test full flow with real services
5. ✅ Monitor and optimize

---

## 📞 Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [OpenAI Docs](https://platform.openai.com/docs)

### Troubleshooting
- Check backend logs in Render
- Check frontend logs in Vercel
- Check browser console for errors
- Test API endpoints with Postman/curl

### Community
- GitHub Issues
- Stack Overflow
- Discord/Slack channels

---

## ✅ Final Checklist

### Before Demo
- [ ] Backend deployed and responding
- [ ] Frontend deployed and accessible
- [ ] Test magic link authentication
- [ ] Test session creation
- [ ] Test voting flow
- [ ] Test winner determination
- [ ] Prepare backup screenshots
- [ ] Practice demo script

### After Demo
- [ ] Monitor usage and costs
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Collect user feedback
- [ ] Plan improvements

---

## 🎉 You're Ready to Deploy!

**Next Steps:**
1. Choose your deployment mode (mock or production)
2. Follow the step-by-step guide above
3. Test thoroughly
4. Share your app with the world!

**Questions?** Check the troubleshooting section or open an issue on GitHub.

**Good luck with your deployment! 🚀**