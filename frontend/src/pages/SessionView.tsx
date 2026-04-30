// Menu review page (Screen 2 - Host View)

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MealCard } from '../components/MealCard';
import { useSession } from '../hooks/useSession';
import * as sessionService from '../services/session.service';
import { copyToClipboard, getShareUrl } from '../utils/helpers';
import { SessionStatus } from '../types';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export const SessionView = () => {
    const { id } = useParams<{ id: string }>();
    const { session, isLoading, loadSession, regenerate } = useSession(id, true); // Enable polling
    const [showShareModal, setShowShareModal] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    useEffect(() => {
        if (id) {
            loadSession(id);
        }
    }, [id, loadSession]);

    const handleGenerateLink = async () => {
        if (!session) return;

        setIsGeneratingLink(true);
        try {
            const response = await sessionService.generateShareLink(session.id);
            const fullUrl = getShareUrl(response.share_token);
            setShareLink(fullUrl);
            setShowShareModal(true);
            toast.success('Voting link created!');
        } catch (err) {
            console.error('Failed to generate share link:', err);
            toast.error('Failed to generate link');
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const handleCopyLink = async () => {
        const success = await copyToClipboard(shareLink);
        if (success) {
            toast.success('Link copied to clipboard!');
        } else {
            toast.error('Failed to copy link');
        }
    };

    const handleRegenerate = async () => {
        try {
            await regenerate();
            toast.success('Generating new meal options...');
        } catch {
            toast.error('Failed to regenerate meals');
        }
    };

    if (isLoading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading your session..." />
            </div>
        );
    }

    if (session.status === SessionStatus.GENERATING) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md text-center">
                    <LoadingSpinner size="lg" text="Generating delicious options..." />
                    <p className="text-gray-600 mt-4">
                        This may take 30-60 seconds
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Your Menu Options
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {session.vibe} • {session.headcount} people
                    </p>
                </motion.div>

                {/* Meal Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {session.meals.map((meal, index) => (
                        <motion.div
                            key={meal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <MealCard meal={meal} />
                        </motion.div>
                    ))}
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto"
                >
                    <Button
                        variant="primary"
                        onClick={handleGenerateLink}
                        isLoading={isGeneratingLink}
                        className="flex-1"
                    >
                        Create Voting Link
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleRegenerate}
                        className="flex-1"
                    >
                        Regenerate Options
                    </Button>
                </motion.div>

                {/* Share Modal */}
                <AnimatePresence>
                    {showShareModal && !showQRCode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setShowShareModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-8 max-w-md w-full"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Share Voting Link
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Share this link with your group to start voting:
                                </p>
                                <div className="bg-gray-100 rounded-xl p-4 mb-4 break-all text-sm">
                                    {shareLink}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={handleCopyLink}
                                        fullWidth
                                    >
                                        Copy Link
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowQRCode(true)}
                                        fullWidth
                                    >
                                        Show QR Code
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowShareModal(false)}
                                        fullWidth
                                    >
                                        Close
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* QR Code Modal */}
                <AnimatePresence>
                    {showQRCode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setShowQRCode(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-8 max-w-2xl w-full"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                                    Scan to Vote
                                </h3>
                                <p className="text-gray-600 mb-6 text-center">
                                    Scan this QR code with your phone to join the voting
                                </p>
                                <div className="flex justify-center mb-6 bg-white p-8 rounded-2xl">
                                    <QRCodeSVG
                                        value={shareLink}
                                        size={320}
                                        level="H"
                                        includeMargin={true}
                                        className="w-full h-auto max-w-[320px]"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowQRCode(false)}
                                        fullWidth
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setShowQRCode(false);
                                            setShowShareModal(false);
                                        }}
                                        fullWidth
                                    >
                                        Close
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Made with Bob
