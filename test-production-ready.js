#!/usr/bin/env node

/**
 * Production Readiness Test Suite
 * 
 * This script runs comprehensive validation of the SREF Gallery application
 * to ensure it meets all production readiness criteria.
 */

const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const util = require('util');

const execPromise = util.promisify(exec);

const BASE_URL = 'http://localhost:3002';

class ProductionValidator {
  constructor() {
    this.results = {
      functionality: [],
      performance: [],
      security: [],
      accessibility: [],
      seo: [],
      images: [],
      errors: []
    };
    
    this.startTime = Date.now();
  }

  async runValidation() {
    console.log('🚀 SREF Gallery Production Readiness Validation');
    console.log('='.repeat(60));
    console.log(`Testing application at: ${BASE_URL}\n`);

    try {
      // Core functionality tests
      await this.testCoreFunctionality();
      
      // Performance tests
      await this.testPerformance();
      
      // Image functionality tests
      await this.testImageFunctionality();
      
      // SEO and accessibility tests
      await this.testSEOAndAccessibility();
      
      // Security tests
      await this.testSecurity();
      
      // Error handling tests
      await this.testErrorHandling();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, options, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
            responseTime
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testCoreFunctionality() {
    console.log('🔧 Testing Core Functionality...');
    
    const tests = [
      {
        name: 'Homepage loads successfully',
        url: BASE_URL,
        validator: (res) => res.statusCode === 200 && res.data.includes('SREF Gallery')
      },
      {
        name: 'Categories page loads',
        url: `${BASE_URL}/categories`,
        validator: (res) => res.statusCode === 200
      },
      {
        name: 'Discover page loads',
        url: `${BASE_URL}/discover`,
        validator: (res) => res.statusCode === 200
      },
      {
        name: 'Valid SREF detail page works',
        url: `${BASE_URL}/sref/1747943467`,
        validator: (res) => res.statusCode === 200 && res.data.includes('1747943467')
      },
      {
        name: 'Featured SREFs displayed',
        url: BASE_URL,
        validator: (res) => res.data.includes('Featured SREF Codes')
      },
      {
        name: 'Navigation elements present',
        url: BASE_URL,
        validator: (res) => res.data.includes('nav') && res.data.includes('header')
      }
    ];

    for (const test of tests) {
      try {
        const response = await this.makeRequest(test.url);
        const passed = test.validator(response);
        
        this.results.functionality.push({
          test: test.name,
          passed,
          responseTime: response.responseTime,
          critical: true
        });
        
        console.log(`   ${passed ? '✅' : '❌'} ${test.name} (${response.responseTime}ms)`);
      } catch (error) {
        this.results.functionality.push({
          test: test.name,
          passed: false,
          error: error.message,
          critical: true
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const performanceTests = [
      { name: 'Homepage load time < 1s', url: BASE_URL, threshold: 1000 },
      { name: 'Categories load time < 1s', url: `${BASE_URL}/categories`, threshold: 1000 },
      { name: 'Discover load time < 1s', url: `${BASE_URL}/discover`, threshold: 1000 },
      { name: 'SREF detail load time < 1s', url: `${BASE_URL}/sref/1747943467`, threshold: 1000 }
    ];

    for (const test of performanceTests) {
      try {
        const response = await this.makeRequest(test.url);
        const passed = response.statusCode === 200 && response.responseTime < test.threshold;
        
        this.results.performance.push({
          test: test.name,
          passed,
          responseTime: response.responseTime,
          critical: true
        });
        
        console.log(`   ${passed ? '✅' : '❌'} ${test.name} (${response.responseTime}ms)`);
      } catch (error) {
        this.results.performance.push({
          test: test.name,
          passed: false,
          error: error.message,
          critical: true
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }

    // Test concurrent load
    console.log('\n   Testing concurrent requests...');
    try {
      const concurrentRequests = 5;
      const promises = Array.from({ length: concurrentRequests }, () => 
        this.makeRequest(BASE_URL)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      const allSuccessful = responses.every(r => r.statusCode === 200);
      const avgTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
      
      this.results.performance.push({
        test: `Concurrent requests (${concurrentRequests})`,
        passed: allSuccessful && avgTime < 1000,
        avgTime,
        totalTime,
        critical: true
      });
      
      console.log(`   ${allSuccessful ? '✅' : '❌'} Concurrent requests: ${Math.round(avgTime)}ms avg, ${totalTime}ms total`);
    } catch (error) {
      console.log(`   ❌ Concurrent requests failed: ${error.message}`);
    }
  }

  async testImageFunctionality() {
    console.log('\n🖼️  Testing Image Functionality...');
    
    const imageTests = [
      {
        name: 'SREF images load successfully',
        url: `${BASE_URL}/images/sref/anime/sref-1747943467-1.webp`,
        validator: (res) => res.statusCode === 200 && res.headers['content-type'].includes('image')
      },
      {
        name: 'Images have proper content type',
        url: `${BASE_URL}/images/sref/anime/sref-1747943467-1.webp`,
        validator: (res) => res.headers['content-type'] === 'image/webp'
      }
    ];

    for (const test of imageTests) {
      try {
        const response = await this.makeRequest(test.url);
        const passed = test.validator(response);
        
        this.results.images.push({
          test: test.name,
          passed,
          responseTime: response.responseTime,
          contentType: response.headers['content-type'],
          critical: true
        });
        
        console.log(`   ${passed ? '✅' : '❌'} ${test.name} (${response.responseTime}ms)`);
      } catch (error) {
        this.results.images.push({
          test: test.name,
          passed: false,
          error: error.message,
          critical: true
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testSEOAndAccessibility() {
    console.log('\n🎯 Testing SEO and Accessibility...');
    
    try {
      const response = await this.makeRequest(BASE_URL);
      const html = response.data;
      
      const tests = [
        {
          name: 'Has proper title tag',
          passed: html.includes('<title>') && !html.includes('<title></title>')
        },
        {
          name: 'Has meta description',
          passed: html.includes('name="description"') && html.includes('content=')
        },
        {
          name: 'Has viewport meta tag',
          passed: html.includes('name="viewport"')
        },
        {
          name: 'Has semantic HTML structure',
          passed: html.includes('<header>') && html.includes('<main>') && html.includes('<footer>')
        },
        {
          name: 'Uses proper heading hierarchy',
          passed: html.includes('<h1') && html.includes('<h2')
        },
        {
          name: 'Images have alt attributes',
          passed: (() => {
            const imgTags = html.match(/<img[^>]*>/g) || [];
            return imgTags.length === 0 || imgTags.every(tag => tag.includes('alt='));
          })()
        }
      ];

      tests.forEach(test => {
        this.results.seo.push({
          test: test.name,
          passed: test.passed,
          critical: false
        });
        
        console.log(`   ${test.passed ? '✅' : '⚠️'} ${test.name}`);
      });
      
    } catch (error) {
      console.log(`   ❌ SEO/Accessibility tests failed: ${error.message}`);
    }
  }

  async testSecurity() {
    console.log('\n🔒 Testing Security...');
    
    try {
      const response = await this.makeRequest(BASE_URL);
      const headers = response.headers;
      
      const tests = [
        {
          name: 'X-Content-Type-Options header',
          passed: headers['x-content-type-options'] === 'nosniff'
        },
        {
          name: 'X-Frame-Options header',
          passed: !!(headers['x-frame-options'])
        },
        {
          name: 'No sensitive data in response',
          passed: !response.data.match(/password|secret|private.*key|api.*key/i)
        }
      ];

      tests.forEach(test => {
        this.results.security.push({
          test: test.name,
          passed: test.passed,
          critical: test.name.includes('sensitive data')
        });
        
        console.log(`   ${test.passed ? '✅' : '⚠️'} ${test.name}`);
      });
      
    } catch (error) {
      console.log(`   ❌ Security tests failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n🛡️  Testing Error Handling...');
    
    const errorTests = [
      {
        name: '404 for non-existent pages',
        url: `${BASE_URL}/nonexistent-page`,
        expectedStatus: 404
      },
      {
        name: '404 for invalid SREF codes',
        url: `${BASE_URL}/sref/invalid-code-123`,
        expectedStatus: 404
      }
    ];

    for (const test of errorTests) {
      try {
        const response = await this.makeRequest(test.url);
        const passed = response.statusCode === test.expectedStatus;
        
        this.results.errors.push({
          test: test.name,
          passed,
          statusCode: response.statusCode,
          critical: true
        });
        
        console.log(`   ${passed ? '✅' : '❌'} ${test.name} (${response.statusCode})`);
      } catch (error) {
        this.results.errors.push({
          test: test.name,
          passed: false,
          error: error.message,
          critical: true
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Calculate statistics
    const allCategories = Object.keys(this.results);
    const allTests = allCategories.reduce((acc, category) => 
      acc.concat(this.results[category]), []
    );
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const criticalFailures = allTests.filter(t => !t.passed && t.critical).length;
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`   Critical Failures: ${criticalFailures} ${criticalFailures > 0 ? '🚨' : '✅'}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`   Validation Time: ${Math.round(totalTime / 1000)}s`);
    
    // Category breakdown
    console.log(`\n📋 BY CATEGORY:`);
    
    allCategories.forEach(category => {
      const tests = this.results[category];
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      console.log(`   ${category.charAt(0).toUpperCase() + category.slice(1)}: ${passed}/${total} (${percentage}%)`);
    });
    
    // Performance metrics
    const performanceTests = this.results.performance.filter(t => t.responseTime);
    if (performanceTests.length > 0) {
      const avgResponseTime = performanceTests.reduce((sum, t) => sum + t.responseTime, 0) / performanceTests.length;
      const maxResponseTime = Math.max(...performanceTests.map(t => t.responseTime));
      
      console.log(`\n⚡ PERFORMANCE METRICS:`);
      console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
      console.log(`   Maximum Response Time: ${Math.round(maxResponseTime)}ms`);
      console.log(`   All responses under 1s: ${maxResponseTime < 1000 ? '✅' : '❌'}`);
    }
    
    // Production readiness decision
    console.log('\n' + '='.repeat(80));
    
    const successRate = passedTests / totalTests;
    
    if (criticalFailures === 0 && successRate >= 0.95) {
      console.log('🚀 PRODUCTION READY ✅');
      console.log('   All critical tests passed and success rate >= 95%');
      console.log('   Application is ready for production deployment!');
      console.log('\n🎉 The SREF Gallery has been fully validated and is production-ready!');
      
    } else if (criticalFailures === 0) {
      console.log('⚠️  PRODUCTION READY WITH WARNINGS ⚠️');
      console.log('   No critical failures but some non-critical issues exist');
      console.log('   Consider addressing warnings before deployment');
      
    } else {
      console.log('❌ NOT PRODUCTION READY ❌');
      console.log(`   ${criticalFailures} critical failure(s) must be resolved`);
      console.log('   DO NOT deploy to production until issues are fixed!');
    }
    
    // Show failed tests
    if (failedTests > 0) {
      console.log('\n🔍 FAILED TESTS:');
      allTests.filter(t => !t.passed).forEach(test => {
        const icon = test.critical ? '🚨' : '⚠️';
        console.log(`   ${icon} ${test.test}`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    }
    
    console.log('='.repeat(80));
    
    // Exit with proper code
    process.exit(criticalFailures > 0 ? 1 : 0);
  }
}

// Run validation
const validator = new ProductionValidator();
validator.runValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});