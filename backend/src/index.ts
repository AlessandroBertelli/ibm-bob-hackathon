import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import voteRoutes from './routes/vote.routes';
import aiRoutes from './routes/ai.routes';

// Import error utilities
import { ApiError, formatErrorResponse } from './utils/errors.util';

// Import service info
import { isUsingMockServices, serviceMode } from './services/service-factory';

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            api: 'operational',
            firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not configured',
            email: process.env.SMTP_USER ? 'configured' : 'not configured',
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        },
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Group Food Tinder API',
        version: '1.0.0',
        description: 'Backend API for group food decision making',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            sessions: '/api/sessions',
            votes: '/api/votes',
            ai: '/api/ai',
        },
        documentation: {
            auth: {
                'POST /api/auth/request-magic-link': 'Request magic link email',
                'POST /api/auth/verify': 'Verify magic link token',
                'POST /api/auth/resend-magic-link': 'Resend magic link',
                'GET /api/auth/me': 'Get current user (requires auth)',
            },
            sessions: {
                'POST /api/sessions': 'Create new session (requires auth)',
                'GET /api/sessions/:id': 'Get session details',
                'POST /api/sessions/:id/share-link': 'Generate share link (requires auth)',
                'POST /api/sessions/:id/join': 'Join session as guest',
                'GET /api/sessions/token/:token': 'Get session by share token',
            },
            votes: {
                'POST /api/votes': 'Submit a vote',
                'GET /api/sessions/:id/progress': 'Get voting progress',
                'GET /api/sessions/:id/winner': 'Get winner if determined',
                'GET /api/sessions/:id/voting-status': 'Get complete voting status',
            },
            ai: {
                'GET /api/ai/health': 'Check AI service health',
                'POST /api/ai/generate-meals': 'Generate meal options',
                'POST /api/ai/regenerate-meals/:sessionId': 'Regenerate meals (requires auth)',
            },
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: ['/health', '/api/auth', '/api/sessions', '/api/votes', '/api/ai'],
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    if (err instanceof ApiError) {
        const response = formatErrorResponse(err);
        res.status(response.statusCode).json(response);
    } else {
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🍕 Group Food Tinder API Server                    ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Port: ${PORT}                                          ║
║   URL: http://localhost:${PORT}                        ║
║                                                       ║
║   Status: ✅ Server is running                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

    // Display mock authentication info if using mock services
    if (isUsingMockServices) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║  🧪 MOCK AUTHENTICATION - Development Mode                                ║');
        console.log('╠════════════════════════════════════════════════════════════════════════════╣');
        console.log('║                                                                            ║');
        console.log('║  📧 Mock Email Service Active                                             ║');
        console.log('║     All authentication emails will be logged to this console              ║');
        console.log('║                                                                            ║');
        console.log('║  🔐 To Test Authentication:                                               ║');
        console.log('║     1. Go to the frontend and request a magic link                        ║');
        console.log('║     2. Check this terminal for the verification link                      ║');
        console.log('║     3. Click or copy the link to authenticate                             ║');
        console.log('║                                                                            ║');
        console.log('║  💡 Quick Start:                                                          ║');
        console.log(`║     Frontend: ${frontendUrl.padEnd(59)}║`);
        console.log(`║     Backend:  http://localhost:${PORT.toString().padEnd(47)}║`);
        console.log('║                                                                            ║');
        console.log('║  📝 Example Test Email: test@example.com                                  ║');
        console.log('║     (Any email will work in mock mode)                                    ║');
        console.log('║                                                                            ║');
        console.log('║  ⚙️  Service Mode: MOCK                                                   ║');
        console.log('║     • AI: Mock meal templates                                             ║');
        console.log('║     • Database: In-memory storage                                         ║');
        console.log('║     • Email: Console logging (watch this terminal!)                       ║');
        console.log('║                                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

export default app;

// Made with Bob
