# Group Food Tinder - Frontend

A beautiful, responsive React application with Tinder-style swipe interface for group food decision making.

## 🚀 Features

- **Magic Link Authentication** - Passwordless login via email
- **Tinder-Style Swipe Interface** - Intuitive card-based voting
- **Real-time Updates** - Live voting progress tracking
- **AI-Generated Meals** - Personalized meal suggestions
- **Responsive Design** - Optimized for mobile and desktop
- **Beautiful Animations** - Smooth transitions with Framer Motion
- **Toast Notifications** - User-friendly feedback

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MealCard.tsx
│   │   ├── SwipeCard.tsx
│   │   └── ProgressBar.tsx
│   ├── pages/              # Page components
│   │   ├── Landing.tsx
│   │   ├── AuthVerify.tsx
│   │   ├── CreateSession.tsx
│   │   ├── SessionView.tsx
│   │   ├── VotingInterface.tsx
│   │   └── Winner.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   └── useSwipe.ts
│   ├── services/           # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── session.service.ts
│   │   └── vote.service.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── storage.ts
│   │   ├── animations.ts
│   │   └── helpers.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables:
```env
VITE_API_URL=http://localhost:3000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🎨 Design System

### Colors

- **Primary**: Orange/Red gradient (food-themed)
- **Secondary**: Green (success, yes votes)
- **Accent**: Yellow (highlights)
- **Error**: Red (no votes, errors)

### Typography

- **Font**: Inter (system fallback)
- **Headings**: Bold, large, attention-grabbing
- **Body**: Clean, readable

### Animations

- **Card Swipes**: Smooth, natural feeling
- **Page Transitions**: Subtle, quick
- **Loading**: Engaging, not distracting
- **Success States**: Celebratory

## 📱 User Flow

1. **Landing Page** (`/`)
   - Enter email
   - Receive magic link

2. **Auth Verification** (`/auth/verify`)
   - Verify magic link token
   - Redirect to create session

3. **Create Session** (`/create`)
   - Enter event vibe
   - Set headcount
   - Select dietary restrictions
   - Generate menu

4. **Session View** (`/session/:id`)
   - Review AI-generated meals
   - Generate voting link
   - Share with group

5. **Voting Interface** (`/vote/:token`)
   - Swipe through meals
   - Vote yes/no on each
   - Track progress

6. **Winner Display** (`/winner/:sessionId`)
   - View winning meal
   - See full recipe
   - Start new session

## 🎯 Key Features Implementation

### Swipe Functionality

The swipe interface uses Framer Motion's drag functionality:

```typescript
// SwipeCard component
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={handleDragEnd}
>
  {children}
</motion.div>
```

### Real-time Updates

Polling mechanism for voting progress:

```typescript
// useSession hook
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const progress = await voteService.getProgress(sessionId);
    // Update UI
  }, 3000);
  
  return () => clearInterval(pollInterval);
}, [sessionId]);
```

### Magic Link Authentication

1. User enters email
2. Backend sends magic link
3. User clicks link
4. Token verified
5. User authenticated

## 🔧 Configuration

### API Configuration

Update `VITE_API_URL` in `.env` to point to your backend:

```env
VITE_API_URL=http://localhost:3000/api
```

### Tailwind Configuration

Custom theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* orange/red shades */ },
      secondary: { /* green shades */ },
      accent: { /* yellow shades */ }
    },
    animation: {
      'swipe-left': 'swipeLeft 0.3s ease-out',
      'swipe-right': 'swipeRight 0.3s ease-out'
    }
  }
}
```

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing

### UI/UX
- `framer-motion` - Animations
- `react-hot-toast` - Notifications

### HTTP
- `axios` - HTTP client

### Development
- `typescript` - Type checking
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `eslint` - Linting

## 🎨 Component Library

### Button
```tsx
<Button variant="primary" isLoading={false}>
  Click Me
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  error={error}
  fullWidth
/>
```

### SwipeCard
```tsx
<SwipeCard
  onSwipeLeft={() => handleNo()}
  onSwipeRight={() => handleYes()}
>
  <MealCard meal={meal} />
</SwipeCard>
```

## 🐛 Troubleshooting

### Build Errors

If you encounter TypeScript errors:
```bash
npm run build -- --mode development
```

### API Connection Issues

Check that:
1. Backend is running
2. `.env` has correct API URL
3. CORS is configured on backend

### Styling Issues

Clear Tailwind cache:
```bash
rm -rf node_modules/.cache
npm run dev
```

## 📝 Best Practices

1. **Type Safety**: Use TypeScript types for all props and state
2. **Error Handling**: Always handle API errors gracefully
3. **Loading States**: Show loading indicators for async operations
4. **Accessibility**: Use semantic HTML and ARIA labels
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Performance**: Lazy load images, optimize animations

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Netlify

1. Build the project: `npm run build`
2. Deploy `dist` folder
3. Configure redirects for SPA

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for group food decisions
