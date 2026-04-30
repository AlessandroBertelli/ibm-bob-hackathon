# Backend Setup Guide

This guide explains how to set up and run the backend in different modes.

## Quick Start (Zero Configuration)

The backend comes pre-configured to run in **mock mode** with no setup required:

```bash
cd backend
npm install
npm run dev
```

That's it! The server will start on http://localhost:3000 using mock services (no API keys needed).

## Service Modes

The backend supports three service modes:

### 1. Mock Mode (Default) 🧪
- **No API keys required**
- Uses in-memory mock services
- Perfect for development and testing
- Data resets on server restart

### 2. Test Mode 🔧
- **Requires API keys**
- Uses real external APIs
- For testing with actual services
- Data persists in Firebase

### 3. Production Mode 🚀
- **Requires all API keys**
- Full production configuration
- For deployment

## Switching Modes

### Method 1: Edit .env file (Recommended)

Edit `backend/.env`:

```env
# For mock mode (default)
SERVICE_MODE=mock

# For test mode
SERVICE_MODE=test

# For production mode
SERVICE_MODE=production
```

Then run:
```bash
npm run dev
```

### Method 2: Use NPM Scripts

```bash
# Development
npm run dev        # Uses .env setting
npm run dev:mock   # Force mock mode
npm run dev:test   # Force test mode
npm run dev:prod   # Force production mode

# Production
npm start          # Uses .env setting
npm start:mock     # Force mock mode
npm start:test     # Force test mode
npm start:prod     # Force production mode
```

### Method 3: Environment Variable

```bash
SERVICE_MODE=mock npm run dev
SERVICE_MODE=test npm run dev
SERVICE_MODE=production npm run dev
```

## Configuration

### Mock Mode (No Setup Required)

The `.env` file is already configured for mock mode:

```env
SERVICE_MODE=mock
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

All other API keys can be left empty.

### Test/Production Mode Setup

For test or production mode, you need to configure API keys:

#### 1. OpenAI API Key

Get your API key from https://platform.openai.com/api-keys

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

#### 2. Firebase Credentials

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add to `.env`:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
```

#### 3. Email (SMTP) Configuration

For Gmail:
1. Enable 2FA on your Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=noreply@groupfoodtinder.com
```

## Verification

When you start the server, you'll see which mode is active:

### Mock Mode:
```
================================================================================
🧪 MOCK MODE - Using mock services (no external APIs required)
   • AI: Mock meal templates
   • Database: In-memory storage
   • Email: Console logging
================================================================================
```

### Test Mode:
```
================================================================================
🔧 TEST MODE - Using real APIs for testing
   • AI: OpenAI API (requires OPENAI_API_KEY)
   • Database: Firebase (requires credentials)
   • Email: SMTP (requires SMTP credentials)
================================================================================
```

### Production Mode:
```
================================================================================
🚀 PRODUCTION MODE - Full production services
   • AI: OpenAI API
   • Database: Firebase
   • Email: SMTP
================================================================================
```

## Development Workflow

### Starting a New Feature

1. Use mock mode for rapid development:
   ```bash
   npm run dev:mock
   ```

2. Test with real APIs when ready:
   ```bash
   npm run dev:test
   ```

3. Deploy to production:
   ```bash
   SERVICE_MODE=production npm start
   ```

## Troubleshooting

### Server won't start in test/production mode

**Problem:** Missing API keys

**Solution:** Check that all required environment variables are set:
- `OPENAI_API_KEY`
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- `SMTP_USER`, `SMTP_PASS`

### Mode not switching

**Problem:** Server still using old mode

**Solution:** Restart the server after changing `SERVICE_MODE`

### TypeScript errors

**Problem:** Import errors or type mismatches

**Solution:** Always import from `service-factory`:
```typescript
// ✅ Correct
import { aiService, firebaseService, emailService } from './services/service-factory';

// ❌ Wrong
import aiService from './services/ai.service';
```

## API Endpoints

All endpoints work the same regardless of mode:

- `POST /api/auth/login` - Request magic link
- `POST /api/auth/verify` - Verify magic link
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `POST /api/sessions/:id/meals` - Generate meals
- `POST /api/votes` - Submit vote
- And more...

## Mock Service Features

### Mock AI Service
- 20 pre-defined meals across 5 cuisines
- Deterministic selection based on vibe
- Dietary restriction filtering
- Mock images from Unsplash

### Mock Firebase Service
- In-memory data storage
- Real-time listener simulation
- All CRUD operations
- Utility methods: `clearAllData()`, `getStats()`

### Mock Email Service
- Console logging with formatted output
- Email history tracking
- Utility methods: `getSentEmails()`, `clearSentEmails()`, `getStats()`

## Production Deployment

For production deployment:

1. Set environment variables on your hosting platform:
   ```env
   SERVICE_MODE=production
   NODE_ENV=production
   OPENAI_API_KEY=sk-...
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   SMTP_USER=...
   SMTP_PASS=...
   ```

2. Build and start:
   ```bash
   npm run build
   npm start
   ```

## Security Notes

- ✅ The included `.env` file has safe defaults for mock mode
- ✅ No sensitive data in the repository
- ⚠️ Never commit real API keys
- ⚠️ Use environment variables in production
- ⚠️ Rotate keys if accidentally exposed

## Support

For issues or questions:
1. Check this guide
2. Review `backend/src/services/mock/README.md`
3. Check console output for error messages
4. Verify environment variables are set correctly

## Made with Bob 🤖