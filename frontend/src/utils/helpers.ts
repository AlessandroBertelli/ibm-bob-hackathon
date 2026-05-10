// Shared client utilities.

import type { Ingredient } from '../types';

export const formatIngredientDisplay = (ingredient: Ingredient): string => {
    const qty =
        ingredient.quantity % 1 === 0
            ? ingredient.quantity.toString()
            : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '');
    return `${qty} ${ingredient.unit} ${ingredient.name}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch {
        return false;
    }
};

export const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getShareUrl = (token: string): string =>
    `${window.location.origin}/vote/${token}`;

export const getResultsUrl = (token: string): string =>
    `${window.location.origin}/results/${token}`;

export const debounce = <T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let h: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (h) clearTimeout(h);
        h = setTimeout(() => fn(...args), wait);
    };
};

// Made with Bob
