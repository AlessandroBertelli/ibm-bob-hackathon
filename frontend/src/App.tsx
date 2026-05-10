// Top-level routing.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { AuthVerify } from './pages/AuthVerify';
import { CreateSession } from './pages/CreateSession';
import { SessionView } from './pages/SessionView';
import { VotingInterface } from './pages/VotingInterface';
import { LiveResults } from './pages/LiveResults';
import { SavedMeals } from './pages/SavedMeals';

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/verify" element={<AuthVerify />} />
                <Route path="/auth/verify" element={<AuthVerify />} />
                <Route path="/create" element={<CreateSession />} />
                <Route path="/session/:id" element={<SessionView />} />
                <Route path="/vote/:token" element={<VotingInterface />} />
                <Route path="/results/:token" element={<LiveResults />} />
                <Route path="/profile/saved-meals" element={<SavedMeals />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;

// Made with Bob
