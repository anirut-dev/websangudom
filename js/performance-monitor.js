// ===== Performance Monitor =====
// Track and analyze database and application performance

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      pageLoads: [],
      apiCalls: [],
      errors: [],
    };
    this.pageLoadStart = performance.now();
  }

  // Record database query
  recordQuery(operationName, duration, success = true, rowsAffected = 0) {
    const query = {
      operation: operationName,
      duration,
      success,
      rowsAffected,
      timestamp: new Date(),
    };

    this.metrics.queries.push(query);
    this.logSlowQuery(query);

    // Keep last 100 queries
    if (this.metrics.queries.length > 100) {
      this.metrics.queries.shift();
    }

    return query;
  }

  // Record API call
  recordAPICall(endpoint, method, duration, statusCode) {
    const call = {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
    };

    this.metrics.apiCalls.push(call);

    // Keep last 100 calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }

    return call;
  }

  // Record error
  recordError(errorName, duration, context = {}) {
    const error = {
      error: errorName,
      duration,
      context,
      timestamp: new Date(),
    };

    this.metrics.errors.push(error);

    // Keep last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    return error;
  }

  // Log slow queries (> 1000ms)
  logSlowQuery(query) {
    if (query.duration > 1000) {
      console.warn(`[Performance] Slow query: ${query.operation} took ${query.duration}ms`);
    }
  }

  // Get query statistics
  getQueryStats() {
    if (this.metrics.queries.length === 0) {
      return { avgDuration: 0, minDuration: 0, maxDuration: 0, successRate: 0 };
    }

    const durations = this.metrics.queries.map(q => q.duration);
    const successful = this.metrics.queries.filter(q => q.success).length;

    return {
      totalQueries: this.metrics.queries.length,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: ((successful / this.metrics.queries.length) * 100).toFixed(1),
      slowQueries: this.metrics.queries.filter(q => q.duration > 1000).length,
    };
  }

  // Get API call statistics
  getAPIStats() {
    if (this.metrics.apiCalls.length === 0) {
      return { avgDuration: 0, successRate: 0 };
    }

    const durations = this.metrics.apiCalls.map(c => c.duration);
    const successful = this.metrics.apiCalls.filter(c => c.statusCode < 400).length;

    return {
      totalCalls: this.metrics.apiCalls.length,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      successRate: ((successful / this.metrics.apiCalls.length) * 100).toFixed(1),
    };
  }

  // Get error statistics
  getErrorStats() {
    const errorsByType = {};

    this.metrics.errors.forEach(err => {
      errorsByType[err.error] = (errorsByType[err.error] || 0) + 1;
    });

    return {
      totalErrors: this.metrics.errors.length,
      errorsByType,
      recentErrors: this.metrics.errors.slice(-10),
    };
  }

  // Get page load time
  getPageLoadTime() {
    if (document.readyState === "complete") {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      return pageLoadTime;
    }
    return null;
  }

  // Get memory usage (if available)
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + " MB",
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + " MB",
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + " MB",
      };
    }
    return null;
  }

  // Get resource timing
  getResourceTiming() {
    const resources = performance.getEntriesByType("resource");
    const timing = {
      totalResources: resources.length,
      byType: {},
      slowResources: [],
    };

    resources.forEach(resource => {
      const type = resource.initiatorType;
      if (!timing.byType[type]) {
        timing.byType[type] = { count: 0, totalDuration: 0 };
      }
      timing.byType[type].count++;
      timing.byType[type].totalDuration += resource.duration;

      if (resource.duration > 1000) {
        timing.slowResources.push({
          name: resource.name,
          duration: resource.duration,
        });
      }
    });

    return timing;
  }

  // Generate performance report
  generateReport() {
    return {
      timestamp: new Date(),
      queries: this.getQueryStats(),
      api: this.getAPIStats(),
      errors: this.getErrorStats(),
      pageLoad: this.getPageLoadTime(),
      memory: this.getMemoryUsage(),
      resources: this.getResourceTiming(),
    };
  }

  // Export metrics as JSON
  exportMetrics() {
    return {
      timestamp: new Date(),
      metrics: this.metrics,
      report: this.generateReport(),
    };
  }

  // Render performance dashboard
  renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const queryStats = this.getQueryStats();
    const apiStats = this.getAPIStats();
    const errorStats = this.getErrorStats();
    const memory = this.getMemoryUsage();
    const pageLoad = this.getPageLoadTime();

    const html = `
      <div class="performance-monitor">
        <h3>⚡ Performance Monitor</h3>

        <div class="perf-grid">
          <div class="perf-card">
            <div class="perf-title">Queries</div>
            <div class="perf-stat">
              <div class="perf-value">${queryStats.totalQueries}</div>
              <div class="perf-label">Total</div>
            </div>
            <div class="perf-detail">
              <span>Avg: ${queryStats.avgDuration}ms</span>
              <span>Success: ${queryStats.successRate}%</span>
              <span>Slow: ${queryStats.slowQueries}</span>
            </div>
          </div>

          <div class="perf-card">
            <div class="perf-title">API Calls</div>
            <div class="perf-stat">
              <div class="perf-value">${apiStats.totalCalls}</div>
              <div class="perf-label">Total</div>
            </div>
            <div class="perf-detail">
              <span>Avg: ${apiStats.avgDuration}ms</span>
              <span>Success: ${apiStats.successRate}%</span>
            </div>
          </div>

          <div class="perf-card">
            <div class="perf-title">Errors</div>
            <div class="perf-stat">
              <div class="perf-value">${errorStats.totalErrors}</div>
              <div class="perf-label">Total</div>
            </div>
            <div class="perf-detail">
              ${Object.entries(errorStats.errorsByType)
                .map(([type, count]) => `<span>${type}: ${count}</span>`)
                .join("")}
            </div>
          </div>

          ${memory ? `
            <div class="perf-card">
              <div class="perf-title">Memory</div>
              <div class="perf-detail">
                <span>Used: ${memory.usedJSHeapSize}</span>
                <span>Total: ${memory.totalJSHeapSize}</span>
              </div>
            </div>
          ` : ""}

          ${pageLoad ? `
            <div class="perf-card">
              <div class="perf-title">Page Load</div>
              <div class="perf-stat">
                <div class="perf-value">${(pageLoad / 1000).toFixed(2)}s</div>
                <div class="perf-label">Load Time</div>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}

// ===== Timing Decorator =====
export function measurePerformance(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args) {
    const startTime = performance.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - startTime;
      globalPerformanceMonitor.recordQuery(propertyKey, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      globalPerformanceMonitor.recordError(error.name, duration);
      throw error;
    }
  };

  return descriptor;
}

// ===== Global Performance Monitor Instance =====
export const globalPerformanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;
