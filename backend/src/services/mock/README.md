# Mock Services

This directory contains mock implementations of all external services for local development and testing without requiring API keys or external dependencies.

## Overview

The mock services provide the same interfaces as the real services but use in-memory data stores and deterministic algorithms instead of external APIs.

## Files

- **`mock-data.ts`** - Pre-defined meal templates organized by cuisine type
- **`mock-ai.service.ts`** - Mock AI service for meal generation (no OpenAI API required)
- **`mock-firebase.service.ts`** - In-memory database (no Firebase required)
- **`mock-email.service.ts`** - Console logging for emails (no SMTP required)

## Usage

### Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Enable mock mode in `.env`:**
   ```env
   USE_MOCK_SERVICES=true
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

### NPM Scripts

The following npm scripts are available for easy mode switching:

```bash
# Development mode (uses .env setting)
npm run dev

# Development with mock services (overrides .env)
npm run dev:mock

# Development with real services (overrides .env)
npm run dev:prod

# Production mode (uses .env setting)
npm start

# Production with mock services
npm start:mock

# Production with real services
npm start:prod
```

### Environment Variable

Set `USE_MOCK_SERVICES` in your `.env` file:

```env
# Mock mode - no API keys required
USE_MOCK_SERVICES=true

# Production mode - requires all API keys
USE_MOCK_SERVICES=false
```

## Features

### Mock AI Service

**What it does:**
- Generates meals from pre-defined templates based on vibe keywords
- Deterministic meal selection (same vibe = same meals)
- Mock images from Unsplash with deterministic seeds
- Supports dietary restriction filtering
- No OpenAI API key required

**Meal Templates:**
- Italian (4 meals)
- Asian (4 meals)
- Mexican (4 meals)
- American (4 meals)
- Comfort Food (4 meals)

**Example:**
```typescript
import { aiService } from '../service-factory';

// Works the same in both mock and production mode
const meals = await aiService.generateMealsWithImages(
  'Italian comfort food',
  4,
  ['vegetarian']
);
```

### Mock Firebase Service

**What it does:**
- In-memory data storage using JavaScript Maps
- Real-time listener simulation using EventEmitter
- All CRUD operations for users, sessions, meals, votes, and guests
- Session expiration handling
- Share token generation
- No Firebase credentials required

**Data Persistence:**
- Data persists only during runtime
- Cleared when server restarts
- Useful for testing without database setup

**Example:**
```typescript
import { firebaseService } from '../service-factory';

// Works the same in both mock and production mode
const session = await firebaseService.createSession(
  { vibe: 'Italian', headcount: 4, dietary_restrictions: [] },
  'user123'
);
```

**Utility Methods (Mock Only):**
```typescript
// Clear all data
firebaseService.clearAllData();

// Get statistics
const stats = firebaseService.getStats();
console.log(stats); // { users: 5, sessions: 3, shareTokens: 3 }
```

### Mock Email Service

**What it does:**
- Logs emails to console with formatted output
- Stores sent emails in memory for verification
- Generates mock message IDs
- Same email templates as production
- No SMTP configuration required

**Example:**
```typescript
import { emailService } from '../service-factory';

// Works the same in both mock and production mode
await emailService.sendMagicLink('user@example.com', 'token123');

// Console output:
// ================================================================================
// 📧 [MOCK EMAIL] Magic Link Email
// ================================================================================
// To: user@example.com
// From: noreply@groupfoodtinder.com
// Subject: Your Magic Link to Sign In
// Message ID: mock-1-1234567890@groupfoodtinder.com
// --------------------------------------------------------------------------------
// Magic Link:
// http://localhost:5173/auth/verify?token=token123
// ...
```

**Utility Methods (Mock Only):**
```typescript
// Get all sent emails
const emails = emailService.getSentEmails();

// Get emails for specific recipient
const userEmails = emailService.getSentEmailsTo('user@example.com');

// Clear sent emails history
emailService.clearSentEmails();

// Get statistics
const stats = emailService.getStats();
console.log(stats); // { totalSent: 10, uniqueRecipients: 5 }
```

## Service Factory

The `service-factory.ts` file automatically selects the correct service implementation based on the `USE_MOCK_SERVICES` environment variable.

**Usage in your code:**
```typescript
// Import from service-factory instead of individual services
import { aiService, firebaseService, emailService } from './services/service-factory';

// Use services normally - they work the same in both modes
const meals = await aiService.generateMealsWithImages('Italian', 4, []);
const session = await firebaseService.createSession(data, userId);
await emailService.sendMagicLink(email, token);
```

**Check current mode:**
```typescript
import { isUsingMockServices, getServiceInfo } from './services/service-factory';

if (isUsingMockServices) {
  console.log('Running in mock mode');
}

const info = getServiceInfo();
console.log(info);
// {
//   mode: 'mock',
//   services: {
//     ai: 'mock',
//     database: 'in-memory',
//     email: 'console'
//   }
// }
```

## Switching Between Modes

### Method 1: Environment Variable (Recommended)

Edit your `.env` file:
```env
USE_MOCK_SERVICES=true   # Mock mode
USE_MOCK_SERVICES=false  # Production mode
```

### Method 2: NPM Scripts

```bash
npm run dev:mock   # Force mock mode
npm run dev:prod   # Force production mode
```

### Method 3: Command Line

```bash
USE_MOCK_SERVICES=true npm run dev    # Mock mode
USE_MOCK_SERVICES=false npm run dev   # Production mode
```

## Benefits

✅ **No API Keys Required** - Start developing immediately without setting up external services

✅ **Faster Development** - No network latency, instant responses

✅ **Offline Development** - Work without internet connection

✅ **Deterministic Testing** - Same inputs always produce same outputs

✅ **Cost Savings** - No API usage costs during development

✅ **Easy Debugging** - Console logs show all operations

✅ **Drop-in Replacement** - Same interfaces as real services

## Limitations

⚠️ **Data Persistence** - Mock data is lost when server restarts

⚠️ **Limited Meal Variety** - Only 20 pre-defined meals (vs unlimited with AI)

⚠️ **No Real Images** - Uses Unsplash placeholder images

⚠️ **No Email Delivery** - Emails only logged to console

⚠️ **Single Instance** - No distributed/multi-server support

## Production Deployment

**Important:** Always use real services in production!

1. Set `USE_MOCK_SERVICES=false` in production `.env`
2. Provide all required API keys:
   - `OPENAI_API_KEY`
   - Firebase credentials
   - SMTP credentials
3. Test thoroughly before deploying

## Troubleshooting

**Services not switching:**
- Restart the server after changing `USE_MOCK_SERVICES`
- Check that `.env` file is being loaded
- Verify environment variable with `console.log(process.env.USE_MOCK_SERVICES)`

**TypeScript errors:**
- Mock services implement the same interfaces as real services
- If you see type errors, ensure you're importing from `service-factory`

**Data not persisting:**
- This is expected behavior in mock mode
- Use real Firebase service for data persistence

## Contributing

When adding new service methods:

1. Add to real service first
2. Implement same method in mock service
3. Ensure same interface and return types
4. Update this README

## Made with Bob 🤖