import { useEffect, useRef, useState, useCallback } from 'react';
import './SwipeDeck.css';

const SWIPE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 0.55;
const FLY_OUT_DISTANCE = 1200;
const ROTATION_FACTOR = 0.08;

/**
 * Tinder-style swipeable deck of meal cards.
 *
 * Props:
 * - meals: array of meal objects (the FULL list)
 * - currentIndex: index of the meal that is currently the "top" card
 * - onVote(vote): called with 'yes' or 'no' once a swipe (or button) commits
 * - disabled: blocks interaction while a vote is in-flight
 */
export default function SwipeDeck({ meals, currentIndex, onVote, disabled = false }) {
    const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
    const [flyOut, setFlyOut] = useState(null); // 'yes' | 'no' | null
    const cardRef = useRef(null);
    const pointerStart = useRef(null);
    const pointerStartTime = useRef(0);

    const topMeal = meals[currentIndex];
    const peekMeals = meals.slice(currentIndex + 1, currentIndex + 3);

    const commitVote = useCallback(
        (vote) => {
            if (disabled || flyOut) return;
            setFlyOut(vote);
            // Let the fly-out animation play, then notify parent
            setTimeout(() => {
                onVote(vote);
                setFlyOut(null);
                setDrag({ x: 0, y: 0, dragging: false });
            }, 320);
        },
        [disabled, flyOut, onVote]
    );

    // Keyboard support: ← = no, → = yes
    useEffect(() => {
        const handleKey = (e) => {
            if (disabled || flyOut) return;
            if (e.key === 'ArrowRight') commitVote('yes');
            if (e.key === 'ArrowLeft') commitVote('no');
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [commitVote, disabled, flyOut]);

    const handlePointerDown = (e) => {
        if (disabled || flyOut) return;
        cardRef.current?.setPointerCapture(e.pointerId);
        pointerStart.current = { x: e.clientX, y: e.clientY };
        pointerStartTime.current = Date.now();
        setDrag({ x: 0, y: 0, dragging: true });
    };

    const handlePointerMove = (e) => {
        if (!drag.dragging || !pointerStart.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        setDrag({ x: dx, y: dy, dragging: true });
    };

    const handlePointerUp = (e) => {
        if (!drag.dragging) return;
        const dx = drag.x;
        const elapsed = Math.max(Date.now() - pointerStartTime.current, 1);
        const velocity = Math.abs(dx) / elapsed;

        cardRef.current?.releasePointerCapture?.(e.pointerId);

        const passedThreshold = Math.abs(dx) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;
        if (passedThreshold) {
            commitVote(dx > 0 ? 'yes' : 'no');
        } else {
            // Spring back
            setDrag({ x: 0, y: 0, dragging: false });
        }
        pointerStart.current = null;
    };

    if (!topMeal) {
        return null;
    }

    // Compute style for the top card
    const dragPct = Math.min(Math.max(drag.x / SWIPE_THRESHOLD, -1.5), 1.5);
    const rotation = drag.x * ROTATION_FACTOR;
    const yesOpacity = Math.max(0, Math.min(drag.x / SWIPE_THRESHOLD, 1));
    const noOpacity = Math.max(0, Math.min(-drag.x / SWIPE_THRESHOLD, 1));

    let topTransform;
    let topTransition;
    if (flyOut) {
        const dir = flyOut === 'yes' ? 1 : -1;
        topTransform = `translate(${dir * FLY_OUT_DISTANCE}px, ${drag.y - 80}px) rotate(${dir * 35}deg)`;
        topTransition = 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 320ms ease';
    } else if (drag.dragging) {
        topTransform = `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`;
        topTransition = 'none';
    } else {
        topTransform = 'translate(0, 0) rotate(0deg)';
        topTransition = 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    return (
        <div className="swipe-deck">
            {/* Background peek cards */}
            {peekMeals
                .slice()
                .reverse()
                .map((meal, idx) => {
                    const depth = peekMeals.length - idx; // 1 or 2
                    const scale = 1 - depth * 0.06;
                    const translateY = depth * 14;
                    return (
                        <div
                            key={meal.id}
                            className="swipe-card swipe-card--peek"
                            style={{
                                transform: `translateY(${translateY}px) scale(${scale})`,
                                zIndex: 1 + idx,
                            }}
                        >
                            <PeekCardContent meal={meal} />
                        </div>
                    );
                })}

            {/* Active top card */}
            <div
                ref={cardRef}
                className={`swipe-card swipe-card--top ${flyOut ? `is-flying-${flyOut}` : ''} ${drag.dragging ? 'is-dragging' : ''
                    }`}
                style={{
                    transform: topTransform,
                    transition: topTransition,
                    opacity: flyOut ? 0 : 1,
                    zIndex: 10,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="card-image-wrap">
                    <img
                        src={topMeal.imageUrl}
                        alt={topMeal.title}
                        className="card-image"
                        draggable={false}
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/600x800?text=Meal';
                        }}
                    />
                    <div className="card-image-shade" />

                    <div
                        className="stamp stamp-yes"
                        style={{ opacity: flyOut === 'yes' ? 1 : yesOpacity }}
                    >
                        YUM
                    </div>
                    <div
                        className="stamp stamp-no"
                        style={{ opacity: flyOut === 'no' ? 1 : noOpacity }}
                    >
                        NOPE
                    </div>

                    <div className="card-overlay-content">
                        <h3 className="card-title">{topMeal.title}</h3>
                        {topMeal.description && (
                            <p className="card-description">{topMeal.description}</p>
                        )}
                        {topMeal.ingredients?.length > 0 && (
                            <div className="card-ingredients">
                                {topMeal.ingredients.slice(0, 4).map((ing, i) => (
                                    <span key={i} className="ingredient-chip">
                                        {ing}
                                    </span>
                                ))}
                                {topMeal.ingredients.length > 4 && (
                                    <span className="ingredient-chip ingredient-chip--more">
                                        +{topMeal.ingredients.length - 4}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Drag direction glow on the deck */}
            <div
                className="deck-glow deck-glow-yes"
                style={{ opacity: yesOpacity * 0.7 }}
                aria-hidden
            />
            <div
                className="deck-glow deck-glow-no"
                style={{ opacity: noOpacity * 0.7 }}
                aria-hidden
            />
        </div>
    );
}

function PeekCardContent({ meal }) {
    return (
        <div className="card-image-wrap">
            <img
                src={meal.imageUrl}
                alt=""
                className="card-image"
                draggable={false}
                onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x800?text=Meal';
                }}
            />
            <div className="card-image-shade" />
            <div className="card-overlay-content card-overlay-content--peek">
                <h3 className="card-title">{meal.title}</h3>
            </div>
        </div>
    );
}

// Made with Bob
