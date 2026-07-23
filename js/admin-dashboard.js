// ===== Admin Dashboard =====
// Statistics, analytics, and bulk operations

import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { ProductRepository, PRODUCT_STATUS } from "./product-repository.js";
import { ErrorHandler } from "./error-handler.js";

export class AdminDashboard {
  constructor() {
    this.stats = {
      total: 0,
      active: 0,
      archived: 0,
      draft: 0,
      byCategory: {},
    };
  }

  // Load dashboard statistics
  async loadStats() {
    try {
      const activeCount = await ProductRepository.getCountByStatus(PRODUCT_STATUS.ACTIVE);
      const archivedCount = await ProductRepository.getCountByStatus(PRODUCT_STATUS.ARCHIVED);
      const draftCount = await ProductRepository.getCountByStatus(PRODUCT_STATUS.DRAFT);

      this.stats.active = activeCount;
      this.stats.archived = archivedCount;
      this.stats.draft = draftCount;
      this.stats.total = activeCount + archivedCount + draftCount;

      // Get counts by category
      const allProducts = await ProductRepository.getActive(10000);
      this.stats.byCategory = {};
      allProducts.forEach(product => {
        if (!this.stats.byCategory[product.category]) {
          this.stats.byCategory[product.category] = 0;
        }
        this.stats.byCategory[product.category]++;
      });

      return this.stats;
    } catch (error) {
      ErrorHandler.log(error, { operation: "loadStats" });
      throw error;
    }
  }

  // Render statistics cards
  renderStats(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${this.stats.total}</div>
          <div class="stat-label">รวมทั้งหมด</div>
          <div class="stat-breakdown">
            <span>✓ ${this.stats.active} ใช้งาน</span>
            <span>📦 ${this.stats.draft} ร่าง</span>
            <span>🗂️ ${this.stats.archived} เก็บถาวร</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${this.stats.active}</div>
          <div class="stat-label">สินค้าที่ใช้งาน</div>
          <div class="stat-progress">
            <div class="progress-bar" style="width: ${(this.stats.active / this.stats.total * 100) || 0}%"></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${Object.keys(this.stats.byCategory).length}</div>
          <div class="stat-label">หมวดหมู่</div>
          <div class="stat-breakdown">
            ${Object.entries(this.stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([cat, count]) => `<span>${cat}: ${count}</span>`)
              .join("")}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Get products by status for bulk operations
  async getProductsByStatus(status) {
    try {
      return await ProductRepository.getByStatus(status);
    } catch (error) {
      ErrorHandler.log(error, { operation: "getProductsByStatus", status });
      throw error;
    }
  }

  // Archive multiple products
  async archiveMultiple(productIds) {
    try {
      await ProductRepository.updateStatus(productIds, PRODUCT_STATUS.ARCHIVED);
      return { success: true, count: productIds.length };
    } catch (error) {
      ErrorHandler.log(error, { operation: "archiveMultiple" });
      throw error;
    }
  }

  // Restore multiple products
  async restoreMultiple(productIds) {
    try {
      await ProductRepository.updateStatus(productIds, PRODUCT_STATUS.ACTIVE);
      return { success: true, count: productIds.length };
    } catch (error) {
      ErrorHandler.log(error, { operation: "restoreMultiple" });
      throw error;
    }
  }

  // Get recent activity (placeholder for Phase 4)
  async getRecentActivity(limit = 20) {
    try {
      const auditRef = collection(db, "audit_logs");
      const q = query(auditRef, where("collection", "==", "products"));
      const snap = await getDocs(q);

      const logs = snap.docs
        .map(doc => doc.data())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return logs;
    } catch (error) {
      ErrorHandler.log(error, { operation: "getRecentActivity" });
      return [];
    }
  }

  // Get inventory report
  getInventoryReport() {
    const lowStock = [];
    const outOfStock = [];

    // This would be expanded in Phase 4
    return {
      lowStock,
      outOfStock,
      total: this.stats.total,
    };
  }
}

// Render dashboard CSS
export function initDashboardStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--dark-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      transition: border-color 0.3s, transform 0.3s;
    }

    .stat-card:hover {
      border-color: var(--gold);
      transform: translateY(-2px);
    }

    .stat-value {
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--gold);
      margin-bottom: 8px;
      font-variant-numeric: tabular-nums;
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--gray);
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .stat-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--gray-light);
    }

    .stat-breakdown span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-progress {
      height: 4px;
      background: var(--dark-3);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--gold), var(--gold-light));
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    @media (max-width: 680px) {
      .dashboard-stats {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

export default AdminDashboard;
