// Loading spinner component with animations

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
};

export const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                className={`${sizeStyles[size]} border-4 border-gray-200 border-t-orange-500 rounded-full`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {text && (
                <motion.p
                    className="text-gray-600 text-sm font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

// Made with Bob
