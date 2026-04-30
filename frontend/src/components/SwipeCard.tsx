// Swipeable card wrapper with Tinder-style animations

import type { ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

interface SwipeCardProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    className?: string;
}

export const SwipeCard = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    onDragEnd,
    className = '',
}: SwipeCardProps) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Only use the onDragEnd prop if provided, otherwise handle locally
        if (onDragEnd) {
            onDragEnd(event, info);
        } else {
            // Fallback to local handling if no onDragEnd prop
            const swipeThreshold = 100;
            const swipe = info.offset.x;
            const velocity = info.velocity.x;

            if (Math.abs(swipe) > swipeThreshold || Math.abs(velocity) > 500) {
                if (swipe > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
            }
        }
    };

    return (
        <motion.div
            className={`absolute inset-0 cursor-grab active:cursor-grabbing ${className}`}
            style={{
                x,
                rotate,
                opacity,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
        >
            {/* Swipe Indicators */}
            <motion.div
                className="absolute top-8 left-8 z-10 bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg"
                style={{
                    opacity: useTransform(x, [0, 100], [0, 1]),
                    rotate: -20,
                }}
            >
                YES
            </motion.div>
            <motion.div
                className="absolute top-8 right-8 z-10 bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-lg"
                style={{
                    opacity: useTransform(x, [-100, 0], [1, 0]),
                    rotate: 20,
                }}
            >
                NO
            </motion.div>

            {/* Card Content */}
            <div className="w-full h-full">{children}</div>
        </motion.div>
    );
};

// Made with Bob
