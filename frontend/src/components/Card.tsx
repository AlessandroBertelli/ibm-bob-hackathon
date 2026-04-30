// Reusable Card component for layouts

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
}: CardProps) => {
    const baseStyles = 'bg-white rounded-2xl shadow-lg';
    const hoverStyles = hover ? 'transition-transform hover:scale-105' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        >
            {children}
        </motion.div>
    );
};

// Made with Bob
