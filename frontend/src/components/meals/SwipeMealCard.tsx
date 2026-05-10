// Tall, image-led meal card used inside the swipe stack on the voting screen.
// Image area is square — same as everywhere else — so the AI output isn't
// cropped differently in different parts of the UI.

import type { SessionMeal } from '../../types';

interface Props {
    meal: SessionMeal;
}

export const SwipeMealCard = ({ meal }: Props) => {
    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col select-none">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100 flex-shrink-0">
                {meal.image_url ? (
                    <img
                        src={meal.image_url}
                        alt={meal.title}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full grid place-items-center text-gray-400 text-6xl">
                        🍽️
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg">
                        {meal.title}
                    </h3>
                </div>
            </div>
            <div className="p-5 flex-1 overflow-hidden">
                <p className="text-gray-700 leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {meal.description}
                </p>
            </div>
        </div>
    );
};

// Made with Bob
