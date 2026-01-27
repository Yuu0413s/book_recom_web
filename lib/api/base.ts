// 共通フェッチユーティリティ（リトライ機能付き）

export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    headers = {},
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'book_recom_web/1.0',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
}
