# 🍕 Group Food Tinder

> A collaborative food decision-making app that helps groups decide where to eat using a Tinder-style swipe interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Service Modes](#-service-modes)
- [Setup Guide](#-setup-guide)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Group Food Tinder solves the age-old problem of **"Where should we eat?"** by allowing group members to swipe through restaurant options. When everyone in the group swipes right on the same restaurant, it's a match! 🎉

### The Problem
- Groups struggle to agree on where to eat
- Too many options lead to decision paralysis
- Traditional voting is tedious and time-consuming

### The Solution
- **Tinder-style interface** - Swipe right (yes) or left (no)
- **AI-powered recommendations** - Personalized meal suggestions
- **Real-time matching** - Instant notifications when consensus is reached
- **Magic link authentication** - No passwords needed

---

## 🚀 Quick Start

Get started in **under 2 minutes** with zero configuration!

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd ibm-bob-hackathon

# 2. Install all dependencies (backend + frontend)
npm run install:all

# 3. Start both servers in mock mode (no API keys needed!)
npm run dev:mock
```

**That's it!** 🎉

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

The app runs in **mock mode** by default with:
- ✅ No API keys required
- ✅ No external services needed
- ✅ Works completely offline
- ✅ Pre-loaded with 20 sample restaurants
- ✅ Perfect for development and testing

---

## 🌟 Features

### Core Features
- 🔐 **Magic Link Authentication** - Passwordless email login
- 👥 **Group Session Management** - Create and share voting sessions
- 🎴 **Tinder-Style Swipe Interface** - Intuitive card-based voting
- 🤖 **AI-Powered Recommendations** - OpenAI-generated meal suggestions
- 📊 **Real-Time Progress Tracking** - Live voting status updates
- 🏆 **Automatic Winner Detection** - Smart consensus algorithm
- 📧 **Email Notifications** - Magic links and session invites
- 📱 **Responsive Design** - Works on mobile and desktop

### User Flow
1. **Host creates session** - Set vibe, headcount, dietary restrictions
2. **AI generates meals** - Personalized restaurant suggestions
3. **Share voting link** - Invite group members
4. **Everyone swipes** - Vote yes/no on each option
5. **Winner announced** - When consensus is reached

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling framework |
| **Framer Motion** | Animations |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **React Hot Toast** | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **Firebase Admin** | Authentication & database |
| **OpenAI API** | AI meal generation |
| **Nodemailer** | Email service |
| **JWT** | Token authentication |

---

## 📁 Project Structure

```
ibm-bob-hackathon/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   │   └── mock/        # Mock service implementations
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Utility functions
│   ├── .env                 # Environment variables (mock defaults)
│   └── package.json
│
├── .gitignore               # Root ignore rules
├── package.json             # Root package with scripts
└── README.md                # This file
```

---

## 🎭 Service Modes

The backend supports three modes to suit different development needs:

### 1. 🧪 Mock Mode (Default)
**Perfect for: Development, testing, demos**

```bash
npm run dev:mock
```

**Features:**
- Zero configuration required
- In-memory mock services
- 20 pre-loaded sample restaurants
- Console-logged emails
- No API keys needed
- Data resets on restart

### 2. 🔧 Test Mode
**Perfect for: Integration testing with real services**

```bash
npm run dev:test
```

**Features:**
- Real external APIs (OpenAI, Firebase, SMTP)
- Persistent data in Firebase
- Actual email delivery
- Requires API keys

### 3. 🚀 Production Mode
**Perfect for: Deployment**

```bash
npm run dev:prod
```

**Features:**
- Full production configuration
- All services operational
- Optimized performance
- Requires all credentials

### Switching Modes

**Option 1: Root-level scripts (Recommended)**
```bash
npm run dev:mock    # Mock mode
npm run dev:test    # Test mode
npm run dev:prod    # Production mode
```

**Option 2: Edit backend/.env**
```env
SERVICE_MODE=mock   # or 'test' or 'production'
```

**Option 3: Backend-only scripts**
```bash
cd backend
npm run dev:mock    # Force mock mode
npm run dev:test    # Force test mode
npm run dev:prod    # Force production mode
```

---

## 📚 Setup Guide

### Mock Mode Setup (Recommended for Development)

**No setup required!** Just run:
```bash
npm run install:all
npm run dev:mock
```

### Test/Production Mode Setup

For full functionality with real services, you'll need:

#### 1. Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Add credentials to `backend/.env`

#### 2. OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com)
2. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=your_key_here
   ```

#### 3. Email Setup (Gmail Example)
1. Enable 2FA on Google account
2. Generate App Password at [Google Account](https://myaccount.google.com/apppasswords)
3. Add to `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

#### 4. Environment Variables

**Backend (.env)**
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Service Mode
SERVICE_MODE=mock  # or 'test' or 'production'

# Firebase Admin SDK (for test/production mode)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_client_email

# OpenAI (for test/production mode)
OPENAI_API_KEY=your_openai_api_key

# Email (for test/production mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# JWT Secrets
JWT_SECRET=your_jwt_secret_change_in_production
MAGIC_LINK_SECRET=your_magic_link_secret
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

For detailed setup instructions, see:
- [Backend Setup Guide](backend/SETUP.md)
- [Mock Services Documentation](backend/src/services/mock/README.md)

---

## 💻 Development

### Root-Level Scripts (Recommended)

Run these from the project root to control both backend and frontend:

#### Installation
```bash
npm run install:all          # Install all dependencies
```

#### Development
```bash
npm run dev:mock             # Both servers in mock mode (default)
npm run dev:test             # Both servers in test mode
npm run dev:prod             # Both servers in production mode
npm run dev:backend          # Backend only (mock mode)
npm run dev:frontend         # Frontend only
```

#### Build & Deploy
```bash
npm run build                # Build both projects
npm run start                # Run both production servers
npm run clean                # Clean build artifacts
```

#### Code Quality
```bash
npm run typecheck            # TypeScript type checking
npm run lint                 # ESLint on both projects
npm run check:tailwind       # Verify Tailwind config
npm run check:all            # Run all checks
```

### Frontend Scripts

Run from `frontend/` directory:

```bash
npm run dev                  # Start dev server
npm run build                # Build for production
npm run preview              # Preview production build
npm run lint                 # Run ESLint
```

### Backend Scripts

Run from `backend/` directory:

```bash
npm run dev                  # Start dev server (mock mode)
npm run dev:mock             # Force mock mode
npm run dev:test             # Force test mode
npm run dev:prod             # Force production mode
npm run build                # Compile TypeScript
npm start                    # Run production server
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Request Magic Link
```http
POST /auth/request-magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Magic Link
```http
GET /auth/verify?token=<magic_link_token>

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Session Endpoints

#### Create Session
```http
POST /sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "vibe": "Fancy Taco Tuesday",
  "headcount": 6,
  "dietary_restrictions": ["vegan", "gluten-free"]
}
```

#### Get Session
```http
GET /sessions/:id
```

#### Generate Share Link
```http
POST /sessions/:id/share-link
Authorization: Bearer <token>

Response:
{
  "success": true,
  "share_link": "http://localhost:5173/vote/abc123",
  "share_token": "abc123"
}
```

#### Join Session as Guest
```http
POST /sessions/:id/join
Content-Type: application/json

{
  "guest_name": "John Doe"
}
```

### Voting Endpoints

#### Submit Vote
```http
POST /votes
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
GET /sessions/:id/progress

Response:
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
GET /sessions/:id/winner

Response:
{
  "success": true,
  "winner": {
    "meal_id": "meal_id",
    "meal": { ... },
    "vote_percentage": 75,
    "yes_votes": 3,
    "total_votes": 4
  }
}
```

For complete API documentation, see [Backend README](backend/README.md).

---

## 🚀 Deployment

### Frontend Deployment

#### Vercel (Recommended)
1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy

#### Netlify
1. Build: `npm run build`
2. Publish directory: `frontend/dist`
3. Add `_redirects` file for SPA routing

### Backend Deployment

#### Heroku
```bash
cd backend
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set SERVICE_MODE=production
# Add other environment variables
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run check:all
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines
- Write TypeScript with proper types
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Test in mock mode before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the Group Food Tinder team for the IBM Bob Hackathon.

---

## 📞 Support

- **Documentation**: Check the [Backend README](backend/README.md) and [Frontend README](frontend/README.md)
- **Issues**: Open an issue on GitHub
- **Questions**: Contact the development team

---

## 🗺️ Roadmap

- [x] Magic link authentication
- [x] Session management
- [x] Tinder-style swipe interface
- [x] Mock mode for development
- [x] Real-time voting progress
- [x] Winner determination algorithm
- [ ] AI meal generation (OpenAI integration)
- [ ] WebSocket for real-time updates
- [ ] PWA support
- [ ] Mobile app (React Native)
- [ ] Advanced dietary filters
- [ ] Restaurant API integration
- [ ] Social sharing features

---

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Firebase for backend services
- The React and Node.js communities
- All contributors and testers

---

<div align="center">

**[⬆ Back to Top](#-group-food-tinder)**

Made with 🍕 and ❤️

</div>