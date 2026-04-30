import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import './GuestVoting.css';

export default function GuestVoting() {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const [party, setParty] = useState(null);
    const [currentMealIndex, setCurrentMealIndex] = useState(0);
    const [guestId, setGuestId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [voting, setVoting] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        loadPartyAndConnect();

        return () => {
            disconnectSocket();
        };
    }, [partyId]);

    const loadPartyAndConnect = async () => {
        try {
            const response = await partyAPI.getParty(partyId);
            setParty(response.party);

            // Connect to socket
            const socket = connectSocket();

            // Set a timeout in case socket doesn't connect
            const connectionTimeout = setTimeout(() => {
                console.log('Socket connection timeout, proceeding anyway');
                setLoading(false);
            }, 3000);

            socket.on('connect', () => {
                console.log('Connected to socket');
                socket.emit('join-party', { partyId });
            });

            socket.on('joined-party', ({ guestId: newGuestId, party: updatedParty }) => {
                clearTimeout(connectionTimeout);
                setGuestId(newGuestId);
                setParty(updatedParty);
                setLoading(false);
            });

            socket.on('vote-update', ({ meals }) => {
                setParty(prev => ({ ...prev, meals }));
            });

            socket.on('winner-found', ({ winner, winType }) => {
                navigate(`/winner/${partyId}`, { state: { winner, winType } });
            });

            socket.on('error', ({ message }) => {
                clearTimeout(connectionTimeout);
                setError(message);
                setLoading(false);
            });

            // If socket is already connected, emit join immediately
            if (socket.connected) {
                socket.emit('join-party', { partyId });
            }

        } catch (err) {
            console.error('Error loading party:', err);
            setError('Failed to load party');
            setLoading(false);
        }
    };

    const handleVote = async (vote) => {
        if (voting || !party || !guestId) return;

        setVoting(true);
        const currentMeal = party.meals[currentMealIndex];

        const socket = connectSocket();
        socket.emit('vote', {
            partyId,
            mealId: currentMeal.id,
            guestId,
            vote
        });

        // Move to next meal after a short delay
        setTimeout(() => {
            // Always increment, even past the last meal to trigger waiting screen
            setCurrentMealIndex(currentMealIndex + 1);
            setVoting(false);
        }, 500);
    };

    if (loading) {
        return (
            <div className="guest-voting">
                <div className="container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading party...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !party) {
        return (
            <div className="guest-voting">
                <div className="container">
                    <div className="error-message">{error || 'Party not found'}</div>
                </div>
            </div>
        );
    }

    // Calculate vote results
    const calculateResults = () => {
        if (!party) return [];

        return party.meals.map(meal => {
            const votes = meal.votes || {};
            const yesCount = Object.values(votes).filter(v => v === 'yes').length;
            const noCount = Object.values(votes).filter(v => v === 'no').length;
            const totalVotes = yesCount + noCount;

            return {
                ...meal,
                yesCount,
                noCount,
                totalVotes,
                percentage: totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0
            };
        }).sort((a, b) => b.yesCount - a.yesCount);
    };

    if (currentMealIndex >= party.meals.length) {
        if (showResults) {
            const results = calculateResults();

            return (
                <div className="guest-voting">
                    <div className="container">
                        <div className="results-view">
                            <h2>📊 Voting Results</h2>
                            <p className="subtitle">Here's how everyone voted</p>

                            <div className="results-grid">
                                {results.map((meal, index) => (
                                    <div key={meal.id} className={`result-card ${index === 0 ? 'top-choice' : ''}`}>
                                        {index === 0 && <div className="badge">🏆 Most Popular</div>}
                                        <img src={meal.imageUrl} alt={meal.title} className="result-image" />
                                        <div className="result-content">
                                            <h3>{meal.title}</h3>
                                            <div className="vote-stats">
                                                <div className="stat">
                                                    <span className="stat-label">👍 Yes</span>
                                                    <span className="stat-value">{meal.yesCount}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">👎 No</span>
                                                    <span className="stat-value">{meal.noCount}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">Approval</span>
                                                    <span className="stat-value">{meal.percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="btn-primary"
                            >
                                Create New Party
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="guest-voting">
                <div className="container">
                    <div className="waiting-message">
                        <h2>✓ All votes submitted!</h2>
                        <p>Waiting for other guests to finish voting...</p>
                        <div className="spinner"></div>
                        <button
                            onClick={() => setShowResults(true)}
                            className="btn-secondary"
                            style={{ marginTop: '2rem' }}
                        >
                            View Current Results
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentMeal = party.meals[currentMealIndex];

    // Safety check
    if (!currentMeal) {
        return (
            <div className="guest-voting">
                <div className="container">
                    <div className="error-message">
                        Error loading meal. Please refresh the page.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="guest-voting">
            <div className="container">
                <div className="voting-header">
                    <h2>Vote on Meals</h2>
                    <p className="progress">{currentMealIndex + 1} of {party.meals.length}</p>
                </div>

                <div className="meal-card-voting">
                    <img
                        src={currentMeal.imageUrl}
                        alt={currentMeal.title}
                        className="meal-image"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Meal+Image';
                        }}
                    />
                    <div className="meal-info">
                        <h3>{currentMeal.title}</h3>
                        <p className="meal-description">{currentMeal.description}</p>
                    </div>
                </div>

                <div className="voting-buttons">
                    <button
                        onClick={() => handleVote('no')}
                        className="btn-no"
                        disabled={voting}
                    >
                        👎 No
                    </button>
                    <button
                        onClick={() => handleVote('yes')}
                        className="btn-yes"
                        disabled={voting}
                    >
                        👍 Yes
                    </button>
                </div>

                <div className="swipe-hint">
                    <p>Swipe left for No, right for Yes</p>
                </div>
            </div>
        </div>
    );
}

// Made with Bob
