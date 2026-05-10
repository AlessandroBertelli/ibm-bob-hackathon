// Wraps every screen. Header is hidden on the landing page (`/`) — the
// logo there is rendered larger as part of the page hero.
//
// Also fires the anonymous visit beacon once per app load.

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { trackVisit } from '../../services/track.service';

export const AppLayout = () => {
    const { pathname } = useLocation();
    const showHeader = pathname !== '/';

    useEffect(() => {
        trackVisit();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            {showHeader && <Header />}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

// Made with Bob
