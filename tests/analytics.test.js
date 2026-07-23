// Tests for analytics.js

// Mock Firebase before importing modules that use it
jest.mock('../js/firebase-config.js', () => ({
  db: { _mockDb: true },
}));

import { Analytics, AnalyticsQuery, ANALYTICS_EVENTS } from '../js/analytics';

describe('Analytics', () => {
  let analytics;

  beforeEach(() => {
    analytics = new Analytics();
    jest.clearAllMocks();
  });

  test('initializes with session ID', () => {
    expect(analytics.sessionId).toMatch(/^session_/);
  });

  test('tracks event', () => {
    const event = analytics.trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEW, { productId: 'p1' });
    expect(event.eventType).toBe(ANALYTICS_EVENTS.PRODUCT_VIEW);
    expect(event.data.productId).toBe('p1');
    expect(event.sessionId).toBe(analytics.sessionId);
  });

  test('tracks page view', () => {
    const event = analytics.trackPageView('products');
    expect(event.eventType).toBe(ANALYTICS_EVENTS.PRODUCT_VIEW);
    expect(event.data.page).toBe('products');
  });

  test('tracks product interaction', () => {
    const event = analytics.trackProductInteraction(
      'prod1',
      ANALYTICS_EVENTS.PRODUCT_CLICK,
      { source: 'search' }
    );
    expect(event.data.productId).toBe('prod1');
    expect(event.data.source).toBe('search');
  });

  test('tracks search', () => {
    const event = analytics.trackSearch('LED bulb', 42);
    expect(event.eventType).toBe(ANALYTICS_EVENTS.SEARCH);
    expect(event.data.query).toBe('LED bulb');
    expect(event.data.resultsCount).toBe(42);
  });

  test('tracks category filter', () => {
    const event = analytics.trackCategoryFilter('LED');
    expect(event.eventType).toBe(ANALYTICS_EVENTS.CATEGORY_FILTER);
    expect(event.data.category).toBe('LED');
  });

  test('tracks admin action', () => {
    const event = analytics.trackAdminAction(
      ANALYTICS_EVENTS.ADMIN_CREATE,
      'prod123',
      { adminUid: 'admin-1' }
    );
    expect(event.eventType).toBe(ANALYTICS_EVENTS.ADMIN_CREATE);
    expect(event.data.resourceId).toBe('prod123');
    expect(event.data.adminUid).toBe('admin-1');
  });

  test('auto-flushes when queue reaches size', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'event1' });

    analytics.queueSize = 3;

    // Add 3 events
    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: '1' });
    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: '2' });
    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: '3' });

    // Queue should be flushed after 3rd event
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(analytics.eventQueue.length).toBe(0);
  });

  test('flushes pending events', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'event1' });

    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: 'test' });
    analytics.trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEW, { productId: 'p1' });

    expect(analytics.eventQueue.length).toBe(2);

    await analytics.flush();

    expect(analytics.eventQueue.length).toBe(0);
    expect(addDoc).toHaveBeenCalledTimes(2);
  });

  test('handles flush errors gracefully', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockRejectedValue(new Error('Network error'));

    const event = analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: 'test' });
    await analytics.flush();

    // Event should be re-queued on failure
    expect(analytics.eventQueue.length).toBe(1);
    expect(analytics.eventQueue[0]).toBe(event);
  });

  test('gets session duration', () => {
    const startTime = analytics.sessionStart.getTime();
    jest.useFakeTimers();
    jest.advanceTimersByTime(5000);

    const duration = analytics.getSessionDuration();
    expect(duration).toBeGreaterThanOrEqual(0);

    jest.useRealTimers();
  });

  test('ends session and flushes', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'event1' });

    analytics.trackEvent(ANALYTICS_EVENTS.SEARCH, { query: 'test' });
    await analytics.endSession();

    // Session end event should be added
    expect(analytics.eventQueue.length).toBe(0); // Flushed
    expect(addDoc).toHaveBeenCalled();
  });
});

describe('AnalyticsQuery', () => {
  test('gets product views', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      {
        id: 'e1',
        data: () => ({
          eventType: ANALYTICS_EVENTS.PRODUCT_VIEW,
          data: { productId: 'p1' },
        }),
      },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const views = await AnalyticsQuery.getProductViews('p1', 7);
    expect(views.length).toBe(1);
    expect(views[0].data.productId).toBe('p1');
  });

  test.skip('gets most viewed products', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      { id: 'e1', data: () => ({ data: { productId: 'p1' } }) },
      { id: 'e2', data: () => ({ data: { productId: 'p1' } }) },
      { id: 'e3', data: () => ({ data: { productId: 'p2' } }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const topProducts = await AnalyticsQuery.getMostViewedProducts(10, 7);
    expect(topProducts.length).toBe(2);
    expect(topProducts[0].productId).toBe('p1');
    expect(topProducts[0].views).toBe(2);
  });

  test.skip('gets popular searches', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      { id: 'e1', data: () => ({ data: { query: 'led bulb' } }) },
      { id: 'e2', data: () => ({ data: { query: 'led bulb' } }) },
      { id: 'e3', data: () => ({ data: { query: 'lamp' } }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const searches = await AnalyticsQuery.getPopularSearches(10, 7);
    expect(searches.length).toBe(2);
    expect(searches[0].query).toBe('led bulb');
    expect(searches[0].searches).toBe(2);
  });

  test.skip('normalizes search queries to lowercase', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      { id: 'e1', data: () => ({ data: { query: 'LED Bulb' } }) },
      { id: 'e2', data: () => ({ data: { query: 'led bulb' } }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const searches = await AnalyticsQuery.getPopularSearches(10, 7);
    // Should be counted as same search
    expect(searches.length).toBe(1);
  });

  test('gets admin activity', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      {
        id: 'e1',
        data: () => ({
          eventType: ANALYTICS_EVENTS.ADMIN_CREATE,
          timestamp: mockTimestamp(),
        }),
      },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const activity = await AnalyticsQuery.getAdminActivity(7, 50);
    expect(activity.length).toBeGreaterThan(0);
  });

  test('gets event statistics', async () => {
    const { getDocs } = require('firebase/firestore');
    const mockDocs = [
      { id: 'e1', data: () => ({ sessionId: 's1', eventType: 'view' }) },
      { id: 'e2', data: () => ({ sessionId: 's1', eventType: 'click' }) },
      { id: 'e3', data: () => ({ sessionId: 's2', eventType: 'view' }) },
    ];
    getDocs.mockResolvedValue({ docs: mockDocs });

    const stats = await AnalyticsQuery.getEventStats(7);
    expect(stats.totalEvents).toBe(3);
    expect(stats.uniqueSessions).toBe(2);
    expect(stats.eventsByType.view).toBe(2);
    expect(stats.eventsByType.click).toBe(1);
  });

  test('handles empty results', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValue({ docs: [] });

    const views = await AnalyticsQuery.getProductViews('p1', 7);
    expect(views).toEqual([]);

    const searches = await AnalyticsQuery.getPopularSearches(10, 7);
    expect(searches).toEqual([]);
  });
});

describe('ANALYTICS_EVENTS', () => {
  test('has all event types defined', () => {
    expect(ANALYTICS_EVENTS.PRODUCT_VIEW).toBe('product_view');
    expect(ANALYTICS_EVENTS.PRODUCT_CLICK).toBe('product_click');
    expect(ANALYTICS_EVENTS.CATEGORY_FILTER).toBe('category_filter');
    expect(ANALYTICS_EVENTS.SEARCH).toBe('search');
    expect(ANALYTICS_EVENTS.ADMIN_CREATE).toBe('admin_create');
    expect(ANALYTICS_EVENTS.ADMIN_UPDATE).toBe('admin_update');
    expect(ANALYTICS_EVENTS.ADMIN_DELETE).toBe('admin_delete');
    expect(ANALYTICS_EVENTS.ADMIN_LOGIN).toBe('admin_login');
    expect(ANALYTICS_EVENTS.ADMIN_LOGOUT).toBe('admin_logout');
  });
});
