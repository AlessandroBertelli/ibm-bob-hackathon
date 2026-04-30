// Helper utility functions for Group Food Tinder

import type { Ingredient } from '../types';

/**
 * Format ingredients list with scaled quantities
 */
export const formatIngredients = (
    ingredients: Ingredient[],
    headcount: number
): Ingredient[] => {
    return ingredients.map(ingredient => ({
        ...ingredient,
        quantity: roundToNearestFraction(ingredient.quantity * headcount)
    }));
};

/**
 * Round to nearest 1/4 for better recipe readability
 * e.g., 1.3 cups -> 1.25 cups
 */
const roundToNearestFraction = (value: number): number => {
    return Math.round(value * 4) / 4;
};

/**
 * Generate a unique guest ID
 */
export const generateGuestId = (): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            textArea.remove();
            return successful;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Format ingredient for display
 * e.g., { name: "chicken", quantity: 2.5, unit: "lbs" } -> "2.5 lbs chicken"
 */
export const formatIngredientDisplay = (ingredient: Ingredient): string => {
    const quantity = ingredient.quantity % 1 === 0
        ? ingredient.quantity.toString()
        : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '');

    return `${quantity} ${ingredient.unit} ${ingredient.name}`;
};

/**
 * Debounce function to limit API calls
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Format time remaining
 */
export const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
};

/**
 * Get share URL for session
 */
export const getShareUrl = (token: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/vote/${token}`;
};

/**
 * Check if running on mobile device
 */
export const isMobile = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Made with Bob
