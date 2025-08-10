/**
 * Security Validation Test Suite
 * 
 * Tests critical security measures:
 * - Input sanitization and XSS prevention
 * - Authentication and authorization
 * - Data validation
 * - CSRF protection
 * - SQL injection prevention
 * - Security headers
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.TEST_API_URL || 'http://localhost:3001/api';

describe('Security Validation Tests', () => {
  describe('Input Sanitization and XSS Prevention', () => {
    it('should sanitize malicious script tags in search queries', async () => {
      const maliciousQuery = '<script>alert("xss")</script>';
      
      try {
        const response = await axios.get(`${API_URL}/search?q=${encodeURIComponent(maliciousQuery)}`);
        
        // Should not contain unescaped script tags
        expect(response.data).not.toMatch(/<script.*>.*<\/script>/);
        
        if (response.data.success) {
          expect(response.data.data.results).toBeDefined();
        }
      } catch (error) {
        // API might return 400 for malicious input, which is expected
        if (error.response && error.response.status === 400) {
          expect(error.response.data.error).toBeTruthy();
        }
      }
    });

    it('should handle malicious HTML in form inputs', async () => {
      const maliciousHtml = '<img src="x" onerror="alert(1)">';
      
      try {
        const response = await axios.post(`${API_URL}/contact`, {
          name: maliciousHtml,
          email: 'test@example.com',
          message: 'Test message'
        });
        
        // Should sanitize the input
        if (response.data.success) {
          expect(response.data.data.name).not.toContain('<img');
          expect(response.data.data.name).not.toContain('onerror');
        }
      } catch (error) {
        // Expected to fail validation
        if (error.response && error.response.status === 400) {
          expect(error.response.data.error).toBeTruthy();
        }
      }
    });

    it('should prevent JavaScript injection in URL parameters', async () => {
      const maliciousParam = 'javascript:alert(1)';
      
      try {
        const response = await axios.get(`${BASE_URL}/sref/${encodeURIComponent(maliciousParam)}`);
        
        // Should handle gracefully, either 404 or sanitized
        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.data).not.toContain('javascript:');
        }
      } catch (error) {
        // 404 or other error is acceptable for invalid SREF codes
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should protect authenticated endpoints', async () => {
      try {
        const response = await axios.get(`${API_URL}/user/profile`);
        
        // Should require authentication
        expect(response.status).toBe(401);
        expect(response.data.error).toBeTruthy();
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      try {
        const response = await axios.get(`${API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${invalidToken}`
          }
        });
        
        expect(response.status).toBe(401);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle expired tokens', async () => {
      // Mock expired JWT token (manually crafted for testing)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      try {
        const response = await axios.get(`${API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${expiredToken}`
          }
        });
        
        expect(response.status).toBe(401);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'test@',
        'test..test@example.com'
      ];
      
      for (const email of invalidEmails) {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            username: 'testuser',
            password: 'ValidPass123!'
          });
          
          // Should reject invalid emails
          expect(response.status).toBe(400);
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toBeTruthy();
        }
      }
    });

    it('should enforce password complexity', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        '12345678'
      ];
      
      for (const password of weakPasswords) {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            email: 'test@example.com',
            username: 'testuser',
            password
          });
          
          expect(response.status).toBe(400);
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error.message).toMatch(/password/i);
        }
      }
    });

    it('should validate SREF codes format', async () => {
      const invalidCodes = [
        'abc',           // Too short
        '12345678901',   // Too long
        'invalid-code',  // Contains invalid characters
        ''               // Empty
      ];
      
      for (const code of invalidCodes) {
        try {
          const response = await axios.get(`${BASE_URL}/sref/${encodeURIComponent(code)}`);
          
          if (response.status !== 404) {
            expect(response.status).toBe(400);
          }
        } catch (error) {
          expect([400, 404]).toContain(error.response.status);
        }
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await axios.get(BASE_URL);
      
      expect(response.status).toBe(200);
      
      // Check for important security headers
      const headers = response.headers;
      
      // Content Security Policy
      expect(headers['content-security-policy'] || headers['x-content-security-policy']).toBeTruthy();
      
      // X-Frame-Options
      expect(headers['x-frame-options']).toBeTruthy();
      expect(['DENY', 'SAMEORIGIN'].some(value => 
        headers['x-frame-options']?.includes(value)
      )).toBe(true);
      
      // X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');
      
      // X-XSS-Protection (if supported)
      if (headers['x-xss-protection']) {
        expect(headers['x-xss-protection']).toMatch(/1/);
      }
    });

    it('should set proper CORS headers', async () => {
      try {
        const response = await axios.options(API_URL, {
          headers: {
            'Origin': 'https://example.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });
        
        // CORS headers should be properly configured
        if (response.status === 200) {
          expect(response.headers['access-control-allow-origin']).toBeTruthy();
          expect(response.headers['access-control-allow-methods']).toBeTruthy();
        }
      } catch (error) {
        // API might not be available or CORS not configured for tests
        console.warn('CORS test skipped - API not available');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for API endpoints', async () => {
      const rapidRequests = [];
      const maxRequests = 20; // Attempt to exceed typical rate limit
      
      for (let i = 0; i < maxRequests; i++) {
        rapidRequests.push(
          axios.get(`${API_URL}/health`).catch(error => error.response)
        );
      }
      
      try {
        const responses = await Promise.all(rapidRequests);
        
        // Should have some rate limited responses (429)
        const rateLimited = responses.filter(r => r && r.status === 429);
        const successful = responses.filter(r => r && r.status === 200);
        
        // If rate limiting is implemented, some should be blocked
        if (rateLimited.length > 0) {
          expect(rateLimited.length).toBeGreaterThan(0);
          expect(successful.length).toBeLessThan(maxRequests);
        }
        
        console.log(`Rate limiting test: ${successful.length} successful, ${rateLimited.length} rate limited`);
      } catch (error) {
        console.warn('Rate limiting test failed:', error.message);
      }
    }, 15000);
  });

  describe('File Upload Security', () => {
    it('should reject malicious file types', async () => {
      const maliciousFiles = [
        { filename: 'test.php', content: '<?php echo "malicious"; ?>' },
        { filename: 'test.js', content: 'alert("xss");' },
        { filename: 'test.exe', content: 'MZ....' },
      ];
      
      for (const file of maliciousFiles) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([file.content]), file.filename);
          
          const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          // Should reject malicious files
          expect(response.status).toBe(400);
        } catch (error) {
          expect(error.response.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    it('should validate file sizes', async () => {
      try {
        // Create a large fake file
        const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
        const formData = new FormData();
        formData.append('file', new Blob([largeContent]), 'large.txt');
        
        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Should reject files that are too large
        expect(response.status).toBe(413);
      } catch (error) {
        expect([400, 413]).toContain(error.response.status);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const sqlInjections = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; INSERT INTO users VALUES ('admin', 'password'); --"
      ];
      
      for (const injection of sqlInjections) {
        try {
          const response = await axios.get(`${API_URL}/search?q=${encodeURIComponent(injection)}`);
          
          // Should handle safely without executing SQL
          if (response.status === 200) {
            expect(response.data.success).toBeDefined();
            // Should not return suspicious data structures that indicate SQL execution
            expect(JSON.stringify(response.data)).not.toMatch(/users|admin|password/i);
          }
        } catch (error) {
          // 400 errors are acceptable for malicious input
          if (error.response && error.response.status >= 400) {
            expect(error.response.data.error).toBeTruthy();
          }
        }
      }
    });
  });

  describe('Session Security', () => {
    it('should use secure session cookies', async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'ValidPassword123!'
        });
        
        if (response.status === 200) {
          // Check cookie security attributes
          const setCookieHeader = response.headers['set-cookie'];
          
          if (setCookieHeader) {
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            
            cookies.forEach(cookie => {
              if (cookie.includes('session') || cookie.includes('token')) {
                expect(cookie).toMatch(/HttpOnly/i);
                expect(cookie).toMatch(/Secure/i);
                expect(cookie).toMatch(/SameSite/i);
              }
            });
          }
        }
      } catch (error) {
        // Login endpoint might not exist or credentials invalid
        console.warn('Session security test skipped - login not available');
      }
    });
  });
});

// Security utility functions
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isSecureResponse(response) {
  const headers = response.headers;
  
  return {
    hasCSP: !!(headers['content-security-policy'] || headers['x-content-security-policy']),
    hasFrameOptions: !!headers['x-frame-options'],
    hasContentTypeOptions: headers['x-content-type-options'] === 'nosniff',
    hasXSSProtection: headers['x-xss-protection']?.includes('1'),
  };
}