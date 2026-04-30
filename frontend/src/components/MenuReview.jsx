import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import './MenuReview.css';

export default function MenuReview() {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const [party, setParty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadParty();
    }, [partyId]);

    const loadParty = async () => {
        try {
            const response = await partyAPI.getParty(partyId);
            setParty(response.party);
        } catch (err) {
            setError('Failed to load party');
        } finally {
            setLoading(false);
        }
    };

    const copyVotingLink = () => {
        const link = `${window.location.origin}/vote/${partyId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToVoting = () => {
        navigate(`/vote/${partyId}`);
    };

    if (loading) {
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
                <h1>🎉 Your Menu is Ready!</h1>
                <p className="subtitle">Vibe: {party.vibe} • {party.headcount} people</p>

                <div className="meals-grid">
                    {party.meals.map((meal) => (
                        <div key={meal.id} className="meal-card">
                            <img src={meal.imageUrl} alt={meal.title} className="meal-image" />
                            <div className="meal-content">
                                <h3>{meal.title}</h3>
                                <p className="meal-description">{meal.description}</p>
                                <div className="ingredients">
                                    <h4>Ingredients:</h4>
                                    <ul>
                                        {meal.ingredients.map((ingredient, index) => (
                                            <li key={index}>{ingredient}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="actions">
                    <button onClick={copyVotingLink} className="btn-secondary">
                        {copied ? '✓ Copied!' : '📋 Copy Voting Link'}
                    </button>
                    <button onClick={goToVoting} className="btn-primary">
                        Start Voting →
                    </button>
                </div>

                <div className="share-info">
                    <p>Share this link with your guests:</p>
                    <code className="share-link">{window.location.origin}/vote/{partyId}</code>
                </div>
            </div>
        </div>
    );
}

// Made with Bob
