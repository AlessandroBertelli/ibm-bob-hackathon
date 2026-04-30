/**
 * Service Factory
 * Provides easy switching between real and mock services based on environment
 */

// Real services
import realAiService from './ai.service';
import realFirebaseService from './firebase.service';
import realEmailService from './email.service';

// Mock services
import mockAiService from './mock/mock-ai.service';
import mockFirebaseService from './mock/mock-firebase.service';
import mockEmailService from './mock/mock-email.service';

/**
 * Service mode type
 */
type ServiceMode = 'mock' | 'test' | 'production';

/**
 * Determine service mode from environment
 * Options: 'mock' | 'test' | 'production'
 * - mock: Uses mock services (no API keys required)
 * - test: Uses real APIs for testing (requires API keys)
 * - production: Full production mode
 */
const SERVICE_MODE = (process.env.SERVICE_MODE || 'mock') as ServiceMode;

/**
 * Validate service mode
 */
const validModes: ServiceMode[] = ['mock', 'test', 'production'];
if (!validModes.includes(SERVICE_MODE)) {
    console.warn(`⚠️  Invalid SERVICE_MODE: ${SERVICE_MODE}. Defaulting to 'mock'`);
}

/**
 * Determine if we should use mock services
 */
const USE_MOCK_SERVICES = SERVICE_MODE === 'mock';

/**
 * Log the service mode on startup
 */
console.log('\n' + '='.repeat(80));
switch (SERVICE_MODE) {
    case 'mock':
        console.log('🧪 MOCK MODE - Using mock services (no external APIs required)');
        console.log('   • AI: Mock meal templates');
        console.log('   • Database: In-memory storage');
        console.log('   • Email: Console logging');
        break;
    case 'test':
        console.log('🔧 TEST MODE - Using real APIs for testing');
        console.log('   • AI: OpenAI API (requires OPENAI_API_KEY)');
        console.log('   • Database: Firebase (requires credentials)');
        console.log('   • Email: SMTP (requires SMTP credentials)');
        break;
    case 'production':
        console.log('🚀 PRODUCTION MODE - Full production services');
        console.log('   • AI: OpenAI API');
        console.log('   • Database: Firebase');
        console.log('   • Email: SMTP');
        break;
}
console.log('='.repeat(80) + '\n');

/**
 * AI Service - handles meal generation
 * Exports either real OpenAI service or mock service
 */
export const aiService = (USE_MOCK_SERVICES ? mockAiService : realAiService) as typeof realAiService;

/**
 * Firebase Service - handles database operations
 * Exports either real Firebase service or mock in-memory service
 */
export const firebaseService = (USE_MOCK_SERVICES ? mockFirebaseService : realFirebaseService) as typeof realFirebaseService;

/**
 * Email Service - handles email sending
 * Exports either real SMTP service or mock console logging service
 */
export const emailService = (USE_MOCK_SERVICES ? mockEmailService : realEmailService) as typeof realEmailService;

/**
 * Export service mode for other modules to check
 */
export const isUsingMockServices = USE_MOCK_SERVICES;
export const serviceMode = SERVICE_MODE;

/**
 * Get current service configuration info
 */
export function getServiceInfo() {
    return {
        mode: SERVICE_MODE,
        useMock: USE_MOCK_SERVICES,
        services: {
            ai: USE_MOCK_SERVICES ? 'mock' : 'openai',
            database: USE_MOCK_SERVICES ? 'in-memory' : 'firebase',
            email: USE_MOCK_SERVICES ? 'console' : 'smtp',
        },
    };
}

// Made with Bob