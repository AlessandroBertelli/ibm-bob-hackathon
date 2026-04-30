/**
 * Vote Controller
 * Handles voting-related HTTP requests
 */

import { Request, Response } from 'express';
import { VoteType } from '../types/session.types';
import voteService from '../services/vote.service';
import { validateVoteData } from '../utils/validation.util';
import { ValidationError, NotFoundError } from '../utils/errors.util';

/**
 * Submit a vote
 * POST /api/votes
 */
export const submitVote = async (req: Request, res: Response): Promise<void> => {
    try {
        const voteData = req.body;

        // Validate vote data
        validateVoteData(voteData);

        const { session_id, guest_id, meal_id, vote_type } = voteData;

        // Normalize vote type
        const normalizedVoteType = vote_type.toLowerCase() === 'yes' ? VoteType.YES : VoteType.NO;

        // Record the vote
        await voteService.recordVote(session_id, guest_id, meal_id, normalizedVoteType);

        res.status(200).json({
            success: true,
            message: 'Vote recorded successfully',
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
                errors: error.errors,
            });
        } else if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else {
            console.error('Submit vote error:', error);
            res.status(500).json({
                error: 'Failed to submit vote',
            });
        }
    }
};

/**
 * Get voting progress for a session
 * GET /api/sessions/:id/progress
 */
export const getProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        const progress = await voteService.calculateProgress(id);

        res.status(200).json({
            success: true,
            progress,
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else {
            console.error('Get progress error:', error);
            res.status(500).json({
                error: 'Failed to get voting progress',
            });
        }
    }
};

/**
 * Get winner for a session
 * GET /api/sessions/:id/winner
 */
export const getWinner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        const winner = await voteService.determineWinner(id);

        if (!winner) {
            res.status(200).json({
                success: true,
                winner: null,
                message: 'No winner determined yet',
            });
            return;
        }

        res.status(200).json({
            success: true,
            winner: {
                meal_id: winner.winner_id,
                meal: winner.meal,
                vote_percentage: winner.vote_percentage,
                yes_votes: winner.yes_votes,
                total_votes: winner.total_votes,
            },
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else {
            console.error('Get winner error:', error);
            res.status(500).json({
                error: 'Failed to get winner',
            });
        }
    }
};

/**
 * Get voting status (progress + winner)
 * GET /api/sessions/:id/voting-status
 */
export const getVotingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        const status = await voteService.getVotingStatus(id);

        res.status(200).json({
            success: true,
            ...status,
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else {
            console.error('Get voting status error:', error);
            res.status(500).json({
                error: 'Failed to get voting status',
            });
        }
    }
};

/**
 * Get vote statistics for a specific meal
 * GET /api/sessions/:sessionId/meals/:mealId/stats
 */
export const getMealStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, mealId } = req.params;

        if (!sessionId || typeof sessionId !== 'string') {
            throw new ValidationError('Session ID is required');
        }

        if (!mealId || typeof mealId !== 'string') {
            throw new ValidationError('Meal ID is required');
        }

        const stats = await voteService.getMealVoteStats(sessionId, mealId);

        res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({
                error: error.message,
            });
        } else if (error instanceof NotFoundError) {
            res.status(404).json({
                error: error.message,
            });
        } else {
            console.error('Get meal stats error:', error);
            res.status(500).json({
                error: 'Failed to get meal statistics',
            });
        }
    }
};

// Made with Bob
