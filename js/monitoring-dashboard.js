// ===== Monitoring Dashboard =====
// Real-time performance monitoring and alerting system

import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { ErrorHandler } from "./error-handler.js";
import { AnalyticsQuery } from "./analytics.js";

// ===== Performance Thresholds =====
export const PERFORMANCE_THRESHOLDS = {
  LOW_INVENTORY_WARNING: 10,
  LOW_INVENTORY_CRITICAL: 5,
  SLOW_RESPONSE_MS: 1000,
  ERROR_RATE_WARNING: 5, // percentage
  ERROR_RATE_CRITICAL: 10, // percentage
  CACHE_STALE_HOURS: 24,
};

// ===== Alert Types =====
export const ALERT_TYPES = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
  ERROR: "error",
};

// ===== Monitoring Dashboard =====
export class MonitoringDashboard {
  constructor() {
    this.alerts = [];
    this.metrics = {};
    this.lastUpdate = null;
  }

  // Add alert
  addAlert(type, title, message, data = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    return alert;
  }

  // Check for anomalies
  async checkAnomalies() {
    try {
      // Check error rates
      await this.checkErrorRates();

      // Check inventory
      await this.checkInventory();

      // Check performance
      await this.checkPerformance();

      // Check data quality
      await this.checkDataQuality();

      this.lastUpdate = new Date();
    } catch (error) {
      ErrorHandler.log(error, { operation: "checkAnomalies" });
    }
  }

  // Check error rates
  async checkErrorRates() {
    try {
      const stats = await AnalyticsQuery.getEventStats(1); // Last 1 day

      if (stats.totalEvents === 0) return;

      const errorEvents = stats.eventsByType["error"] || 0;
      const errorRate = (errorEvents / stats.totalEvents) * 100;

      if (errorRate >= PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL) {
        this.addAlert(
          ALERT_TYPES.CRITICAL,
          "🔴 Critical Error Rate",
          `Error rate is ${errorRate.toFixed(1)}% (critical threshold: ${PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL}%)`,
          { errorRate, threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_CRITICAL }
        );
      } else if (errorRate >= PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING) {
        this.addAlert(
          ALERT_TYPES.WARNING,
          "⚠️ High Error Rate",
          `Error rate is ${errorRate.toFixed(1)}% (warning threshold: ${PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING}%)`,
          { errorRate, threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING }
        );
      }
    } catch (error) {
      ErrorHandler.log(error, { operation: "checkErrorRates" });
    }
  }

  // Check inventory levels
  async checkInventory() {
    try {
      // This will be expanded in Phase 4 when inventory tracking is fully implemented
      this.addAlert(
        ALERT_TYPES.INFO,
        "📦 Inventory Check",
        "Inventory monitoring ready for Phase 4 implementation",
        { status: "pending" }
      );
    } catch (error) {
      ErrorHandler.log(error, { operation: "checkInventory" });
    }
  }

  // Check performance metrics
  async checkPerformance() {
    try {
      const dbLatency = this.getAverageLatency();

      if (dbLatency > PERFORMANCE_THRESHOLDS.SLOW_RESPONSE_MS) {
        this.addAlert(
          ALERT_TYPES.WARNING,
          "⏱️ Slow Response Time",
          `Database response time is ${dbLatency}ms (threshold: ${PERFORMANCE_THRESHOLDS.SLOW_RESPONSE_MS}ms)`,
          { latency: dbLatency, threshold: PERFORMANCE_THRESHOLDS.SLOW_RESPONSE_MS }
        );
      }

      this.metrics.averageLatency = dbLatency;
    } catch (error) {
      ErrorHandler.log(error, { operation: "checkPerformance" });
    }
  }

  // Check data quality
  async checkDataQuality() {
    try {
      // Check for products missing required fields
      const q = query(collection(db, "products"));
      const snap = await getDocs(q);

      const issues = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (!data.createdAt || !data.updatedAt) {
          issues.push(doc.id);
        }
      });

      if (issues.length > 0) {
        this.addAlert(
          ALERT_TYPES.WARNING,
          "🔍 Data Quality Issues",
          `${issues.length} products missing audit timestamps`,
          { affectedProducts: issues.length }
        );
      }

      this.metrics.dataQualityIssues = issues.length;
    } catch (error) {
      ErrorHandler.log(error, { operation: "checkDataQuality" });
    }
  }

  // Get average latency
  getAverageLatency() {
    // Placeholder: would track actual request times
    return Math.random() * 500; // Simulated latency
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts() {
    return this.alerts.filter(a => !a.acknowledged);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
    }
  }

  // Get critical alerts
  getCriticalAlerts() {
    return this.alerts.filter(a => a.type === ALERT_TYPES.CRITICAL && !a.acknowledged);
  }

  // Get alert summary
  getAlertSummary() {
    return {
      total: this.alerts.length,
      unacknowledged: this.getUnacknowledgedAlerts().length,
      critical: this.getCriticalAlerts().length,
      byType: {
        info: this.alerts.filter(a => a.type === ALERT_TYPES.INFO).length,
        warning: this.alerts.filter(a => a.type === ALERT_TYPES.WARNING).length,
        critical: this.alerts.filter(a => a.type === ALERT_TYPES.CRITICAL).length,
        error: this.alerts.filter(a => a.type === ALERT_TYPES.ERROR).length,
      },
    };
  }

  // Render monitoring dashboard
  renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const summary = this.getAlertSummary();
    const criticalAlerts = this.getCriticalAlerts();

    const html = `
      <div class="monitoring-dashboard">
        <div class="monitoring-header">
          <h2>🔍 System Monitoring</h2>
          <p class="last-update">최종 업데이트: ${this.lastUpdate?.toLocaleTimeString() || "Never"}</p>
        </div>

        <div class="alert-summary">
          <div class="summary-card info">
            <div class="summary-value">${summary.unacknowledged}</div>
            <div class="summary-label">Unacknowledged</div>
          </div>
          <div class="summary-card ${criticalAlerts.length > 0 ? 'critical' : ''}">
            <div class="summary-value">${summary.critical}</div>
            <div class="summary-label">Critical</div>
          </div>
          <div class="summary-card warning">
            <div class="summary-value">${summary.byType.warning}</div>
            <div class="summary-label">Warnings</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${summary.total}</div>
            <div class="summary-label">Total Alerts</div>
          </div>
        </div>

        ${criticalAlerts.length > 0 ? `
          <div class="critical-alerts">
            <h3>🚨 Critical Alerts</h3>
            ${criticalAlerts.map(alert => this.renderAlert(alert)).join('')}
          </div>
        ` : ''}

        <div class="recent-alerts">
          <h3>Recent Alerts</h3>
          ${this.alerts.slice(-5).reverse().map(alert => this.renderAlert(alert)).join('')}
        </div>

        <div class="performance-metrics">
          <h3>Performance Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Avg Latency</div>
              <div class="metric-value">${this.metrics.averageLatency?.toFixed(0) || 0}ms</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Data Quality Issues</div>
              <div class="metric-value">${this.metrics.dataQualityIssues || 0}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Last Update</div>
              <div class="metric-value">${this.lastUpdate ? this.lastUpdate.toLocaleTimeString() : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll(".alert-acknowledge").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const alertId = e.target.dataset.alertId;
        this.acknowledgeAlert(alertId);
        this.renderDashboard(containerId);
      });
    });
  }

  // Render single alert
  renderAlert(alert) {
    const alertClass = alert.type.toLowerCase();
    return `
      <div class="alert alert-${alertClass}" data-alert-id="${alert.id}">
        <div class="alert-header">
          <strong>${alert.title}</strong>
          <span class="alert-time">${alert.timestamp.toLocaleTimeString()}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
        ${!alert.acknowledged ? `
          <button class="alert-acknowledge" data-alert-id="${alert.id}">Acknowledge</button>
        ` : `
          <span class="alert-acknowledged">✓ Acknowledged</span>
        `}
      </div>
    `;
  }
}

// ===== Monitoring Dashboard Styles =====
export function initMonitoringStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .monitoring-dashboard {
      background: var(--dark-card, #1a1815);
      border: 1px solid var(--border, #3a3530);
      border-radius: var(--radius, 8px);
      padding: 24px;
      margin-bottom: 32px;
    }

    .monitoring-header {
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border, #3a3530);
      padding-bottom: 12px;
    }

    .monitoring-header h2 {
      margin: 0 0 8px 0;
      font-size: 1.4rem;
      color: var(--white, #faf7f0);
    }

    .last-update {
      margin: 0;
      font-size: 0.85rem;
      color: var(--gray, #8f846f);
    }

    .alert-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: var(--dark-3, #2a261f);
      border: 1px solid var(--border, #3a3530);
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      transition: border-color 0.2s;
    }

    .summary-card.critical {
      border-color: #ff4444;
    }

    .summary-card.warning {
      border-color: #ffaa44;
    }

    .summary-card.info {
      border-color: var(--gold, #d8b66a);
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gold, #d8b66a);
      font-variant-numeric: tabular-nums;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--gray, #8f846f);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .critical-alerts, .recent-alerts {
      margin-bottom: 24px;
    }

    .critical-alerts h3, .recent-alerts h3, .performance-metrics h3 {
      font-size: 1rem;
      margin: 0 0 12px 0;
      color: var(--white, #faf7f0);
    }

    .alert {
      background: var(--dark-3, #2a261f);
      border-left: 4px solid var(--gold, #d8b66a);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .alert-info {
      border-left-color: #4488ff;
    }

    .alert-warning {
      border-left-color: #ffaa44;
    }

    .alert-critical {
      border-left-color: #ff4444;
    }

    .alert-error {
      border-left-color: #ff6666;
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: var(--white, #faf7f0);
    }

    .alert-time {
      font-size: 0.8rem;
      color: var(--gray, #8f846f);
    }

    .alert-message {
      color: var(--gray-light, #b8ad98);
      margin-bottom: 8px;
    }

    .alert-acknowledge {
      background: var(--gold, #d8b66a);
      color: var(--dark, #0d0c0a);
      border: none;
      padding: 4px 12px;
      font-size: 0.8rem;
      border-radius: 3px;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    .alert-acknowledge:hover {
      opacity: 0.85;
    }

    .alert-acknowledged {
      color: #44aa44;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }

    .metric-card {
      background: var(--dark-3, #2a261f);
      border: 1px solid var(--border, #3a3530);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }

    .metric-label {
      font-size: 0.8rem;
      color: var(--gray, #8f846f);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--gold, #d8b66a);
      font-variant-numeric: tabular-nums;
    }
  `;
  document.head.appendChild(style);
}

export default MonitoringDashboard;
