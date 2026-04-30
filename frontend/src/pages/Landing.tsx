// Landing/Login page with magic link authentication

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { validateEmail } from '../utils/helpers';
import * as authService from '../services/auth.service';
import toast from 'react-hot-toast';

export const Landing = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate email
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            await authService.requestMagicLink(email);
            setEmailSent(true);
            toast.success('Magic link sent! Check your email.');
        } catch (err) {
            console.error('Failed to send magic link:', err);
            toast.error('Failed to send magic link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* App Branding */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-block mb-4"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl">
                            <span className="text-4xl">🍽️</span>
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Group Food Tinder
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Swipe your way to the perfect group meal
                    </p>
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    {!emailSent ? (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Get Started
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={error}
                                    fullWidth
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    isLoading={isLoading}
                                >
                                    Send Magic Link
                                </Button>
                            </form>
                            <p className="text-sm text-gray-500 mt-4 text-center">
                                We'll send you a magic link to sign in instantly
                            </p>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-4"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✉️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Check Your Email
                            </h3>
                            <p className="text-gray-600 mb-4">
                                We've sent a magic link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Click the link in your email to continue
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEmailSent(false);
                                    setEmail('');
                                }}
                                fullWidth
                            >
                                Use Different Email
                            </Button>
                        </motion.div>
                    )}
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 grid grid-cols-3 gap-4 text-center"
                >
                    <div>
                        <div className="text-3xl mb-2">🎯</div>
                        <p className="text-sm text-gray-600">AI-Generated Meals</p>
                    </div>
                    <div>
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-sm text-gray-600">Group Voting</p>
                    </div>
                    <div>
                        <div className="text-3xl mb-2">⚡</div>
                        <p className="text-sm text-gray-600">Instant Results</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// Made with Bob
