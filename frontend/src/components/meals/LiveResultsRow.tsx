// One row in the live ranking on /results/:token. Animates position changes,
// shows the live progress bar, exposes the heart-save button. Clicking the
// row surface (anywhere except the heart) opens the detail modal.

import { motion } from 'framer-motion';
import type { SessionMeal } from '../../types';
import { LiveProgressBar } from './LiveProgressBar';
import { HeartSaveButton } from './HeartSaveButton';
import { t } from '../../i18n/en';

interface Props {
    meal: SessionMeal;
    rank: number;
    onClick?: () => void;
    savedTitles?: Map<string, string>;
    onSaveChange?: () => void;
}

export const LiveResultsRow = ({ meal, rank, onClick, savedTitles, onSaveChange }: Props) => {
    return (
        <motion.button
            layout
            type="button"
            onClick={onClick}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden flex w-full text-left hover:shadow-xl transition-shadow"
        >
            <div className="w-28 aspect-square flex-shrink-0 bg-gray-100 relative">
                {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full grid place-items-center text-gray-400 text-3xl">
                        🍽️
                    </div>
                )}
                <span className="absolute bottom-1 right-1 bg-white/95 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {t.results.rank(rank)}
                </span>
                <div className="absolute top-1 left-1">
                    <HeartSaveButton
                        meal={meal}
                        compact
                        savedTitles={savedTitles}
                        onChange={onSaveChange}
                    />
                </div>
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{meal.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{meal.description}</p>
                </div>
                <div className="mt-3">
                    <LiveProgressBar yes={meal.yes_count} no={meal.no_count} />
                </div>
            </div>
        </motion.button>
    );
};

// Made with Bob
