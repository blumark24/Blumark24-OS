// ─── Async utility helpers ────────────────────────────────────────────────────

/**
 * Race a promise against a timeout.
 * If the operation resolves/rejects before the timeout, the result is used.
 * If it exceeds `ms`, rejects with a readable Arabic error.
 */
export function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  ms: number,
  message = "انتهت مهلة الاتصال — يرجى المحاولة مرة أخرى",
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

/**
 * Race a promise against a timeout that RESOLVES (not rejects) on expiry.
 * Use this for post-operation tasks like refetch() — we don't want
 * a slow/stuck refetch to block the save operation.
 */
export function withSoftTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  ms: number,
): Promise<T | undefined> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/**
 * fetch() wrapper with AbortController-based timeout.
 * Throws if the request takes longer than `ms`.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`انتهت مهلة الطلب (${ms / 1000} ثانية) — تحقق من اتصال الإنترنت`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Standardised try/catch/finally wrapper.
 * Ensures loading is always reset even if the operation throws.
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  handlers: {
    onSuccess?: (data: T) => void;
    onError?: (err: Error) => void;
    onFinally?: () => void;
  } = {},
): Promise<T | undefined> {
  try {
    const result = await operation();
    handlers.onSuccess?.(result);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    handlers.onError?.(error);
    return undefined;
  } finally {
    handlers.onFinally?.();
  }
}
