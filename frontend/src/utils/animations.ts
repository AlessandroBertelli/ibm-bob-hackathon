// Framer Motion animation variants for Group Food Tinder

import type { Variants } from 'framer-motion';

/**
 * Card swipe animations
 */
export const swipeVariants: Variants = {
    initial: {
        scale: 0.95,
        opacity: 0,
        y: 50,
    },
    animate: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: (direction: 'left' | 'right') => ({
        x: direction === 'left' ? -300 : 300,
        opacity: 0,
        rotate: direction === 'left' ? -20 : 20,
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    }),
};

/**
 * Page transition animations
 */
export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: 'easeIn',
        },
    },
};

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.3,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Slide up animation
 */
export const slideUpVariants: Variants = {
    initial: {
        y: 50,
        opacity: 0,
    },
    animate: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

/**
 * Scale animation
 */
export const scaleVariants: Variants = {
    initial: {
        scale: 0.8,
        opacity: 0,
    },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        scale: 0.8,
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Bounce animation for success states
 */
export const bounceVariants: Variants = {
    initial: {
        scale: 0,
    },
    animate: {
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },
};

/**
 * Stagger children animation
 */
export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

/**
 * Stagger child item animation
 */
export const staggerItemVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
        },
    },
};

/**
 * Loading spinner animation
 */
export const spinnerVariants: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

/**
 * Pulse animation for loading states
 */
export const pulseVariants: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

/**
 * Shake animation for errors
 */
export const shakeVariants: Variants = {
    shake: {
        x: [-10, 10, -10, 10, 0],
        transition: {
            duration: 0.4,
        },
    },
};

/**
 * Modal overlay animation
 */
export const modalOverlayVariants: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.2,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Modal content animation
 */
export const modalContentVariants: Variants = {
    initial: {
        scale: 0.9,
        opacity: 0,
        y: 20,
    },
    animate: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        scale: 0.9,
        opacity: 0,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Progress bar animation
 */
export const progressBarVariants: Variants = {
    initial: {
        scaleX: 0,
    },
    animate: (progress: number) => ({
        scaleX: progress / 100,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    }),
};

/**
 * Confetti animation for winner screen
 */
export const confettiVariants: Variants = {
    initial: {
        y: -100,
        opacity: 0,
    },
    animate: {
        y: [0, 100, 200],
        opacity: [0, 1, 0],
        transition: {
            duration: 2,
            ease: 'easeOut',
        },
    },
};

// Made with Bob
