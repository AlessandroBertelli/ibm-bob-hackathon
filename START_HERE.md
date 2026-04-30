# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Two terminal windows

## Step 1: Start the Backend

Open Terminal 1:
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 Socket.io ready for connections
```

## Step 2: Start the Frontend

Open Terminal 2:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 3: Test the App

1. **Open your browser** to `http://localhost:5173`

2. **Create a party** (Host):
   - Enter a vibe like "Fancy Taco Tuesday"
   - Set headcount (e.g., 2)
   - Click "Generate Menu"

3. **Review meals**:
   - You'll see 3-5 meal options with images
   - Click "Copy Voting Link"

4. **Test voting** (open in new tab/incognito):
   - Paste the voting link
   - Vote Yes/No on each meal
   - Open another tab and vote as a second guest

5. **See the winner**:
   - When all guests vote "Yes" on a meal, winner screen appears!

## Troubleshooting

### Backend won't start
- Check if port 3001 is free: `lsof -i :3001`
- Kill process if needed: `kill -9 <PID>`

### Frontend won't start
- Check if port 5173 is free: `lsof -i :5173`
- Clear node_modules: `rm -rf node_modules && npm install`

### Can't connect to backend
- Ensure backend is running on port 3001
- Check `.env` file in frontend has `VITE_API_URL=http://localhost:3001`

### Images not loading
- The app uses free Unsplash images
- If you have an Unsplash API key, add it to `backend/.env`:
  ```
  UNSPLASH_ACCESS_KEY=your_key_here
  ```

## Testing with Multiple Devices

To test on your phone or another device on the same network:

1. Find your computer's local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Look for something like 192.168.1.x
   ```

2. Update frontend `.env`:
   ```
   VITE_API_URL=http://192.168.1.x:3001
   ```

3. Access from phone: `http://192.168.1.x:5173`

## Features to Test

- ✅ Create party with different vibes
- ✅ Dietary restrictions (Vegan, Gluten-Free)
- ✅ Multiple guests voting simultaneously
- ✅ Real-time vote synchronization
- ✅ Winner detection
- ✅ Mobile responsive design

## Need Help?

Check the main README.md for detailed documentation!