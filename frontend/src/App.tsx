// Top-level routing.

import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { AuthVerify } from './pages/AuthVerify';
import { CreateSession } from './pages/CreateSession';
import { SessionView } from './pages/SessionView';
import { VotingInterface } from './pages/VotingInterface';
import { LiveResults } from './pages/LiveResults';
import { SavedMeals } from './pages/SavedMeals';
import { supabase } from './lib/supabase';
import { trackLogin } from './services/track.service';
import { getMockToken } from './utils/storage';

function App() {
    const trackedLogin = useRef(false);

    // Global tracking listener. Runs exactly once at the top level.
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (getMockToken()) return;
            if (event === 'SIGNED_IN' && session?.user && !trackedLogin.current) {
                trackedLogin.current = true;
                void trackLogin();
            } else if (event === 'SIGNED_OUT') {
                trackedLogin.current = false;
            }
        });

        return () => sub.subscription.unsubscribe();
    }, []);

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
