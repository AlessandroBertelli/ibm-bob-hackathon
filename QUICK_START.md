# 🚀 Quick Start Guide

## Super Simple Startup

### One Command to Rule Them All! 

```bash
./start.sh
```

That's it! This script will:
- ✅ Check and install all dependencies
- ✅ Start the backend server (port 3001)
- ✅ Start the frontend server (port 5173)
- ✅ Open your browser automatically

## Alternative: Using npm

```bash
# First time only - install everything
npm run install:all

# Every time - start both servers
npm run dev
```

## What You'll See

```
🚀 Starting Meal Voting App...

✅ All dependencies installed!

🎯 Starting both servers...
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

Press Ctrl+C to stop both servers
```

## First Time Setup

If this is your first time running the app:

1. **Run the startup script:**
   ```bash
   ./start.sh
   ```

2. **Wait for both servers to start** (takes ~10 seconds)

3. **Browser opens automatically** to `http://localhost:5173`

4. **Start using the app!**

## Manual Startup (If You Prefer)

### Terminal 1 - Backend
```bash
cd backend
npm install  # first time only
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install  # first time only
npm run dev
```

## Stopping the App

Press `Ctrl+C` in the terminal where you ran the startup script.

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Dependencies Not Installing

```bash
# Clean install everything
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

### Script Permission Denied

```bash
chmod +x start.sh
./start.sh
```

## What's Running?

- **Backend**: Express + Socket.io server on port 3001
- **Frontend**: React + Vite dev server on port 5173
- **Real-time**: WebSocket connections for live voting

## Next Steps

1. Open `http://localhost:5173` in your browser
2. Create a party with a vibe (e.g., "Fancy Taco Tuesday")
3. Copy the voting link
4. Open it in another tab/browser to test voting
5. Vote and see real-time synchronization!

## Need More Help?

- See `README.md` for full documentation
- See `START_HERE.md` for detailed testing guide
- See `IMPROVEMENTS.md` for latest features

---

**Happy Meal Voting! 🍽️**