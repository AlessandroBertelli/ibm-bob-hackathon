// Progress bar component for voting progress

import { motion } from 'framer-motion';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
    className?: string;
}

export const ProgressBar = ({
    current,
    total,
    label,
    showPercentage = true,
    className = '',
}: ProgressBarProps) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className={`w-full ${className}`}>
            {/* Label and Stats */}
            <div className="flex justify-between items-center mb-2">
                {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
                <span className="text-sm font-semibold text-gray-900">
                    {current} / {total}
                    {showPercentage && ` (${Math.round(percentage)}%)`}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                    }}
                />
            </div>
        </div>
    );
};

// Made with Bob
