import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { partyAPI, recipeAPI } from '../services/api';
import './WinnerScreen.css';

const normalizeWinnerFromState = (raw) => {
    if (!raw) return null;
    if (raw.title || raw.imageUrl) return raw;
    if (raw.meal) {
        const m = raw.meal;
        const rawIngredients = Array.isArray(m.ingredients)
            ? m.ingredients.map((ing) =>
                  typeof ing === 'string'
                      ? { name: ing, quantity: 1, unit: 'whole' }
                      : {
                            name: ing.name,
                            quantity: ing.quantity ?? ing.base_quantity ?? 1,
                            unit: ing.unit || 'whole',
                        }
              )
            : [];
        return {
            id: raw.winner_id || raw.meal_id || m.id,
            title: m.title,
            description: m.description,
            imageUrl: m.image_url || m.imageUrl,
            ingredients: rawIngredients.map((i) =>
                `${i.quantity} ${i.unit !== 'whole' ? i.unit + ' ' : ''}${i.name}`.trim()
            ),
            rawIngredients,
            yesCount: raw.yes_votes ?? 0,
            percentage: raw.vote_percentage ? Math.round(raw.vote_percentage) : 0,
        };
    }
    return raw;
};

const formatDifficulty = (d) =>
    ({ easy: 'Easy', medium: 'Medium', hard: 'Hard' }[d] || d);

export default function WinnerScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { partyId } = useParams();

    const winnerFromState = useMemo(
        () => normalizeWinnerFromState(location.state?.winner),
        [location.state?.winner]
    );
    const winType = location.state?.winType || 'unanimous';

    const [party, setParty] = useState(null);
    const [recipe, setRecipe] = useState(null);
    const [recipeLoading, setRecipeLoading] = useState(false);
    const [recipeError, setRecipeError] = useState('');

    useEffect(() => {
        if (!partyId) return;
        partyAPI
            .getParty(partyId)
            .then((res) => setParty(res.party))
            .catch(() => {
                /* ignore: still have winnerFromState */
            });
    }, [partyId]);

    const { winner, leaderboard } = useMemo(() => {
        if (!party && !winnerFromState) return { winner: null, leaderboard: [] };

        const meals = party?.meals ?? (winnerFromState ? [winnerFromState] : []);
        const ranked = meals
            .map((meal) => {
                const yesCount = meal.yesCount ?? 0;
                const noCount = meal.noCount ?? 0;
                const total = yesCount + noCount;
                return {
                    ...meal,
                    yesCount,
                    noCount,
                    percentage:
                        total > 0
                            ? Math.round((yesCount / total) * 100)
                            : meal.percentage ?? 0,
                };
            })
            .sort((a, b) => b.yesCount - a.yesCount || b.percentage - a.percentage);

        const top =
            ranked.find((m) => m.id === winnerFromState?.id) ??
            ranked[0] ??
            winnerFromState ??
            null;
        const rest = ranked.filter((m) => m.id !== top?.id);
        return { winner: top, leaderboard: rest };
    }, [party, winnerFromState]);

    if (!winner) {
        return (
            <div className="winner-screen">
                <div className="container winner-container">
                    <div className="error-message">No winner data found</div>
                </div>
            </div>
        );
    }

    const winnerHeadline =
        winType === 'unanimous' ? 'Unanimous winner' : 'Most popular pick';

    const headcount = party?.headcount;

    const handleGenerateRecipe = async () => {
        if (recipeLoading) return;
        setRecipeError('');
        setRecipeLoading(true);
        try {
            const ingredients =
                winner.rawIngredients && winner.rawIngredients.length > 0
                    ? winner.rawIngredients
                    : winner.ingredients;
            const result = await recipeAPI.generateRecipe({
                title: winner.title,
                description: winner.description,
                headcount: headcount || 4,
                ingredients,
            });
            setRecipe(result);
        } catch (err) {
            console.error('Recipe generation failed:', err);
            setRecipeError(
                err?.response?.data?.error ||
                    'Could not generate the recipe. Try again.'
            );
        } finally {
            setRecipeLoading(false);
        }
    };

    return (
        <div className="winner-screen">
            <div className="container winner-container">
                <header className="winner-headline">
                    <p className="winner-eyebrow">Tonight's choice</p>
                    <h1 className="winner-title">{winnerHeadline}</h1>
                </header>

                <article className="winner-card-apple">
                    <div className="winner-card-media">
                        {winner.imageUrl && (
                            <img
                                src={winner.imageUrl}
                                alt={winner.title}
                                className="winner-card-image"
                            />
                        )}
                        <span className="winner-card-tag">Winner</span>
                    </div>

                    <div className="winner-card-body">
                        <h2 className="winner-card-name">{winner.title}</h2>
                        {winner.description && (
                            <p className="winner-card-description">{winner.description}</p>
                        )}

                        {typeof winner.percentage === 'number' && (
                            <div className="winner-card-stats">
                                <div className="winner-card-stat">
                                    <span className="winner-card-stat-value">
                                        {winner.percentage}
                                        <span className="winner-card-stat-unit">%</span>
                                    </span>
                                    <span className="winner-card-stat-label">Approval</span>
                                </div>
                                <div className="winner-card-divider" />
                                <div className="winner-card-stat">
                                    <span className="winner-card-stat-value">{winner.yesCount}</span>
                                    <span className="winner-card-stat-label">Yes votes</span>
                                </div>
                            </div>
                        )}

                        {winner.ingredients?.length > 0 && (
                            <section className="winner-card-ingredients">
                                <p className="winner-card-section-label">Ingredients</p>
                                <ul className="ingredients-chips">
                                    {winner.ingredients.map((ing, i) => (
                                        <li key={i}>{ing}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </article>

                <section className={`recipe-panel ${recipe ? 'is-loaded' : ''}`}>
                    {!recipe && !recipeLoading && (
                        <div className="recipe-cta">
                            <div className="recipe-cta-text">
                                <p className="recipe-cta-eyebrow">AI Chef</p>
                                <h3 className="recipe-cta-title">Get the full recipe</h3>
                                <p className="recipe-cta-sub">
                                    Step-by-step instructions, timing and tips, generated for{' '}
                                    {headcount || 4} people.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-primary recipe-cta-btn"
                                onClick={handleGenerateRecipe}
                            >
                                Generate
                            </button>
                        </div>
                    )}

                    {recipeLoading && (
                        <div className="recipe-loading">
                            <div className="recipe-skeleton-pills">
                                <span />
                                <span />
                                <span />
                                <span />
                            </div>
                            <div className="recipe-skeleton-line short" />
                            <div className="recipe-skeleton-line" />
                            <div className="recipe-skeleton-line medium" />
                            <p className="recipe-loading-text">Cooking up your recipe…</p>
                        </div>
                    )}

                    {recipeError && !recipeLoading && (
                        <div className="recipe-error">
                            <p>{recipeError}</p>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleGenerateRecipe}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {recipe && (
                        <div className="recipe-content">
                            <header className="recipe-header">
                                <p className="recipe-eyebrow">Recipe</p>
                                <h3 className="recipe-title">{recipe.meal_title}</h3>
                                {recipe.summary && (
                                    <p className="recipe-summary">{recipe.summary}</p>
                                )}
                            </header>

                            <div className="recipe-meta">
                                <div className="recipe-meta-pill">
                                    <span className="recipe-meta-value">
                                        {recipe.prep_time_minutes}
                                        <span className="recipe-meta-unit">m</span>
                                    </span>
                                    <span className="recipe-meta-label">Prep</span>
                                </div>
                                <div className="recipe-meta-pill">
                                    <span className="recipe-meta-value">
                                        {recipe.cook_time_minutes}
                                        <span className="recipe-meta-unit">m</span>
                                    </span>
                                    <span className="recipe-meta-label">Cook</span>
                                </div>
                                <div className="recipe-meta-pill">
                                    <span className="recipe-meta-value">
                                        {recipe.total_time_minutes}
                                        <span className="recipe-meta-unit">m</span>
                                    </span>
                                    <span className="recipe-meta-label">Total</span>
                                </div>
                                <div className="recipe-meta-pill">
                                    <span className="recipe-meta-value">{recipe.servings}</span>
                                    <span className="recipe-meta-label">Serves</span>
                                </div>
                                <div className="recipe-meta-pill recipe-meta-pill--difficulty">
                                    <span className="recipe-meta-value-text">
                                        {formatDifficulty(recipe.difficulty)}
                                    </span>
                                    <span className="recipe-meta-label">Level</span>
                                </div>
                            </div>

                            {recipe.ingredients?.length > 0 && (
                                <section className="recipe-section">
                                    <h4 className="recipe-section-title">Ingredients</h4>
                                    <ul className="recipe-ingredients">
                                        {recipe.ingredients.map((ing, i) => (
                                            <li key={i} className="recipe-ingredient">
                                                <span className="recipe-ingredient-qty">
                                                    {ing.quantity}
                                                    {ing.unit !== 'whole' && (
                                                        <span className="recipe-ingredient-unit">
                                                            {' '}
                                                            {ing.unit}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="recipe-ingredient-name">
                                                    {ing.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {recipe.instructions?.length > 0 && (
                                <section className="recipe-section">
                                    <h4 className="recipe-section-title">Instructions</h4>
                                    <ol className="recipe-steps">
                                        {recipe.instructions.map((step) => (
                                            <li key={step.step} className="recipe-step">
                                                <div className="recipe-step-num">{step.step}</div>
                                                <div className="recipe-step-body">
                                                    <h5 className="recipe-step-title">
                                                        {step.title}
                                                    </h5>
                                                    <p className="recipe-step-text">{step.text}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            {recipe.tips?.length > 0 && (
                                <section className="recipe-section recipe-tips-section">
                                    <h4 className="recipe-section-title">Tips</h4>
                                    <ul className="recipe-tips">
                                        {recipe.tips.map((tip, i) => (
                                            <li key={i}>{tip}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>
                    )}
                </section>

                {leaderboard.length > 0 && (
                    <section className="winner-leaderboard">
                        <header className="winner-leaderboard-header">
                            <span className="winner-leaderboard-eyebrow">Leaderboard</span>
                            <span className="winner-leaderboard-eyebrow winner-leaderboard-eyebrow--right">
                                Approval
                            </span>
                        </header>
                        <ol className="winner-leaderboard-list">
                            {leaderboard.map((meal, index) => (
                                <li key={meal.id} className="winner-leaderboard-row">
                                    <span className="winner-leaderboard-rank">{index + 2}</span>
                                    {meal.imageUrl && (
                                        <img
                                            src={meal.imageUrl}
                                            alt=""
                                            className="winner-leaderboard-image"
                                        />
                                    )}
                                    <div className="winner-leaderboard-info">
                                        <span className="winner-leaderboard-title">{meal.title}</span>
                                        <div className="winner-leaderboard-bar">
                                            <div
                                                className="winner-leaderboard-bar-fill"
                                                style={{ width: `${meal.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="winner-leaderboard-pct">
                                        {meal.percentage}
                                        <span className="winner-leaderboard-pct-unit">%</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                <div className="winner-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-primary"
                    >
                        New Party
                    </button>
                </div>
            </div>
        </div>
    );
}
