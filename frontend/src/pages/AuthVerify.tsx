// Magic-link landing. Supabase sends users back here with an auth fragment
// in the URL hash (or, with PKCE flow, a `code` query param). We finalise the
// session and redirect to the original target.

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import {
    clearPostSignInRedirect,
    getPostSignInRedirect,
    isSafeRedirectPath,
} from '../utils/storage';
import { t } from '../i18n/en';

const FALLBACK_REDIRECT = '/create';

export const AuthVerify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                // PKCE flow: exchange the `?code=…` for a session.
                const code = searchParams.get('code');
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                } else if (window.location.hash.includes('access_token')) {
                    // Hash flow: parse the fragment and store the session.
                    const params = new URLSearchParams(window.location.hash.slice(1));
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');
                    if (!access_token || !refresh_token) {
                        throw new Error('Missing tokens in URL fragment');
                    }
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) throw error;
                    // Clean the fragment from the URL bar.
                    window.history.replaceState(
                        {},
                        document.title,
                        window.location.pathname + window.location.search
                    );
                } else {
                    // Already authenticated? OK.
                    const { data } = await supabase.auth.getSession();
                    if (!data.session) throw new Error('No session token found');
                }

                setStatus('success');
                toast.success(t.authVerify.successTitle);

                // Open-redirect defence: only same-origin paths are honoured.
                const fromQuery = searchParams.get('redirect_to');
                const fromStorage = getPostSignInRedirect();
                const target = isSafeRedirectPath(fromQuery)
                    ? fromQuery
                    : fromStorage ?? FALLBACK_REDIRECT;
                clearPostSignInRedirect();

                setTimeout(() => navigate(target, { replace: true }), 800);
            } catch (err) {
                console.error('Auth verify failed:', err);
                setStatus('error');
                setErrorMessage(t.authVerify.errorBody);
                toast.error(t.authVerify.errorTitle);
            }
        };
        verify();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
                {status === 'verifying' && <LoadingSpinner size="lg" text={t.authVerify.verifying} />}

                {status === 'success' && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                        <div className="w-20 h-20 bg-green-100 rounded-full grid place-items-center mx-auto mb-4">
                            <span className="text-4xl">✓</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t.authVerify.successTitle}
                        </h2>
                        <p className="text-gray-600">{t.authVerify.successBody}</p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                        <div className="w-20 h-20 bg-red-100 rounded-full grid place-items-center mx-auto mb-4">
                            <span className="text-4xl">✗</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t.authVerify.errorTitle}
                        </h2>
                        <p className="text-gray-600 mb-6">{errorMessage}</p>
                        <Button variant="primary" onClick={() => navigate('/')} fullWidth>
                            {t.authVerify.backHome}
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

// Made with Bob
