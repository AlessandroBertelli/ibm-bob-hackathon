// Magic link verification page

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import * as authService from '../services/auth.service';
import toast from 'react-hot-toast';

export const AuthVerify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token');

            console.log('[AUTH VERIFY] Token from URL:', token);
            console.log('[AUTH VERIFY] Token length:', token?.length);
            console.log('[AUTH VERIFY] Full URL:', window.location.href);

            if (!token) {
                setStatus('error');
                setErrorMessage('Invalid verification link');
                return;
            }

            try {
                console.log('[AUTH VERIFY] Calling verifyMagicLink with token:', token);
                await authService.verifyMagicLink(token);
                setStatus('success');
                toast.success('Successfully authenticated!');

                // Redirect to create session page after a short delay
                setTimeout(() => {
                    navigate('/create');
                }, 1500);
            } catch (err) {
                console.error('Verification failed:', err);
                setStatus('error');
                setErrorMessage('Verification failed. The link may have expired.');
                toast.error('Verification failed');
            }
        };

        verifyToken();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
                {status === 'verifying' && (
                    <>
                        <LoadingSpinner size="lg" text="Verifying your link..." />
                    </>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">✓</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verification Successful!
                        </h2>
                        <p className="text-gray-600">
                            Redirecting you to create a session...
                        </p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">✗</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600 mb-6">{errorMessage}</p>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                            fullWidth
                        >
                            Back to Home
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

// Made with Bob
