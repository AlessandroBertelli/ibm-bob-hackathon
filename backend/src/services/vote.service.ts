/**
 * Vote Service
 * Handles voting logic and winner determination
 */

import { VoteType, VotingProgress, WinnerResult, Meal } from '../types/session.types';
import { ValidationError, NotFoundError } from '../utils/errors.util';
import { firebaseService } from './service-factory';

/**
 * Vote Service class
 */
class VoteService {
    /**
     * Record a vote
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @param mealId - Meal ID
     * @param voteType - Vote type (yes/no)
     */
    async recordVote(
        sessionId: string,
        guestId: string,
        mealId: string,
        voteType: VoteType
    ): Promise<void> {
        // Verify session exists
        const session = await firebaseService.getSession(sessionId);

        // Verify meal exists in session
        const meals = await firebaseService.getSessionMeals(sessionId);
        const mealExists = meals.some((meal) => meal.id === mealId);
        if (!mealExists) {
            throw new NotFoundError('Meal not found in session');
        }

        // Ensure guest is added to session (if not already)
        const guests = await firebaseService.getSessionGuests(sessionId);
        const guestExists = guests.some((guest) => guest.id === guestId);
        if (!guestExists) {
            await firebaseService.addGuestToSession(sessionId, guestId);
        }

        // Record the vote
        await firebaseService.recordVote(sessionId, guestId, mealId, voteType);

        // Check if guest has voted on all meals
        const guestVotes = await firebaseService.getGuestVotes(sessionId, guestId);
        const hasVotedOnAll = meals.every((meal) => guestVotes[meal.id] !== undefined);

        if (hasVotedOnAll) {
            await firebaseService.updateGuestVotingStatus(sessionId, guestId, true);
        }

        // Check if winner can be determined
        await this.checkAndUpdateWinner(sessionId);
    }

    /**
     * Calculate voting progress
     * @param sessionId - Session ID
     * @returns Voting progress
     */
    async calculateProgress(sessionId: string): Promise<VotingProgress> {
        const guests = await firebaseService.getSessionGuests(sessionId);
        const totalGuests = guests.length;
        const guestsCompleted = guests.filter((guest) => guest.has_voted).length;

        const progress: VotingProgress = {
            total_guests: totalGuests,
            guests_completed: guestsCompleted,
            progress_percentage: totalGuests > 0 ? (guestsCompleted / totalGuests) * 100 : 0,
        };

        // Check if winner exists
        const winner = await this.determineWinner(sessionId);
        if (winner) {
            progress.winner_id = winner.winner_id;
        }

        return progress;
    }

    /**
     * Determine winner based on votes
     * @param sessionId - Session ID
     * @returns Winner result or null if no winner yet
     */
    async determineWinner(sessionId: string): Promise<WinnerResult | null> {
        const meals = await firebaseService.getSessionMeals(sessionId);
        const votes = await firebaseService.getSessionVotes(sessionId);
        const guests = await firebaseService.getSessionGuests(sessionId);

        const totalGuests = guests.length;

        // Need at least one vote to determine winner
        if (totalGuests === 0 || Object.keys(votes).length === 0) {
            return null;
        }

        // No longer require all guests to have voted - show live results

        // Calculate votes for each meal
        const mealVoteStats = meals.map((meal) => {
            let yesVotes = 0;
            let totalVotes = 0;

            Object.keys(votes).forEach((guestId) => {
                const guestVotes = votes[guestId];
                if (guestVotes[meal.id]) {
                    totalVotes++;
                    if (guestVotes[meal.id] === VoteType.YES) {
                        yesVotes++;
                    }
                }
            });

            const votePercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;

            return {
                meal,
                yesVotes,
                totalVotes,
                votePercentage,
            };
        });

        // Find meals with majority (>50% yes votes)
        const majorityMeals = mealVoteStats.filter((stat) => stat.votePercentage >= 50);

        if (majorityMeals.length > 0) {
            // Sort by vote percentage (highest first), then by yes votes
            majorityMeals.sort((a, b) => {
                if (b.votePercentage !== a.votePercentage) {
                    return b.votePercentage - a.votePercentage;
                }
                return b.yesVotes - a.yesVotes;
            });

            const winner = majorityMeals[0];
            return {
                winner_id: winner.meal.id,
                meal: winner.meal,
                vote_percentage: winner.votePercentage,
                yes_votes: winner.yesVotes,
                total_votes: winner.totalVotes,
            };
        }

        // Fallback: If no majority, pick meal with most yes votes
        if (mealVoteStats.length > 0) {
            mealVoteStats.sort((a, b) => {
                if (b.yesVotes !== a.yesVotes) {
                    return b.yesVotes - a.yesVotes;
                }
                return b.votePercentage - a.votePercentage;
            });

            const winner = mealVoteStats[0];
            // Only return winner if at least one yes vote
            if (winner.yesVotes > 0) {
                return {
                    winner_id: winner.meal.id,
                    meal: winner.meal,
                    vote_percentage: winner.votePercentage,
                    yes_votes: winner.yesVotes,
                    total_votes: winner.totalVotes,
                };
            }
        }

        return null;
    }

    /**
     * Check if winner can be determined and update session status
     * @param sessionId - Session ID
     */
    async checkAndUpdateWinner(sessionId: string): Promise<void> {
        // No longer auto-complete sessions - voting is ongoing
        // Results update live as votes come in
        // Session can be manually completed by host if needed
    }

    /**
     * Get voting status for a session
     * @param sessionId - Session ID
     * @returns Voting status with progress and winner info
     */
    async getVotingStatus(sessionId: string): Promise<{
        progress: VotingProgress;
        winner: WinnerResult | null;
    }> {
        const progress = await this.calculateProgress(sessionId);
        const winner = await this.determineWinner(sessionId);

        return {
            progress,
            winner,
        };
    }

    /**
     * Get vote statistics for a meal
     * @param sessionId - Session ID
     * @param mealId - Meal ID
     * @returns Vote statistics
     */
    async getMealVoteStats(
        sessionId: string,
        mealId: string
    ): Promise<{
        yes_votes: number;
        no_votes: number;
        total_votes: number;
        vote_percentage: number;
    }> {
        const votes = await firebaseService.getSessionVotes(sessionId);

        let yesVotes = 0;
        let noVotes = 0;

        Object.keys(votes).forEach((guestId) => {
            const guestVotes = votes[guestId];
            if (guestVotes[mealId]) {
                if (guestVotes[mealId] === VoteType.YES) {
                    yesVotes++;
                } else {
                    noVotes++;
                }
            }
        });

        const totalVotes = yesVotes + noVotes;
        const votePercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;

        return {
            yes_votes: yesVotes,
            no_votes: noVotes,
            total_votes: totalVotes,
            vote_percentage: votePercentage,
        };
    }

    /**
     * Check if a guest has voted on all meals
     * @param sessionId - Session ID
     * @param guestId - Guest ID
     * @returns true if guest has voted on all meals
     */
    async hasGuestCompletedVoting(sessionId: string, guestId: string): Promise<boolean> {
        const meals = await firebaseService.getSessionMeals(sessionId);
        const guestVotes = await firebaseService.getGuestVotes(sessionId, guestId);

        return meals.every((meal) => guestVotes[meal.id] !== undefined);
    }
}

// Export singleton instance
export default new VoteService();

// Made with Bob
