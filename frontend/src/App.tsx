// Main App component with routing

import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing.tsx';
import { AuthVerify } from './pages/AuthVerify.tsx';
import { CreateSession } from './pages/CreateSession.tsx';
import { SessionView } from './pages/SessionView.tsx';
import { VotingInterface } from './pages/VotingInterface.tsx';
import { Winner } from './pages/Winner.tsx';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/verify" element={<AuthVerify />} />
        <Route path="/create" element={<CreateSession />} />
        <Route path="/session/:id" element={<SessionView />} />
        <Route path="/vote/:token" element={<VotingInterface />} />
        <Route path="/winner/:sessionId" element={<Winner />} />
      </Routes>
    </div>
  );
}

export default App;

// Made with Bob
