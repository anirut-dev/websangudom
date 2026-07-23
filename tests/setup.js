// Test Setup and Configuration

// Mock browser APIs
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.navigator = {
  userAgent: 'Mozilla/5.0 (Test)',
};

// Mock window object
global.window = {
  location: {
    pathname: '/test',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock document object
global.document = {
  title: 'Test Page',
  referrer: 'http://test.com',
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
  })),
  head: {
    appendChild: jest.fn(),
  },
  body: {
    style: {},
  },
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  getEntriesByType: jest.fn(() => []),
  timing: {
    navigationStart: 0,
    loadEventEnd: 1000,
  },
  memory: {
    usedJSHeapSize: 10485760, // 10MB
    totalJSHeapSize: 20971520, // 20MB
    jsHeapSizeLimit: 2147483648, // 2GB
  },
};

// Suppress console errors in tests unless explicitly testing error output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Utility function for creating mock Timestamp
global.mockTimestamp = (date = new Date()) => ({
  toDate: () => date,
  getTime: () => date.getTime(),
  _seconds: Math.floor(date.getTime() / 1000),
  _nanoseconds: 0,
});

// Utility function for creating mock DocumentSnapshot
global.mockDocSnapshot = (id, data, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
  get: (field) => data[field],
});
