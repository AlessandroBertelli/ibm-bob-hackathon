# Meal Voting App - Implementation Plan

## Development Phases

This document outlines the step-by-step implementation plan for building the meal voting app locally.

## Phase 1: Project Foundation

### 1.1 Project Structure Setup
Create the following directory structure:
```
meal-voting-app/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

### 1.2 Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "uuid": "^9.0.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### 1.3 Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "socket.io-client": "^4.6.1",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}
```

## Phase 2: Backend Development

### 2.1 Express Server Setup
**File**: `backend/src/server.js`
- Initialize Express app
- Configure CORS for localhost
- Set up Socket.io server
- Define port (3001)
- Add basic error handling

### 2.2 Data Storage Layer
**File**: `backend/src/utils/storage.js`
- Create in-memory storage using Map
- Implement party storage
- Implement guest tracking
- Add helper functions for CRUD operations

### 2.3 Meal Generation Service
**File**: `backend/src/services/mealGenerator.js`
- Create meal generation logic
- Option 1: Use OpenAI API (if key provided)
- Option 2: Use predefined meal templates
- Scale ingredients based on headcount
- Apply dietary restriction filters

### 2.4 Image Service
**File**: `backend/src/services/imageService.js`
- Integrate Unsplash API (if key provided)
- Fallback to placeholder images
- Search by meal name + "food"
- Cache images for session

### 2.5 Party Routes
**File**: `backend/src/routes/parties.js`
- POST `/api/parties` - Create new party
- GET `/api/parties/:id` - Get party details
- POST `/api/parties/:id/generate-meals` - Generate meals
- GET `/api/parties/:id/status` - Get voting status

### 2.6 Socket.io Voting Handler
**File**: `backend/src/socket/votingHandler.js`
- Handle `join-party` event
- Handle `vote` event
- Broadcast `vote-update` to all clients
- Implement winner detection logic
- Emit `winner-found` when unanimous

## Phase 3: Frontend Development

### 3.1 React App Setup
**File**: `frontend/src/main.jsx`
- Initialize React app
- Set up React Router
- Configure base routes

**File**: `frontend/src/App.jsx`
- Define route structure
- Set up layout wrapper

### 3.2 API Service Layer
**File**: `frontend/src/services/api.js`
- Create axios instance
- Implement API methods:
  - `createParty(data)`
  - `getParty(id)`
  - `generateMeals(partyId)`

**File**: `frontend/src/services/socket.js`
- Initialize Socket.io client
- Export socket instance
- Create helper functions for events

### 3.3 Screen 1: Host Setup
**File**: `frontend/src/components/HostSetup.jsx`
- Create form with controlled inputs
- Vibe text input
- Headcount number input (2-20)
- Dietary restriction toggles
- Form validation
- Submit handler to create party
- Navigate to Menu Review on success

### 3.4 Screen 2: Menu Review
**File**: `frontend/src/components/MenuReview.jsx`
- Fetch party data on mount
- Display loading spinner during generation
- Render meal cards in grid
- Each card shows:
  - Image
  - Title
  - Description
  - Ingredient list
- "Create Voting Link" button
- Copy link to clipboard functionality
- Display shareable URL

**File**: `frontend/src/components/MealCard.jsx`
- Reusable meal card component
- Props: meal data
- Responsive image
- Styled content

### 3.5 Screen 3: Guest Voting
**File**: `frontend/src/components/GuestVoting.jsx`
- Connect to Socket.io on mount
- Join party room
- Display current meal card
- Swipe/button interface for voting
- Submit vote via socket
- Listen for vote updates
- Auto-advance to next meal
- Navigate to winner screen when found

**File**: `frontend/src/components/SwipeableCard.jsx`
- Implement swipe gestures (optional)
- Yes/No buttons as fallback
- Card animation
- Touch/mouse event handlers

### 3.6 Winner Screen
**File**: `frontend/src/components/WinnerScreen.jsx`
- Display winning meal
- Show celebration animation
- Full recipe details
- Ingredient list
- Optional: Print/share buttons

### 3.7 Shared Components
**File**: `frontend/src/components/LoadingSpinner.jsx`
- Reusable loading component

**File**: `frontend/src/components/VotingProgress.jsx`
- Show vote count
- Progress bar or indicator

## Phase 4: Styling

### 4.1 Global Styles
**File**: `frontend/src/styles/global.css`
- CSS reset
- Color variables
- Typography
- Responsive breakpoints

### 4.2 Component Styles
- Use CSS Modules or inline styles
- Mobile-first approach
- Card animations
- Button hover states
- Loading animations

### 4.3 Responsive Design
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## Phase 5: Integration & Testing

### 5.1 Integration Testing
- Test host flow: setup → menu review → link creation
- Test guest flow: join → vote → winner
- Test real-time sync with multiple browser tabs
- Test edge cases:
  - All guests vote no on all meals
  - Guest disconnects mid-voting
  - Invalid party ID

### 5.2 Error Handling
- Network errors
- Invalid inputs
- Party not found
- Socket disconnection
- API failures

### 5.3 Loading States
- Meal generation loading
- Vote submission loading
- Party data fetching

## Phase 6: Documentation

### 6.1 README.md
- Project description
- Prerequisites
- Installation steps
- Running locally
- Environment variables
- Troubleshooting

### 6.2 Code Comments
- Document complex logic
- Add JSDoc comments for functions
- Explain Socket.io events

## Development Workflow

### Step-by-Step Execution Order

1. **Backend Foundation**
   - Set up Express server
   - Configure CORS and Socket.io
   - Create storage utilities

2. **Backend Services**
   - Implement meal generator
   - Implement image service
   - Create party routes

3. **Backend Real-time**
   - Set up Socket.io handlers
   - Implement voting logic
   - Add winner detection

4. **Frontend Foundation**
   - Set up React + Vite
   - Configure routing
   - Create API service layer

5. **Frontend Screens (in order)**
   - Host Setup screen
   - Menu Review screen
   - Guest Voting screen
   - Winner screen

6. **Styling & Polish**
   - Add global styles
   - Style components
   - Add animations

7. **Testing & Refinement**
   - Test complete flow
   - Fix bugs
   - Optimize performance

## Quick Start Commands

```bash
# Initialize backend
cd backend
npm init -y
npm install express socket.io cors dotenv uuid axios
npm install -D nodemon

# Initialize frontend
cd frontend
npm create vite@latest . -- --template react
npm install react-router-dom socket.io-client axios

# Run development servers
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## Success Criteria

- ✅ Host can create party with custom vibe
- ✅ 3-5 meals generated with images
- ✅ Shareable link works across browser tabs
- ✅ Real-time voting synchronizes instantly
- ✅ Winner detected when all vote yes
- ✅ Mobile responsive design
- ✅ Error handling for edge cases
- ✅ Clean, maintainable code

---

**Ready to implement?** Switch to Code mode to begin building!