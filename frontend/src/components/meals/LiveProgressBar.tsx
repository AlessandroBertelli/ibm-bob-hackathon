// Per-meal vote bar with animated yes / no fills and counters.

import { motion } from 'framer-motion';

interface Props {
    yes: number;
    no: number;
}

export const LiveProgressBar = ({ yes, no }: Props) => {
    const total = yes + no;
    const yesPct = total > 0 ? (yes / total) * 100 : 0;
    const noPct = total > 0 ? (no / total) * 100 : 0;

    return (
        <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600">{yes} 👍</span>
                <span className="text-red-500">{no} 👎</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${yesPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${noPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

// Made with Bob
