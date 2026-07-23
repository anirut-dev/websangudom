// ===== Product Analytics & Tracking =====
// Track product views, interactions, and performance metrics

import { db } from "./firebase-config.js";
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { ErrorHandler } from "./error-handler.js";

const ANALYTICS_COLLECTION = "analytics";
const EVENTS_COLLECTION = "analytics_events";

// ===== Event Types =====
export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW: "product_view",
  PRODUCT_CLICK: "product_click",
  CATEGORY_FILTER: "category_filter",
  SEARCH: "search",
  ADMIN_CREATE: "admin_create",
  ADMIN_UPDATE: "admin_update",
  ADMIN_DELETE: "admin_delete",
  ADMIN_LOGIN: "admin_login",
  ADMIN_LOGOUT: "admin_logout",
};

// ===== Analytics Manager =====
export class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
    this.eventQueue = [];
    this.queueSize = 10;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track event
  trackEvent(eventType, data = {}) {
    const event = {
      sessionId: this.sessionId,
      eventType,
      timestamp: Timestamp.now(),
      data,
      userAgent: navigator.userAgent,
      url: window.location.pathname,
      referrer: document.referrer,
    };

    this.eventQueue.push(event);

    // Auto-flush when queue reaches size
    if (this.eventQueue.length >= this.queueSize) {
      this.flush();
    }

    return event;
  }

  // Flush events to Firestore
  async flush() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const promises = eventsToSend.map(event =>
        addDoc(collection(db, EVENTS_COLLECTION), event)
      );

      await Promise.all(promises);
      console.log(`[Analytics] Flushed ${eventsToSend.length} events`);
    } catch (error) {
      // Re-add events if flush fails
      this.eventQueue.unshift(...eventsToSend);
      ErrorHandler.log(error, { operation: "analytics_flush" });
    }
  }

  // Track page view (auto-called)
  trackPageView(pageName) {
    return this.trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEW, {
      page: pageName,
      title: document.title,
    });
  }

  // Track product interaction
  trackProductInteraction(productId, eventType, metadata = {}) {
    return this.trackEvent(eventType, {
      productId,
      ...metadata,
    });
  }

  // Track search
  trackSearch(query, resultsCount) {
    return this.trackEvent(ANALYTICS_EVENTS.SEARCH, {
      query,
      resultsCount,
    });
  }

  // Track category filter
  trackCategoryFilter(category) {
    return this.trackEvent(ANALYTICS_EVENTS.CATEGORY_FILTER, {
      category,
    });
  }

  // Track admin action
  trackAdminAction(actionType, resourceId, metadata = {}) {
    return this.trackEvent(actionType, {
      resourceId,
      adminUid: metadata.adminUid,
      ...metadata,
    });
  }

  // Get session duration
  getSessionDuration() {
    return new Date() - this.sessionStart;
  }

  // End session and flush
  async endSession() {
    this.trackEvent("session_end", {
      duration: this.getSessionDuration(),
    });
    await this.flush();
  }
}

// ===== Analytics Query Helper =====
export class AnalyticsQuery {
  // Get product views
  static async getProductViews(productId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, EVENTS_COLLECTION),
        where("data.productId", "==", productId),
        where("eventType", "==", ANALYTICS_EVENTS.PRODUCT_VIEW),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc")
      );

      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    } catch (error) {
      ErrorHandler.log(error, { operation: "getProductViews", productId });
      return [];
    }
  }

  // Get most viewed products
  static async getMostViewedProducts(limit = 10, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, EVENTS_COLLECTION),
        where("eventType", "==", ANALYTICS_EVENTS.PRODUCT_VIEW),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc"),
        limit(1000)
      );

      const snap = await getDocs(q);
      const viewCounts = {};

      snap.docs.forEach(doc => {
        const productId = doc.data().data?.productId;
        if (productId) {
          viewCounts[productId] = (viewCounts[productId] || 0) + 1;
        }
      });
      return Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId, count]) => ({ productId, views: count }));
    } catch (error) {
      ErrorHandler.log(error, { operation: "getMostViewedProducts" });
      return [];
    }
  }

  // Get popular searches
  static async getPopularSearches(limit = 10, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, EVENTS_COLLECTION),
        where("eventType", "==", ANALYTICS_EVENTS.SEARCH),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc"),
        limit(1000)
      );

      const snap = await getDocs(q);
      const searchCounts = {};

      snap.docs.forEach(doc => {
        const searchQuery = doc.data().data?.query?.toLowerCase();
        if (searchQuery) {
          searchCounts[searchQuery] = (searchCounts[searchQuery] || 0) + 1;
        }
      });

      return Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, searches: count }));
    } catch (error) {
      ErrorHandler.log(error, { operation: "getPopularSearches" });
      return [];
    }
  }

  // Get admin activity
  static async getAdminActivity(days = 7, actionLimit = 50) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const actionTypes = [
        ANALYTICS_EVENTS.ADMIN_CREATE,
        ANALYTICS_EVENTS.ADMIN_UPDATE,
        ANALYTICS_EVENTS.ADMIN_DELETE,
      ];

      const promises = actionTypes.map(actionType =>
        getDocs(
          query(
            collection(db, EVENTS_COLLECTION),
            where("eventType", "==", actionType),
            where("timestamp", ">=", Timestamp.fromDate(startDate)),
            orderBy("timestamp", "desc"),
            limit(actionLimit)
          )
        )
      );

      const results = await Promise.all(promises);
      const allActivity = [];

      results.forEach(snap => {
        snap.docs.forEach(doc => {
          allActivity.push(doc.data());
        });
      });

      return allActivity.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      ErrorHandler.log(error, { operation: "getAdminActivity" });
      return [];
    }
  }

  // Get event statistics
  static async getEventStats(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, EVENTS_COLLECTION),
        where("timestamp", ">=", Timestamp.fromDate(startDate))
      );

      const snap = await getDocs(q);
      const stats = {
        totalEvents: 0,
        eventsByType: {},
        uniqueSessions: new Set(),
      };

      snap.docs.forEach(doc => {
        const data = doc.data();
        stats.totalEvents++;
        stats.eventsByType[data.eventType] = (stats.eventsByType[data.eventType] || 0) + 1;
        if (data.sessionId) stats.uniqueSessions.add(data.sessionId);
      });

      return {
        ...stats,
        uniqueSessions: stats.uniqueSessions.size,
      };
    } catch (error) {
      ErrorHandler.log(error, { operation: "getEventStats" });
      return { totalEvents: 0, eventsByType: {}, uniqueSessions: 0 };
    }
  }
}

// ===== Global Analytics Instance =====
export const globalAnalytics = new Analytics();

// Auto-flush on page unload
window.addEventListener("beforeunload", () => {
  globalAnalytics.endSession();
});

export default Analytics;
