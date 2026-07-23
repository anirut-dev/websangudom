// Tests for error-handler.js

import {
  AppError,
  ErrorHandler,
  withTimeout,
  withRetry,
  CircuitBreaker,
} from '../js/error-handler';

describe('AppError', () => {
  test('creates error with message and code', () => {
    const error = new AppError('Test error', 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  test('includes original error', () => {
    const original = new Error('Original');
    const error = new AppError('Wrapped', 'WRAPPED', original);
    expect(error.originalError).toBe(original);
  });

  test('converts to JSON', () => {
    const error = new AppError('Test', 'TEST');
    const json = error.toJSON();
    expect(json.message).toBe('Test');
    expect(json.code).toBe('TEST');
    expect(json.timestamp).toBeInstanceOf(String);
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  test('parses AppError as-is', () => {
    const appError = new AppError('Test', 'TEST');
    const parsed = ErrorHandler.parse(appError);
    expect(parsed).toBe(appError);
  });

  test('converts Firebase errors to AppError', () => {
    const firebaseError = new Error('Test');
    firebaseError.code = 'permission-denied';
    const parsed = ErrorHandler.parse(firebaseError);
    expect(parsed).toBeInstanceOf(AppError);
    expect(parsed.code).toBe('PERMISSION_DENIED');
  });

  test('converts network errors', () => {
    const networkError = new TypeError('fetch failed');
    const parsed = ErrorHandler.parse(networkError);
    expect(parsed.code).toBe('NETWORK_ERROR');
  });

  test('converts timeout errors', () => {
    const timeoutError = new Error('Timeout error');
    const parsed = ErrorHandler.parse(timeoutError);
    expect(parsed.code).toBe('TIMEOUT_ERROR');
  });

  test('logs error with context', () => {
    const error = new Error('Test');
    ErrorHandler.log(error, { operation: 'testOp' });
    expect(console.error).toHaveBeenCalled();
  });

  test('showWithRetry calls callback on confirmation', () => {
    const callback = jest.fn();
    global.confirm = jest.fn(() => true);
    const error = new Error('Test');

    ErrorHandler.showWithRetry(error, {}, callback);
    expect(callback).toHaveBeenCalled();
  });

  test('showWithRetry skips callback on rejection', () => {
    const callback = jest.fn();
    global.confirm = jest.fn(() => false);
    const error = new Error('Test');

    ErrorHandler.showWithRetry(error, {}, callback);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('withTimeout', () => {
  jest.useFakeTimers();

  test('resolves within timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 1000);
    expect(result).toBe('success');
  });

  test('rejects on timeout', async () => {
    const promise = new Promise(() => {}); // Never resolves
    const timeoutPromise = withTimeout(promise, 100);

    jest.advanceTimersByTime(100);

    await expect(timeoutPromise).rejects.toThrow('นานเกินไป');
  });

  test('uses default timeout', async () => {
    const promise = new Promise(() => {}); // Never resolves
    const timeoutPromise = withTimeout(promise);

    jest.advanceTimersByTime(10000);

    await expect(timeoutPromise).rejects.toThrow();
  });

  jest.useRealTimers();
});

describe('withRetry', () => {
  test('succeeds on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries on failure and succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, 3, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('gives up after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Always fails'));
    await expect(withRetry(fn, 2, 10)).rejects.toThrow('MAX_RETRIES_EXCEEDED');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('uses exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('success');

    jest.useFakeTimers();
    const promise = withRetry(fn, 3, 100, 2); // delay: 100, backoff: 2

    // First call immediately
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance past first delay (100ms)
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2);

    // Advance past second delay (200ms)
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });
});

describe('CircuitBreaker', () => {
  test('initializes in CLOSED state', () => {
    const breaker = new CircuitBreaker();
    expect(breaker.state).toBe('CLOSED');
  });

  test('succeeds when CLOSED', async () => {
    const breaker = new CircuitBreaker();
    const fn = jest.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);
    expect(result).toBe('success');
  });

  test('opens after threshold failures', async () => {
    const breaker = new CircuitBreaker(2, 1000); // threshold: 2, resetTimeout: 1000ms
    const fn = jest.fn().mockRejectedValue(new Error('Fail'));

    // First failure
    await expect(breaker.execute(fn)).rejects.toThrow();
    expect(breaker.failureCount).toBe(1);
    expect(breaker.state).toBe('CLOSED');

    // Second failure - should open
    await expect(breaker.execute(fn)).rejects.toThrow();
    expect(breaker.failureCount).toBe(2);
    expect(breaker.state).toBe('OPEN');
  });

  test('rejects when OPEN', async () => {
    const breaker = new CircuitBreaker(1, 1000);
    const fn = jest.fn();

    // Make it open
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');

    // Next call should reject immediately
    await expect(breaker.execute(fn)).rejects.toThrow('CIRCUIT_BREAKER_OPEN');
    expect(fn).not.toHaveBeenCalled();
  });

  test('transitions to HALF_OPEN after timeout', async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker(1, 1000);

    // Open the breaker
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');

    // Advance time past reset timeout
    jest.advanceTimersByTime(1001);

    // Try to execute - should transition to HALF_OPEN and execute
    const fn = jest.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);
    expect(result).toBe('success');
    expect(breaker.state).toBe('CLOSED');

    jest.useRealTimers();
  });

  test('resets on successful HALF_OPEN execution', async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker(1, 1000);

    // Open the breaker
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    expect(breaker.state).toBe('OPEN');
    expect(breaker.failureCount).toBe(1);

    // Wait for reset timeout
    jest.advanceTimersByTime(1001);

    // Successful execution in HALF_OPEN
    const fn = jest.fn().mockResolvedValue('success');
    await breaker.execute(fn);

    // Should be CLOSED and reset
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(0);

    jest.useRealTimers();
  });
});
