import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import { subscribeToParty } from '../services/socket';
import SwipeDeck from './SwipeDeck';
import './GuestVoting.css';

const guestKey = (sessionId) => `bytematch.guestId.${sessionId}`;

export default function GuestVoting() {
    const { partyId: shareToken } = useParams();
    const navigate = useNavigate();
    const [party, setParty] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [currentMealIndex, setCurrentMealIndex] = useState(0);
    const [guestId, setGuestId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [voting, setVoting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [lastVote, setLastVote] = useState(null);
    const burstTimer = useRef(null);
    const navigatedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        let unsubscribe = null;

        (async () => {
            try {
                const initial = await partyAPI.getPartyByShareToken(shareToken);
                if (cancelled) return;
                const sId = initial.party.id;
                setSessionId(sId);
                setParty(initial.party);

                let storedGuestId = null;
                try {
                    storedGuestId = localStorage.getItem(guestKey(sId));
                } catch {
                    /* ignore */
                }

                if (storedGuestId) {
                    setGuestId(storedGuestId);
                } else {
                    const join = await partyAPI.joinAsGuest(sId, 'Guest');
                    if (cancelled) return;
                    try {
                        localStorage.setItem(guestKey(sId), join.guestId);
                    } catch {
                        /* ignore */
                    }
                    setGuestId(join.guestId);
                }

                setLoading(false);

                unsubscribe = subscribeToParty(
                    sId,
                    (status) => {
                        setParty((prev) => {
                            if (!prev) return prev;
                            const mealStats = status.meal_stats || {};
                            const updatedMeals = prev.meals.map((meal) => {
                                const stats = mealStats[meal.id];
                                if (!stats) return meal;
                                return {
                                    ...meal,
                                    votes: { ...stats.voters },
                                    yesCount: stats.yes_votes,
                                    noCount: stats.no_votes,
                                    totalVotes: stats.total_votes,
                                };
                            });
                            return {
                                ...prev,
                                status: status.winner ? 'completed' : prev.status,
                                meals: updatedMeals,
                                progress: status.progress,
                                winner: status.winner,
                                guests: status.guests || prev.guests,
                            };
                        });

                        if (status.winner && !navigatedRef.current) {
                            navigatedRef.current = true;
                            navigate(`/winner/${sId}`, {
                                state: {
                                    winner: status.winner,
                                    winType: 'unanimous',
                                },
                            });
                        }
                    },
                    (err) => {
                        console.error('Polling error:', err);
                    }
                );
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to load voting session:', err);
                setError(
                    err?.response?.data?.error ||
                        'Could not load this voting session'
                );
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            if (unsubscribe) unsubscribe();
            if (burstTimer.current) clearTimeout(burstTimer.current);
        };
    }, [shareToken, navigate]);

    const handleVote = async (vote) => {
        if (voting || !party || !guestId || !sessionId) return;
        const currentMeal = party.meals[currentMealIndex];
        if (!currentMeal) return;

        setVoting(true);
        setLastVote(vote);

        try {
            await partyAPI.submitVote({
                sessionId,
                guestId,
                mealId: currentMeal.id,
                vote,
            });
        } catch (err) {
            console.error('Vote submit failed:', err);
        }

        setCurrentMealIndex((prev) => prev + 1);
        setTimeout(() => setVoting(false), 250);

        if (burstTimer.current) clearTimeout(burstTimer.current);
        burstTimer.current = setTimeout(() => setLastVote(null), 600);
    };

    const results = useMemo(() => {
        if (!party) return [];
        return party.meals
            .map((meal) => {
                const yesCount = meal.yesCount ?? 0;
                const noCount = meal.noCount ?? 0;
                const totalVotes = yesCount + noCount;
                return {
                    ...meal,
                    yesCount,
                    noCount,
                    totalVotes,
                    percentage:
                        totalVotes > 0
                            ? Math.round((yesCount / totalVotes) * 100)
                            : 0,
                };
            })
            .sort((a, b) => b.yesCount - a.yesCount);
    }, [party]);

    if (loading) {
        return (
            <div className="guest-voting">
                <div className="container voting-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Warming up the kitchen…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !party) {
        return (
            <div className="guest-voting">
                <div className="container voting-container">
                    <div className="error-message">{error || 'Party not found'}</div>
                </div>
            </div>
        );
    }

    if (currentMealIndex >= party.meals.length) {
        if (showResults) {
            const [topPick, ...runnersUp] = results;

            return (
                <div className="guest-voting">
                    <div className="container voting-container results-container">
                        <section className="results-view">
                            <p className="results-eyebrow">Final picks</p>
                            <h2 className="results-title">The table has spoken</h2>

                            {topPick && (
                                <article className="winner-hero">
                                    <div className="winner-hero-media">
                                        <img
                                            src={topPick.imageUrl}
                                            alt={topPick.title}
                                            className="winner-hero-image"
                                        />
                                        <span className="winner-tag">Top Pick</span>
                                    </div>
                                    <div className="winner-hero-body">
                                        <h3 className="winner-hero-title">{topPick.title}</h3>
                                        {topPick.description && (
                                            <p className="winner-hero-description">{topPick.description}</p>
                                        )}
                                        <div className="winner-hero-stats">
                                            <div className="winner-hero-stat">
                                                <span className="winner-hero-stat-value">
                                                    {topPick.percentage}
                                                    <span className="winner-hero-stat-unit">%</span>
                                                </span>
                                                <span className="winner-hero-stat-label">Approval</span>
                                            </div>
                                            <div className="winner-hero-divider" />
                                            <div className="winner-hero-stat">
                                                <span className="winner-hero-stat-value">{topPick.yesCount}</span>
                                                <span className="winner-hero-stat-label">Yes votes</span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )}

                            {runnersUp.length > 0 && (
                                <section className="leaderboard">
                                    <header className="leaderboard-header">
                                        <span className="leaderboard-eyebrow">Leaderboard</span>
                                        <span className="leaderboard-eyebrow leaderboard-eyebrow--right">
                                            Approval
                                        </span>
                                    </header>
                                    <ol className="leaderboard-list">
                                        {runnersUp.map((meal, index) => (
                                            <li key={meal.id} className="leaderboard-row">
                                                <span className="leaderboard-rank">{index + 2}</span>
                                                <img
                                                    src={meal.imageUrl}
                                                    alt=""
                                                    className="leaderboard-image"
                                                />
                                                <div className="leaderboard-info">
                                                    <span className="leaderboard-title">{meal.title}</span>
                                                    <div className="leaderboard-bar">
                                                        <div
                                                            className="leaderboard-bar-fill"
                                                            style={{ width: `${meal.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="leaderboard-pct">
                                                    {meal.percentage}
                                                    <span className="leaderboard-pct-unit">%</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            <button
                                onClick={() => (window.location.href = '/')}
                                className="btn-primary results-cta"
                            >
                                New Party
                            </button>
                        </section>
                    </div>
                </div>
            );
        }

        return (
            <div className="guest-voting">
                <div className="container voting-container">
                    <div className="waiting-message">
                        <div className="checkmark-circle">✓</div>
                        <h2>All your votes are in!</h2>
                        <p>Waiting for the rest of the table to finish swiping…</p>
                        <div className="spinner"></div>
                        <button
                            onClick={() => setShowResults(true)}
                            className="btn-secondary"
                            style={{ marginTop: '2rem' }}
                        >
                            Peek at live results
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const total = party.meals.length;
    const remaining = total - currentMealIndex;

    return (
        <div className="guest-voting">
            <div className={`vote-burst vote-burst--${lastVote || 'idle'}`} aria-hidden />

            <div className="container voting-container">
                <header className="voting-header">
                    {party.vibe && (
                        <span className="vibe-pill">{party.vibe}</span>
                    )}
                    <h2>Swipe to decide</h2>
                    <p className="progress-text">
                        <strong>{currentMealIndex + 1}</strong>
                        <span className="progress-divider">/</span>
                        <span>{total}</span>
                    </p>
                    <div className="progress-dots">
                        {party.meals.map((_, i) => {
                            const state =
                                i < currentMealIndex
                                    ? 'done'
                                    : i === currentMealIndex
                                    ? 'active'
                                    : 'todo';
                            return <span key={i} className={`progress-dot ${state}`} />;
                        })}
                    </div>
                </header>

                <SwipeDeck
                    meals={party.meals}
                    currentIndex={currentMealIndex}
                    onVote={handleVote}
                    disabled={voting}
                />

                <div className="voting-actions">
                    <button
                        type="button"
                        className="action-btn action-btn--no"
                        onClick={() => handleVote('no')}
                        disabled={voting}
                        aria-label="Pass on this meal"
                    >
                        ✕
                    </button>
                    <button
                        type="button"
                        className="action-btn action-btn--info"
                        onClick={() => setShowResults(true)}
                        aria-label="Peek at live results"
                        title="Peek at live results"
                    >
                        ⌁
                    </button>
                    <button
                        type="button"
                        className="action-btn action-btn--yes"
                        onClick={() => handleVote('yes')}
                        disabled={voting}
                        aria-label="Like this meal"
                    >
                        ♥
                    </button>
                </div>

                <p className="swipe-hint">
                    Swipe <span className="hint-arrow hint-arrow--left">←</span> to pass,{' '}
                    <span className="hint-arrow hint-arrow--right">→</span> to like
                    <span className="hint-keys">  ·  arrow keys work too</span>
                </p>

                <div className="remaining-banner">
                    {remaining === 1 ? 'Last meal!' : `${remaining} meals to go`}
                </div>
            </div>
        </div>
    );
}
