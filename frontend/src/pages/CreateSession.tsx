// Session creation page (Screen 1)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import type { DietaryRestriction } from '../types';
import * as sessionService from '../services/session.service';
import toast from 'react-hot-toast';

export const CreateSession = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        vibe: '',
        headcount: 4,
        dietaryRestrictions: {
            vegan: false,
            glutenFree: false,
        } as DietaryRestriction,
    });
    const [errors, setErrors] = useState({
        vibe: '',
        headcount: '',
    });

    const validateForm = (): boolean => {
        const newErrors = { vibe: '', headcount: '' };
        let isValid = true;

        if (!formData.vibe || formData.vibe.length < 3) {
            newErrors.vibe = 'Vibe must be at least 3 characters';
            isValid = false;
        }

        if (formData.headcount < 2 || formData.headcount > 20) {
            newErrors.headcount = 'Headcount must be between 2 and 20';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const session = await sessionService.createSession(formData);
            toast.success('Session created! Generating meals...');
            navigate(`/session/${session.id}`);
        } catch (err) {
            console.error('Failed to create session:', err);
            toast.error('Failed to create session. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Create Your Session
                    </h1>
                    <p className="text-white text-lg opacity-90">
                        Tell us about your group and we'll generate perfect meal options
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Vibe Input */}
                        <div>
                            <Input
                                label="Event Vibe"
                                placeholder="e.g., Fancy Taco Tuesday, Cozy Movie Night"
                                value={formData.vibe}
                                onChange={(e) =>
                                    setFormData({ ...formData, vibe: e.target.value })
                                }
                                error={errors.vibe}
                                fullWidth
                                disabled={isLoading}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Describe the mood or theme of your meal
                            </p>
                        </div>

                        {/* Headcount Input */}
                        <div>
                            <Input
                                label="Headcount"
                                type="number"
                                min={2}
                                max={20}
                                value={formData.headcount.toString()}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        headcount: parseInt(e.target.value) || 2,
                                    })
                                }
                                error={errors.headcount}
                                fullWidth
                                disabled={isLoading}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                How many people will be eating? (2-20)
                            </p>
                        </div>

                        {/* Dietary Restrictions */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Dietary Restrictions
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.dietaryRestrictions.vegan || false}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                dietaryRestrictions: {
                                                    ...formData.dietaryRestrictions,
                                                    vegan: e.target.checked,
                                                },
                                            })
                                        }
                                        disabled={isLoading}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600"
                                    />
                                    <span className="text-gray-700">Vegan</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.dietaryRestrictions.glutenFree || false}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                dietaryRestrictions: {
                                                    ...formData.dietaryRestrictions,
                                                    glutenFree: e.target.checked,
                                                },
                                            })
                                        }
                                        disabled={isLoading}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600"
                                    />
                                    <span className="text-gray-700">Gluten-Free</span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isLoading}
                        >
                            Generate Menu
                        </Button>
                    </form>
                </Card>

                {/* Info */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-white text-sm mt-6 opacity-80"
                >
                    This may take 30-60 seconds while we generate your personalized menu
                </motion.p>
            </motion.div>
        </div>
    );
};

// Made with Bob
