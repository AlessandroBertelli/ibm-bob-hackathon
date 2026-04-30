// Swipe gesture hook for Tinder-style card interface

import { useState, useCallback } from 'react';
import type { PanInfo } from 'framer-motion';

export type SwipeDirection = 'left' | 'right' | null;

interface UseSwipeReturn {
    currentIndex: number;
    swipeDirection: SwipeDirection;
    handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
    swipeLeft: () => void;
    swipeRight: () => void;
    resetSwipe: () => void;
    canSwipe: boolean;
}

interface UseSwipeOptions {
    totalCards: number;
    onSwipeLeft?: (index: number) => void;
    onSwipeRight?: (index: number) => void;
    onComplete?: () => void;
    swipeThreshold?: number;
}

/**
 * Custom hook for managing swipe gestures on cards
 */
export const useSwipe = ({
    totalCards,
    onSwipeLeft,
    onSwipeRight,
    onComplete,
    swipeThreshold = 100,
}: UseSwipeOptions): UseSwipeReturn => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);

    const canSwipe = currentIndex < totalCards;

    /**
     * Swipe left (No)
     */
    const swipeLeft = useCallback(() => {
        if (!canSwipe) return;

        setSwipeDirection('left');

        // Call callback with current index
        if (onSwipeLeft) {
            onSwipeLeft(currentIndex);
        }

        // Move to next card after animation
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setSwipeDirection(null);

            // Check if all cards are swiped
            if (currentIndex + 1 >= totalCards && onComplete) {
                onComplete();
            }
        }, 300);
    }, [currentIndex, totalCards, canSwipe, onSwipeLeft, onComplete]);

    /**
     * Swipe right (Yes)
     */
    const swipeRight = useCallback(() => {
        if (!canSwipe) return;

        setSwipeDirection('right');

        // Call callback with current index
        if (onSwipeRight) {
            onSwipeRight(currentIndex);
        }

        // Move to next card after animation
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setSwipeDirection(null);

            // Check if all cards are swiped
            if (currentIndex + 1 >= totalCards && onComplete) {
                onComplete();
            }
        }, 300);
    }, [currentIndex, totalCards, canSwipe, onSwipeRight, onComplete]);

    /**
     * Handle drag end event from framer-motion
     */
    const handleDragEnd = useCallback(
        (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const swipe = info.offset.x;
            const velocity = info.velocity.x;

            // Determine if swipe is strong enough
            if (Math.abs(swipe) > swipeThreshold || Math.abs(velocity) > 500) {
                if (swipe > 0) {
                    // Swiped right
                    swipeRight();
                } else {
                    // Swiped left
                    swipeLeft();
                }
            }
        },
        [swipeThreshold, swipeLeft, swipeRight]
    );

    /**
     * Reset swipe state
     */
    const resetSwipe = useCallback(() => {
        setCurrentIndex(0);
        setSwipeDirection(null);
    }, []);

    return {
        currentIndex,
        swipeDirection,
        handleDragEnd,
        swipeLeft,
        swipeRight,
        resetSwipe,
        canSwipe,
    };
};

// Made with Bob
