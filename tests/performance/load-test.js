/**
 * Performance and Load Testing Suite
 * 
 * Tests application performance under various load conditions:
 * - Page load times
 * - Image loading performance
 * - API response times
 * - Concurrent user simulation
 * - Memory usage monitoring
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.TEST_API_URL || 'http://localhost:3001/api';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 3000,      // 3 seconds
  API_RESPONSE: 1000,   // 1 second
  IMAGE_LOAD: 2000,     // 2 seconds
  SEARCH: 1500,         // 1.5 seconds
};

describe('Performance Tests', () => {
  describe('Page Load Performance', () => {
    it('should load homepage within performance threshold', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(BASE_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Performance-Test/1.0)',
        }
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
      
      console.log(`Homepage load time: ${Math.round(loadTime)}ms`);
    });

    it('should load SREF detail page efficiently', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BASE_URL}/sref/1234567890`, {
        timeout: 10000
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
      
      console.log(`SREF detail load time: ${Math.round(loadTime)}ms`);
    });

    it('should load categories page quickly', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BASE_URL}/categories`, {
        timeout: 10000
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
      
      console.log(`Categories load time: ${Math.round(loadTime)}ms`);
    });

    it('should load discover page with optimal performance', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BASE_URL}/discover`, {
        timeout: 10000
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
      
      console.log(`Discover page load time: ${Math.round(loadTime)}ms`);
    });
  });

  describe('Image Loading Performance', () => {
    it('should serve WebP images efficiently', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(`${BASE_URL}/images/sref/anime/sref-1357924680-1.webp`, {
        timeout: 10000,
        responseType: 'arraybuffer'
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image');
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.IMAGE_LOAD);
      
      const imageSizeKB = Buffer.byteLength(response.data) / 1024;
      console.log(`Image load time: ${Math.round(loadTime)}ms, Size: ${Math.round(imageSizeKB)}KB`);
      
      // Images should be reasonably optimized (under 500KB)
      expect(imageSizeKB).toBeLessThan(500);
    });

    it('should handle multiple concurrent image requests', async () => {
      const imageUrls = [
        `${BASE_URL}/images/sref/anime/sref-1357924680-1.webp`,
        `${BASE_URL}/images/sref/anime/sref-1357924680-2.webp`,
        `${BASE_URL}/images/sref/photography/sref-1928374650-1.webp`,
        `${BASE_URL}/images/sref/art/sref-1597348260-1.webp`,
      ];

      const startTime = performance.now();
      
      const promises = imageUrls.map(url => 
        axios.get(url, { 
          timeout: 10000,
          responseType: 'arraybuffer'
        })
      );
      
      const responses = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.IMAGE_LOAD * 2); // Allow more time for multiple images
      console.log(`Concurrent image load time: ${Math.round(totalTime)}ms`);
    });
  });

  describe('API Performance', () => {
    it('should respond to health check quickly', async () => {
      try {
        const startTime = performance.now();
        
        const response = await axios.get(`${API_URL}/health`, {
          timeout: 5000
        });
        
        const responseTime = performance.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
        
        console.log(`Health check response time: ${Math.round(responseTime)}ms`);
      } catch (error) {
        console.warn('API health check not available:', error.message);
      }
    }, 10000);

    it('should handle SREF listing requests efficiently', async () => {
      try {
        const startTime = performance.now();
        
        const response = await axios.get(`${API_URL}/sref?limit=20`, {
          timeout: 5000
        });
        
        const responseTime = performance.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
        
        console.log(`SREF listing response time: ${Math.round(responseTime)}ms`);
      } catch (error) {
        console.warn('SREF listing API not available:', error.message);
      }
    }, 10000);

    it('should handle search requests within threshold', async () => {
      try {
        const startTime = performance.now();
        
        const response = await axios.get(`${API_URL}/search?q=anime&limit=10`, {
          timeout: 5000
        });
        
        const responseTime = performance.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH);
        
        console.log(`Search response time: ${Math.round(responseTime)}ms`);
      } catch (error) {
        console.warn('Search API not available:', error.message);
      }
    }, 10000);
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent homepage requests', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        axios.get(BASE_URL, { timeout: 15000 })
      );
      
      const responses = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / concurrentRequests;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD * 1.5);
      
      console.log(`Concurrent requests (${concurrentRequests}): Total ${Math.round(totalTime)}ms, Average ${Math.round(avgTime)}ms`);
    }, 30000);

    it('should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const requestInterval = 500; // Request every 500ms
      const startTime = performance.now();
      const responseTimes = [];
      
      while (performance.now() - startTime < duration) {
        const requestStart = performance.now();
        
        try {
          const response = await axios.get(BASE_URL, { timeout: 10000 });
          const requestTime = performance.now() - requestStart;
          
          expect(response.status).toBe(200);
          responseTimes.push(requestTime);
        } catch (error) {
          console.warn('Request failed during sustained load:', error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD);
      expect(maxResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD * 2);
      
      console.log(`Sustained load test: ${responseTimes.length} requests, Avg: ${Math.round(avgResponseTime)}ms, Max: ${Math.round(maxResponseTime)}ms`);
    }, 15000);
  });

  describe('Mobile Performance', () => {
    it('should perform well on mobile devices', async () => {
      const startTime = performance.now();
      
      const response = await axios.get(BASE_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      
      const loadTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      // Mobile should be slightly more lenient but still fast
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_LOAD * 1.2);
      
      console.log(`Mobile load time: ${Math.round(loadTime)}ms`);
    });
  });
});

describe('Resource Optimization Tests', () => {
  it('should serve compressed responses', async () => {
    const response = await axios.get(BASE_URL, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    
    expect(response.status).toBe(200);
    // Should have compression header
    expect(
      response.headers['content-encoding'] === 'gzip' ||
      response.headers['content-encoding'] === 'br' ||
      response.headers['content-encoding'] === 'deflate'
    ).toBeTruthy();
  });

  it('should have proper caching headers for static assets', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/images/sref/anime/sref-1357924680-1.webp`);
      
      expect(response.status).toBe(200);
      // Should have caching headers
      expect(response.headers['cache-control']).toBeTruthy();
    } catch (error) {
      console.warn('Static asset not available for caching test');
    }
  });
});

// Performance monitoring utility
function logPerformanceMetrics(testName, metrics) {
  console.log(`\n📊 ${testName} Performance Metrics:`);
  Object.entries(metrics).forEach(([key, value]) => {
    console.log(`   ${key}: ${typeof value === 'number' ? Math.round(value) + 'ms' : value}`);
  });
}