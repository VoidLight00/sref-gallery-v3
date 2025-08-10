import { Router } from 'express';
import { sendSuccess } from '../middleware/errorHandler';

const router = Router();

// GET /api/config
router.get('/', (req, res) => {
  sendSuccess(res, {
    features: {
      userRegistration: process.env.FEATURE_USER_REGISTRATION === 'true',
      premiumFeatures: process.env.FEATURE_PREMIUM_ACCOUNTS === 'true',
      socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
      collections: process.env.FEATURE_COLLECTIONS === 'true',
      websocket: process.env.FEATURE_WEBSOCKET === 'true'
    },
    limits: {
      maxUploadSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      maxImagesPerSref: 4,
      rateLimitPerHour: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000')
    },
    version: process.env.npm_package_version || '0.1.0'
  });
});

export { router as configRoutes };