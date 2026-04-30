# Group Food Tinder - Backend API

Complete backend implementation for the Group Food Tinder application with authentication, session management, and voting APIs.

## 🚀 Features Implemented

### ✅ Authentication System (Magic Link Email Login)
- Magic link email authentication
- JWT token generation and verification
- User creation and management in Firebase
- Session token management (7-day expiration)
- Magic link expiration (15 minutes)

### ✅ Session Management
- Create and manage food voting sessions
- Generate shareable session links
- Guest registration and tracking
- Session status management (setup, generating, voting, completed)
- Session expiration (24 hours)

### ✅ Voting System
- Record guest votes (yes/no)
- Real-time voting progress tracking
- Winner determination with majority logic (>50% yes votes)
- Fallback to most popular meal if no majority
- Vote statistics per meal

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── session.controller.ts
│   │   └── vote.controller.ts
│   ├── middleware/           # Express middleware
│   │   └── auth.middleware.ts
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── session.routes.ts
│   │   └── vote.routes.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── firebase.service.ts
│   │   └── vote.service.ts
│   ├── types/               # TypeScript interfaces
│   │   ├── auth.types.ts
│   │   └── session.types.ts
│   ├── utils/               # Utility functions
│   │   ├── errors.util.ts
│   │   ├── jwt.util.ts
│   │   └── validation.util.ts
│   └── index.ts             # Main server file
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password (use app password for Gmail)
- `JWT_SECRET` - Secret for JWT tokens
- `MAGIC_LINK_SECRET` - Secret for magic link tokens

### 3. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Go to Project Settings > Service Accounts
4. Generate new private key
5. Copy credentials to `.env` file

### 4. Email Setup (Gmail Example)
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS` environment variable

### 5. Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Request Magic Link
```http
POST /api/auth/request-magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Magic Link
```http
GET /api/auth/verify?token=<magic_link_token>
```

Response:
```json
{
  "success": true,
  "token": "REDACTED_EXAMPLE_JWT",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <auth_token>
```

### Session Endpoints

#### Create Session
```http
POST /api/sessions
Authorization: Bearer <auth_token>
Content-Type: application/json

{
  "vibe": "Fancy Taco Tuesday",
  "headcount": 6,
  "dietary_restrictions": ["vegan", "gluten-free"]
}
```

#### Get Session
```http
GET /api/sessions/:id
```

#### Generate Share Link
```http
POST /api/sessions/:id/share-link
Authorization: Bearer <auth_token>
```

Response:
```json
{
  "success": true,
  "share_link": "http://localhost:5173/vote/abc123xyz",
  "share_token": "abc123xyz"
}
```

#### Join Session as Guest
```http
POST /api/sessions/:id/join
Content-Type: application/json

{
  "guest_name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "guest_id": "guest_unique_id",
  "session": {
    "id": "session_id",
    "vibe": "Fancy Taco Tuesday",
    "status": "voting"
  }
}
```

#### Get Session by Token
```http
GET /api/sessions/token/:token
```

### Voting Endpoints

#### Submit Vote
```http
POST /api/votes
Content-Type: application/json

{
  "session_id": "session_id",
  "guest_id": "guest_id",
  "meal_id": "meal_id",
  "vote_type": "yes"
}
```

#### Get Voting Progress
```http
GET /api/sessions/:id/progress
```

Response:
```json
{
  "success": true,
  "progress": {
    "total_guests": 5,
    "guests_completed": 3,
    "progress_percentage": 60,
    "winner_id": null
  }
}
```

#### Get Winner
```http
GET /api/sessions/:id/winner
```

Response:
```json
{
  "success": true,
  "winner": {
    "meal_id": "meal_id",
    "meal": {
      "id": "meal_id",
      "title": "Grilled Fish Tacos",
      "description": "...",
      "image_url": "...",
      "ingredients": [...]
    },
    "vote_percentage": 75,
    "yes_votes": 3,
    "total_votes": 4
  }
}
```

#### Get Voting Status
```http
GET /api/sessions/:id/voting-status
```

## 🗄️ Firebase Data Structure

```
firebase-realtime-database/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── created_at: timestamp
│       └── last_login: timestamp
├── sessions/
│   └── {sessionId}/
│       ├── vibe: string
│       ├── headcount: number
│       ├── dietary_restrictions: string[]
│       ├── status: "setup" | "generating" | "voting" | "completed"
│       ├── host_id: string
│       ├── share_token: string
│       ├── created_at: timestamp
│       ├── expires_at: timestamp
│       ├── meals/
│       │   └── {mealId}/
│       │       ├── title: string
│       │       ├── description: string
│       │       ├── image_url: string
│       │       ├── ingredients: Ingredient[]
│       │       └── created_at: timestamp
│       ├── votes/
│       │   └── {guestId}/
│       │       └── {mealId}: "yes" | "no"
│       └── guests/
│           └── {guestId}/
│               ├── guest_name: string
│               ├── has_voted: boolean
│               └── joined_at: timestamp
└── share_tokens/
    └── {token}/
        ├── session_id: string
        └── created_at: timestamp
```

## 🔐 Security Features

- JWT-based authentication with secure token generation
- Magic link tokens expire after 15 minutes
- Session tokens expire after 7 days
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Firebase security rules (to be configured)

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Authentication Flow
```bash
# 1. Request magic link
curl -X POST http://localhost:3000/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Check email for magic link and extract token
# 3. Verify magic link
curl "http://localhost:3000/api/auth/verify?token=<token>"
```

## 📝 Development Notes

### Vote Aggregation Logic
- Winner requires >50% "yes" votes from all guests
- Calculated after each vote submission
- Session status updates to "completed" when winner found
- Fallback to meal with most "yes" votes if no majority

### Magic Link Flow
1. User enters email
2. Backend generates JWT token with email + 15min expiration
3. Email sent with link: `{FRONTEND_URL}/auth/verify?token={jwt}`
4. User clicks link
5. Frontend calls backend to verify token
6. Backend returns auth JWT (7-day expiration)
7. Frontend stores auth JWT in localStorage

## 🚧 TODO (Future Enhancements)

- [ ] AI meal generation integration (OpenAI + DALL-E)
- [ ] WebSocket support for real-time updates
- [ ] Rate limiting middleware
- [ ] Request validation middleware
- [ ] Unit and integration tests
- [ ] API documentation with Swagger
- [ ] Database connection pooling
- [ ] Caching layer (Redis)
- [ ] Logging service integration
- [ ] Monitoring and analytics

## 📄 License

MIT

## 👥 Team

Group Food Tinder Development Team