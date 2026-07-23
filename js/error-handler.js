// ===== Error Handling & Recovery =====
// Centralized error handling with user-friendly messages and logging

export class AppError extends Error {
  constructor(message, code = "UNKNOWN_ERROR", originalError = null) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// ===== Error Type Mapping =====
const ERROR_MESSAGES = {
  // Firebase errors
  "permission-denied": {
    user: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    action: "Contact admin",
    code: "PERMISSION_DENIED",
  },
  "not-found": {
    user: "ไม่พบข้อมูลที่ขอ",
    action: "Refresh page",
    code: "NOT_FOUND",
  },
  "already-exists": {
    user: "ข้อมูลนี้มีอยู่แล้ว",
    action: "Use different value",
    code: "ALREADY_EXISTS",
  },
  "failed-precondition": {
    user: "ไม่สามารถดำเนินการได้ ลองใหม่",
    action: "Refresh page",
    code: "FAILED_PRECONDITION",
  },
  "aborted": {
    user: "ดำเนินการขัดข้อง ลองใหม่",
    action: "Retry",
    code: "ABORTED",
  },
  "unauthenticated": {
    user: "กรุณาเข้าสู่ระบบ",
    action: "Login",
    code: "UNAUTHENTICATED",
  },
  "invalid-argument": {
    user: "ข้อมูลไม่ถูกต้อง",
    action: "Check input",
    code: "INVALID_ARGUMENT",
  },
  "resource-exhausted": {
    user: "ขอบเขตการใช้งานเต็มแล้ว",
    action: "Try later",
    code: "RESOURCE_EXHAUSTED",
  },
  "unavailable": {
    user: "บริการไม่พร้อมใช้งาน ลองใหม่",
    action: "Retry",
    code: "UNAVAILABLE",
  },
  "deadline-exceeded": {
    user: "ใช้เวลานานเกินไป ลองใหม่",
    action: "Retry",
    code: "DEADLINE_EXCEEDED",
  },
  "internal": {
    user: "เกิดข้อผิดพลาด ลองใหม่",
    action: "Retry",
    code: "INTERNAL_ERROR",
  },
};

// ===== Error Handler =====
export class ErrorHandler {
  static parse(error) {
    if (error instanceof AppError) {
      return error;
    }

    // Firebase errors
    if (error.code) {
      const mapped = ERROR_MESSAGES[error.code];
      if (mapped) {
        return new AppError(mapped.user, mapped.code, error);
      }
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new AppError(
        "ไม่สามารถเชื่อมต่อ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
        "NETWORK_ERROR",
        error
      );
    }

    // Timeout errors
    if (error.message && error.message.includes("Timeout")) {
      return new AppError(
        "หมดเวลา ลองใหม่",
        "TIMEOUT_ERROR",
        error
      );
    }

    // Generic error
    return new AppError(
      "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      "UNKNOWN_ERROR",
      error
    );
  }

  static log(error, context = {}) {
    const parsed = this.parse(error);
    console.error("[AppError]", {
      message: parsed.message,
      code: parsed.code,
      context,
      timestamp: parsed.timestamp,
      original: parsed.originalError,
    });
    return parsed;
  }

  static show(error, context = {}) {
    const parsed = this.log(error, context);
    alert(parsed.message);
    return parsed;
  }

  static showWithRetry(error, context = {}, retryCallback = null) {
    const parsed = this.log(error, context);
    const retry = retryCallback && confirm(`${parsed.message}\n\nลองใหม่?`);
    if (retry) retryCallback();
    return parsed;
  }
}

// ===== Async Timeout Wrapper =====
export function withTimeout(promise, timeoutMs = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new AppError("ใช้เวลานานเกินไป ลองใหม่", "TIMEOUT_ERROR")),
        timeoutMs
      )
    ),
  ]);
}

// ===== Retry Wrapper =====
export async function withRetry(
  fn,
  maxAttempts = 3,
  delayMs = 1000,
  backoffMultiplier = 2
) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new AppError(
    "ดำเนินการไม่สำเร็จ ลองใหม่",
    "MAX_RETRIES_EXCEEDED",
    lastError
  );
}

// ===== Circuit Breaker =====
export class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeoutMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failureCount = 0;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new AppError(
          "บริการกำลังฟื้นตัว ลองใหม่ในอีกสักครู่",
          "CIRCUIT_BREAKER_OPEN"
        );
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.reset();
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.lastFailureTime = null;
  }
}

export default {
  AppError,
  ErrorHandler,
  withTimeout,
  withRetry,
  CircuitBreaker,
};
