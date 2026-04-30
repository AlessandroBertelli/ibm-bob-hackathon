import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/storage.js';

// Helper function to check if all guests have voted on all meals
function checkIfAllVoted(party, guestCount) {
    if (guestCount === 0) return false;

    for (const meal of party.meals) {
        if (!meal.votes) return false;
        const voteCount = Object.keys(meal.votes).length;
        if (voteCount < guestCount) return false;
    }

    return true;
}

// Helper function to find winner by majority
function findMajorityWinner(party, guestCount) {
    let bestMeal = null;
    let maxYesVotes = 0;

    for (const meal of party.meals) {
        if (!meal.votes) continue;

        const votes = Object.values(meal.votes);
        const yesVotes = votes.filter(v => v === 'yes').length;

        if (yesVotes > maxYesVotes) {
            maxYesVotes = yesVotes;
            bestMeal = meal;
        }
    }

    // Return winner if it has at least one yes vote
    return maxYesVotes > 0 ? bestMeal : null;
}

export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a party room
        socket.on('join-party', ({ partyId, guestId }) => {
            try {
                const party = storage.getParty(partyId);

                if (!party) {
                    socket.emit('error', { message: 'Party not found' });
                    return;
                }

                // Create or get guest
                let guest = guestId ? storage.getGuest(guestId) : null;

                if (!guest) {
                    guest = {
                        id: uuidv4(),
                        partyId,
                        socketId: socket.id,
                        joinedAt: new Date().toISOString()
                    };
                    storage.addGuest(guest);
                } else {
                    // Update socket ID for reconnection
                    guest.socketId = socket.id;
                }

                // Join the party room
                socket.join(`party-${partyId}`);

                // Send guest ID back to client
                socket.emit('joined-party', {
                    guestId: guest.id,
                    party
                });

                // Notify others
                socket.to(`party-${partyId}`).emit('guest-joined', {
                    guestId: guest.id,
                    guestCount: storage.getGuestsByParty(partyId).length
                });

                console.log(`Guest ${guest.id} joined party ${partyId}`);
            } catch (error) {
                console.error('Error joining party:', error);
                socket.emit('error', { message: 'Failed to join party' });
            }
        });

        // Handle vote
        socket.on('vote', ({ partyId, mealId, guestId, vote }) => {
            try {
                const party = storage.getParty(partyId);

                if (!party) {
                    socket.emit('error', { message: 'Party not found' });
                    return;
                }

                // Record the vote
                storage.recordVote(partyId, mealId, guestId, vote);

                // Get updated party
                const updatedParty = storage.getParty(partyId);

                // Broadcast vote update to all clients in the room
                io.to(`party-${partyId}`).emit('vote-update', {
                    mealId,
                    guestId,
                    vote,
                    meals: updatedParty.meals
                });

                // Check for winner (unanimous or majority)
                const guests = storage.getGuestsByParty(partyId);
                const allVoted = checkIfAllVoted(updatedParty, guests.length);

                // First check for unanimous winner
                let winner = storage.checkForWinner(partyId);

                // If all voted and no unanimous winner, pick by majority
                if (!winner && allVoted) {
                    winner = findMajorityWinner(updatedParty, guests.length);

                    if (winner) {
                        // Update party status
                        storage.updateParty(partyId, { status: 'completed' });

                        // Announce winner to all clients
                        io.to(`party-${partyId}`).emit('winner-found', {
                            winner,
                            winType: 'majority'
                        });

                        console.log(`Majority winner found for party ${partyId}:`, winner.title);
                    }
                } else if (winner) {
                    // Update party status
                    storage.updateParty(partyId, { status: 'completed' });

                    // Announce winner to all clients
                    io.to(`party-${partyId}`).emit('winner-found', {
                        winner,
                        winType: 'unanimous'
                    });

                    console.log(`Unanimous winner found for party ${partyId}:`, winner.title);
                }

                console.log(`Vote recorded: Guest ${guestId} voted ${vote} on meal ${mealId}`);
            } catch (error) {
                console.error('Error recording vote:', error);
                socket.emit('error', { message: 'Failed to record vote' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Note: We don't remove guests on disconnect to allow reconnection
            // In a production app, you might want to implement a timeout
        });
    });
}

// Made with Bob
