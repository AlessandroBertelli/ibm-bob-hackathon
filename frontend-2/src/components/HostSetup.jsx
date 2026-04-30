import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import './HostSetup.css';

export default function HostSetup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        vibe: '',
        headcount: 4,
        dietaryRestrictions: {
            vegan: false,
            glutenFree: false
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await partyAPI.createParty(formData);
            navigate(`/party/${response.partyId}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create party');
        } finally {
            setLoading(false);
        }
    };

    const VIBE_SUGGESTIONS = [
        'Pizza Friday',
        'Sushi Night',
        'Fancy Taco Tuesday',
        'Cozy Rainy Night',
        'Indian Feast',
        'Healthy Power Bowls',
        'BBQ Cookout',
        'Ramen Date Night',
    ];

    return (
        <div className="host-setup">
            <div className="container">
                <h1>What are we eating tonight?</h1>
                <p className="subtitle">Set the vibe and we'll plate up some options to swipe on.</p>

                <form onSubmit={handleSubmit} className="setup-form">
                    <div className="form-group">
                        <label htmlFor="vibe">What's the vibe?</label>
                        <input
                            type="text"
                            id="vibe"
                            placeholder="Try: pizza, sushi night, fancy taco tuesday…"
                            value={formData.vibe}
                            onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                            required
                        />
                        <div className="vibe-chips">
                            {VIBE_SUGGESTIONS.map((suggestion) => (
                                <button
                                    type="button"
                                    key={suggestion}
                                    className={`vibe-chip ${formData.vibe === suggestion ? 'is-active' : ''}`}
                                    onClick={() => setFormData({ ...formData, vibe: suggestion })}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="headcount">How many people?</label>
                        <input
                            type="number"
                            id="headcount"
                            min="2"
                            max="20"
                            value={formData.headcount}
                            onChange={(e) => setFormData({ ...formData, headcount: parseInt(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Dietary Restrictions</label>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.dietaryRestrictions.vegan}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        dietaryRestrictions: {
                                            ...formData.dietaryRestrictions,
                                            vegan: e.target.checked
                                        }
                                    })}
                                />
                                <span>Vegan</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.dietaryRestrictions.glutenFree}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        dietaryRestrictions: {
                                            ...formData.dietaryRestrictions,
                                            glutenFree: e.target.checked
                                        }
                                    })}
                                />
                                <span>Gluten-Free</span>
                            </label>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Generating Menu...' : 'Generate Menu'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Made with Bob
