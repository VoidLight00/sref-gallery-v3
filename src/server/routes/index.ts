import { Router } from 'express';
import { authRoutes } from './auth';
import { srefRoutes } from './sref';
import { categoryRoutes } from './categories';
import { tagRoutes } from './tags';
import { searchRoutes } from './search';
import { userRoutes } from './user';
import { adminRoutes } from './admin';
import { analyticsRoutes } from './analytics';
import { configRoutes } from './config';

const router = Router();

// API versioning
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount routes
router.use('/auth', authRoutes);
router.use('/sref', srefRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/search', searchRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/config', configRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SREF Gallery API',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth',
        sref: '/api/sref',
        categories: '/api/categories',
        tags: '/api/tags',
        search: '/api/search',
        user: '/api/user',
        admin: '/api/admin',
        analytics: '/api/analytics',
        config: '/api/config',
        health: '/api/health'
      },
      documentation: process.env.SWAGGER_ENABLED === 'true' 
        ? `${req.protocol}://${req.get('host')}/api/docs` 
        : null
    }
  });
});

export { router as apiRoutes };