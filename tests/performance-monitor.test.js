// Tests for performance-monitor.js

import { PerformanceMonitor } from '../js/performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    jest.clearAllMocks();
  });

  describe('recordQuery', () => {
    test('records database query', () => {
      const query = monitor.recordQuery('getProducts', 145, true, 20);
      expect(query.operation).toBe('getProducts');
      expect(query.duration).toBe(145);
      expect(query.success).toBe(true);
      expect(query.rowsAffected).toBe(20);
      expect(query.timestamp).toBeInstanceOf(Date);
    });

    test('keeps last 100 queries', () => {
      for (let i = 0; i < 110; i++) {
        monitor.recordQuery(`query${i}`, 100, true, 1);
      }
      expect(monitor.metrics.queries.length).toBe(100);
    });

    test('logs slow queries', () => {
      console.warn = jest.fn();
      monitor.recordQuery('slowQuery', 1500, true, 1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow query')
      );
    });
  });

  describe('recordAPICall', () => {
    test('records API call', () => {
      const call = monitor.recordAPICall('/api/products', 'GET', 245, 200);
      expect(call.endpoint).toBe('/api/products');
      expect(call.method).toBe('GET');
      expect(call.duration).toBe(245);
      expect(call.statusCode).toBe(200);
    });

    test('keeps last 100 calls', () => {
      for (let i = 0; i < 110; i++) {
        monitor.recordAPICall('/api/test', 'GET', 100, 200);
      }
      expect(monitor.metrics.apiCalls.length).toBe(100);
    });
  });

  describe('recordError', () => {
    test('records error', () => {
      const error = monitor.recordError('ValidationError', 50, { field: 'name' });
      expect(error.error).toBe('ValidationError');
      expect(error.duration).toBe(50);
      expect(error.context.field).toBe('name');
    });

    test('keeps last 100 errors', () => {
      for (let i = 0; i < 110; i++) {
        monitor.recordError('Error', 10);
      }
      expect(monitor.metrics.errors.length).toBe(100);
    });
  });

  describe('getQueryStats', () => {
    test('returns empty stats for no queries', () => {
      const stats = monitor.getQueryStats();
      expect(stats.avgDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
    });

    test('calculates query statistics', () => {
      monitor.recordQuery('q1', 100, true);
      monitor.recordQuery('q2', 200, true);
      monitor.recordQuery('q3', 300, false);

      const stats = monitor.getQueryStats();
      expect(stats.totalQueries).toBe(3);
      expect(parseFloat(stats.avgDuration)).toBe(200); // (100 + 200 + 300) / 3
      expect(stats.minDuration).toBe(100);
      expect(stats.maxDuration).toBe(300);
      expect(stats.successRate).toBe('66.7');
    });

    test('counts slow queries', () => {
      monitor.recordQuery('fast', 500, true);
      monitor.recordQuery('slow1', 1100, true);
      monitor.recordQuery('slow2', 1500, true);

      const stats = monitor.getQueryStats();
      expect(stats.slowQueries).toBe(2);
    });
  });

  describe('getAPIStats', () => {
    test('calculates API statistics', () => {
      monitor.recordAPICall('/api/v1', 'GET', 100, 200);
      monitor.recordAPICall('/api/v2', 'POST', 200, 201);
      monitor.recordAPICall('/api/v3', 'GET', 300, 500);

      const stats = monitor.getAPIStats();
      expect(stats.totalCalls).toBe(3);
      expect(parseFloat(stats.avgDuration)).toBe(200);
      expect(stats.successRate).toBe('66.7'); // 2 success out of 3
    });
  });

  describe('getErrorStats', () => {
    test('groups errors by type', () => {
      monitor.recordError('ValidationError', 10);
      monitor.recordError('ValidationError', 20);
      monitor.recordError('NetworkError', 30);

      const stats = monitor.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType.ValidationError).toBe(2);
      expect(stats.errorsByType.NetworkError).toBe(1);
    });

    test('returns recent errors', () => {
      for (let i = 0; i < 15; i++) {
        monitor.recordError(`Error${i}`, 10);
      }

      const stats = monitor.getErrorStats();
      expect(stats.recentErrors.length).toBe(10); // Last 10
    });
  });

  describe('getPageLoadTime', () => {
    test('calculates page load time', () => {
      const loadTime = monitor.getPageLoadTime();
      if (loadTime !== null) {
        expect(typeof loadTime).toBe('number');
        expect(loadTime).toBeGreaterThan(0);
      }
    });
  });

  describe('getMemoryUsage', () => {
    test('returns memory usage if available', () => {
      const memory = monitor.getMemoryUsage();
      if (memory) {
        expect(memory.usedJSHeapSize).toMatch(/MB/);
        expect(memory.totalJSHeapSize).toMatch(/MB/);
        expect(memory.jsHeapSizeLimit).toMatch(/MB/);
      }
    });
  });

  describe('getResourceTiming', () => {
    test('analyzes resource timing', () => {
      const timing = monitor.getResourceTiming();
      expect(timing.totalResources).toBeGreaterThanOrEqual(0);
      expect(typeof timing.byType).toBe('object');
      expect(Array.isArray(timing.slowResources)).toBe(true);
    });
  });

  describe('generateReport', () => {
    test('generates complete performance report', () => {
      monitor.recordQuery('test', 100, true);
      monitor.recordAPICall('/api/test', 'GET', 200, 200);
      monitor.recordError('TestError', 50);

      const report = monitor.generateReport();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.queries).toBeDefined();
      expect(report.api).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.memory).toBeDefined();
      expect(report.resources).toBeDefined();
    });
  });

  describe('exportMetrics', () => {
    test('exports all metrics', () => {
      monitor.recordQuery('test', 100, true);

      const exported = monitor.exportMetrics();
      expect(exported.timestamp).toBeInstanceOf(Date);
      expect(exported.metrics.queries.length).toBe(1);
      expect(exported.report).toBeDefined();
    });
  });

  describe('renderDashboard', () => {
    test('renders dashboard to container', () => {
      monitor.recordQuery('test', 100, true);
      monitor.recordAPICall('/api/test', 'GET', 200, 200);

      const mockContainer = {
        innerHTML: '',
      };

      global.document.getElementById = jest.fn(() => mockContainer);

      monitor.renderDashboard('perf-dashboard');

      expect(mockContainer.innerHTML).toContain('Performance Monitor');
      expect(mockContainer.innerHTML).toContain('Queries');
    });

    test('handles missing container gracefully', () => {
      global.document.getElementById = jest.fn(() => null);
      expect(() => monitor.renderDashboard('missing')).not.toThrow();
    });
  });

  describe('Performance tracking integration', () => {
    test('tracks realistic database operations', () => {
      // Simulate a typical database workflow
      monitor.recordQuery('getProducts', 145, true, 20);
      monitor.recordQuery('getCategory', 87, true, 5);
      monitor.recordQuery('updateProduct', 234, true, 1);

      const stats = monitor.getQueryStats();
      expect(stats.totalQueries).toBe(3);
      expect(stats.successRate).toBe('100.0');
      expect(parseFloat(stats.avgDuration)).toBeLessThan(300);
    });

    test('tracks realistic API operations', () => {
      // Simulate API calls
      monitor.recordAPICall('/api/products', 'GET', 145, 200);
      monitor.recordAPICall('/api/products', 'POST', 312, 201);
      monitor.recordAPICall('/api/products/123', 'PUT', 267, 200);
      monitor.recordAPICall('/api/invalid', 'GET', 89, 404);

      const stats = monitor.getAPIStats();
      expect(stats.totalCalls).toBe(4);
      expect(stats.successRate).toBe('75.0'); // 3 successful, 1 not found
    });

    test('tracks error patterns', () => {
      // Simulate errors
      monitor.recordError('ValidationError', 10);
      monitor.recordError('ValidationError', 12);
      monitor.recordError('NetworkError', 1500);
      monitor.recordError('NetworkError', 1600);
      monitor.recordError('TimeoutError', 10000);

      const stats = monitor.getErrorStats();
      expect(stats.totalErrors).toBe(5);
      expect(stats.errorsByType.ValidationError).toBe(2);
      expect(stats.errorsByType.NetworkError).toBe(2);
      expect(stats.errorsByType.TimeoutError).toBe(1);
    });
  });
});
