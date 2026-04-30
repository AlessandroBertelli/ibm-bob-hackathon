# 🍽️ Meal Voting App

A real-time collaborative meal selection app where a host creates a party with a vibe/theme, generates meal options, and guests vote Tinder-style until a unanimous winner is found.

## ✨ Features

- **Host Setup**: Create a party with custom vibe, headcount, and dietary restrictions
- **AI-Powered Meals**: Generate 3-5 unique meal options with images
- **Shareable Links**: Share a unique URL with guests for voting
- **Tinder-Style Voting**: Swipe right (yes) or left (no) on meal options
- **Real-Time Sync**: All votes synchronize instantly across all devices
- **Winner Detection**: Automatically finds meals with unanimous approval
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ with Vite
- React Router for navigation
- Socket.io Client for real-time updates
- CSS Modules for styling

**Backend:**
- Node.js with Express
- Socket.io for WebSocket connections
- In-memory storage for local development
- Unsplash API for food images (optional)
- OpenAI API for meal generation (optional)

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern web browser
- (Optional) OpenAI API key for AI-generated meals
- (Optional) Unsplash API key for better food images

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd meal-voting-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development

# Optional: For AI-generated meals
OPENAI_API_KEY=your_openai_api_key_here

# Optional: For better food images
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

### 4. Open in Browser

Navigate to `http://localhost:5173` to start using the app!

## 📱 How to Use

### For Hosts:

1. **Create a Party**
   - Enter a vibe/theme (e.g., "Fancy Taco Tuesday")
   - Set the number of guests
   - Toggle dietary restrictions if needed
   - Click "Generate Menu"

2. **Review Meals**
   - Browse the generated meal options
   - Each shows an image, title, description, and ingredients
   - Click "Create Voting Link"

3. **Share the Link**
   - Copy the generated link
   - Share it with your guests via text, email, etc.

4. **Wait for Results**
   - Guests will vote on meals
   - You'll see the winner when everyone agrees!

### For Guests:

1. **Join via Link**
   - Click the link shared by the host
   - You'll see the party's meal options

2. **Vote on Meals**
   - Swipe right (or click Yes) if you like a meal
   - Swipe left (or click No) if you don't
   - Continue through all options

3. **See the Winner**
   - When everyone votes yes on a meal, it wins!
   - View the full recipe and ingredient list

## 🗂️ Project Structure

```
meal-voting-app/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server setup
│   │   ├── routes/
│   │   │   └── parties.js         # Party API endpoints
│   │   ├── services/
│   │   │   ├── mealGenerator.js   # Meal generation logic
│   │   │   └── imageService.js    # Image fetching service
│   │   ├── socket/
│   │   │   └── votingHandler.js   # Real-time voting logic
│   │   └── utils/
│   │       └── storage.js         # In-memory data storage
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HostSetup.jsx      # Screen 1: Party setup
│   │   │   ├── MenuReview.jsx     # Screen 2: Meal review
│   │   │   ├── GuestVoting.jsx    # Screen 3: Voting interface
│   │   │   ├── WinnerScreen.jsx   # Screen 4: Winner display
│   │   │   └── ...                # Shared components
│   │   ├── services/
│   │   │   ├── api.js             # API client
│   │   │   └── socket.js          # Socket.io client
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   ├── package.json
│   └── .env
└── README.md
```

## 🔧 Development

### Backend Scripts

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

### Frontend Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Host can create a party with custom vibe
- [ ] Meals generate with images and descriptions
- [ ] Shareable link works in new browser tab
- [ ] Multiple guests can join the same party
- [ ] Votes sync in real-time across all clients
- [ ] Winner is detected when all guests vote yes
- [ ] Winner screen displays correct meal details
- [ ] Mobile responsive design works properly

### Testing with Multiple Devices

1. Start the backend and frontend servers
2. Open `http://localhost:5173` in your main browser (Host)
3. Create a party and generate meals
4. Copy the voting link
5. Open the link in:
   - Another browser tab (Guest 1)
   - Incognito/private window (Guest 2)
   - Your phone on the same network (Guest 3)
6. Vote on meals and watch real-time synchronization!

## 🎨 Customization

### Meal Templates

If not using OpenAI, edit `backend/src/services/mealGenerator.js` to customize the predefined meal templates.

### Styling

Modify `frontend/src/styles/` to customize colors, fonts, and layouts.

### Voting Rules

Edit `backend/src/socket/votingHandler.js` to change winner detection logic (e.g., majority instead of unanimous).

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all dependencies are installed: `npm install`
- Check `.env` file exists and is properly formatted

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is enabled in backend

### Real-time voting not working
- Check browser console for Socket.io errors
- Ensure both frontend and backend are running
- Try refreshing the page

### Images not loading
- Check Unsplash API key if using
- Fallback placeholder images should work without API key
- Check browser console for image loading errors

## 📚 Documentation

- [`TECHNICAL_SPEC.md`](./TECHNICAL_SPEC.md) - Detailed technical specifications
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) - Step-by-step implementation guide
- [`USER_FLOW.md`](./USER_FLOW.md) - Visual user flow diagrams

## 🚧 Future Enhancements

- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] User authentication
- [ ] Party history and favorites
- [ ] Recipe ratings and reviews
- [ ] Shopping list generation
- [ ] Calendar integration
- [ ] Push notifications
- [ ] Progressive Web App (PWA)

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🤝 Contributing

This is a local development project. Feel free to fork and customize for your needs!

---

**Built with ❤️ for collaborative meal planning**
