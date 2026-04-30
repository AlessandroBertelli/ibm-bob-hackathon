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

    return (
        <div className="host-setup">
            <div className="container">
                <h1>🍽️ Create Your Meal Party</h1>
                <p className="subtitle">Set the vibe and let's find the perfect meal together!</p>

                <form onSubmit={handleSubmit} className="setup-form">
                    <div className="form-group">
                        <label htmlFor="vibe">What's the vibe?</label>
                        <input
                            type="text"
                            id="vibe"
                            placeholder="e.g., Fancy Taco Tuesday, Cozy Comfort Food"
                            value={formData.vibe}
                            onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                            required
                        />
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
