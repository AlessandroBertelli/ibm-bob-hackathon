// Reusable Input component with validation

import { motion } from 'framer-motion';

interface InputProps {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    name?: string;
    id?: string;
    autoComplete?: string;
    min?: number;
    max?: number;
}

export const Input = ({
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    type = 'text',
    ...props
}: InputProps) => {
    const baseStyles = 'px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';
    const errorStyles = error ? 'border-red-500' : 'border-gray-300';
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <div className={`${widthStyle} ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <input
                type={type}
                className={`${baseStyles} ${errorStyles} ${widthStyle}`}
                {...props}
            />
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600"
                >
                    {error}
                </motion.p>
            )}
            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

// Made with Bob
