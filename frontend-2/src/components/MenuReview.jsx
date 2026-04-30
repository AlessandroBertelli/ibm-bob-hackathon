import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import './MenuReview.css';

const POLL_INTERVAL_MS = 1500;

export default function MenuReview() {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const [party, setParty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const stopPoll = () => {
            if (pollRef.current) {
                clearTimeout(pollRef.current);
                pollRef.current = null;
            }
        };

        const tick = async () => {
            try {
                const response = await partyAPI.getParty(partyId);
                if (cancelled) return;
                setParty(response.party);
                setLoading(false);

                if (response.party.status === 'generating') {
                    pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
                }
            } catch (err) {
                if (cancelled) return;
                setError('Failed to load party');
                setLoading(false);
            }
        };

        tick();

        return () => {
            cancelled = true;
            stopPoll();
        };
    }, [partyId]);

    const shareLink =
        party?.shareLink ||
        (party?.shareToken
            ? `${window.location.origin}/vote/${party.shareToken}`
            : '');

    const copyVotingLink = () => {
        if (!shareLink) return;
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToVoting = () => {
        if (party?.shareToken) {
            navigate(`/vote/${party.shareToken}`);
        }
    };

    if (loading || party?.status === 'generating') {
        return (
            <div className="menu-review">
                <div className="container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Generating your perfect meals...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !party) {
        return (
            <div className="menu-review">
                <div className="container">
                    <div className="error-message">{error || 'Party not found'}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-review">
            <div className="container">
                <h1>Your Menu is Ready</h1>
                <p className="subtitle">Vibe: {party.vibe} • {party.headcount} people</p>

                <div className="meals-grid">
                    {party.meals.map((meal) => (
                        <div key={meal.id} className="meal-card">
                            {meal.imageUrl && (
                                <img src={meal.imageUrl} alt={meal.title} className="meal-image" />
                            )}
                            <div className="meal-content">
                                <h3>{meal.title}</h3>
                                <p className="meal-description">{meal.description}</p>
                                {meal.ingredients?.length > 0 && (
                                    <div className="ingredients">
                                        <h4>Ingredients:</h4>
                                        <ul>
                                            {meal.ingredients.map((ingredient, index) => (
                                                <li key={index}>{ingredient}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="actions">
                    <button onClick={copyVotingLink} className="btn-secondary" disabled={!shareLink}>
                        {copied ? '✓ Copied!' : 'Copy Voting Link'}
                    </button>
                    <button onClick={goToVoting} className="btn-primary" disabled={!party.shareToken}>
                        Start Voting →
                    </button>
                </div>

                {shareLink && (
                    <div className="share-info">
                        <p>Share this link with your guests:</p>
                        <code className="share-link">{shareLink}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
