import { useLocation, useParams } from 'react-router-dom';
import './WinnerScreen.css';

export default function WinnerScreen() {
    const location = useLocation();
    const { partyId } = useParams();
    const winner = location.state?.winner;
    const winType = location.state?.winType || 'unanimous';

    if (!winner) {
        return (
            <div className="winner-screen">
                <div className="container">
                    <div className="error-message">No winner data found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="winner-screen">
            <div className="container">
                <div className="celebration">
                    <h1>🎉 We Have a Winner! 🎉</h1>
                    <p className="subtitle">
                        {winType === 'unanimous' ? 'Everyone voted YES!' : 'Most popular choice!'}
                    </p>
                </div>

                <div className="winner-card">
                    <img src={winner.imageUrl} alt={winner.title} className="winner-image" />
                    <div className="winner-content">
                        <h2>{winner.title}</h2>
                        <p className="winner-description">{winner.description}</p>

                        <div className="ingredients-section">
                            <h3>📝 Ingredients</h3>
                            <ul className="ingredients-list">
                                {winner.ingredients.map((ingredient, index) => (
                                    <li key={index}>{ingredient}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="actions">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="btn-primary"
                            >
                                Create Another Party
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Made with Bob
