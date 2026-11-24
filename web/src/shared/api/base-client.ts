export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal;
  integrity?: string;
  keepalive?: boolean;
  window?: null;
}

export interface ClientOptions {
  treat404AsNull?: boolean;
}

export async function client<T>(
  endpoint: string,
  config: RequestConfig = {},
  options: ClientOptions = {},
): Promise<T> {
  const {
    params,
    body,
    headers: customHeaders,
    method,
    cache,
    credentials,
    mode,
    redirect,
    referrer,
    referrerPolicy,
    signal,
    integrity,
    keepalive,
    window: _window,
  } = config;
  const { treat404AsNull = false } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const fetchConfig: RequestInit = {
    method,
    headers,
    cache,
    credentials,
    mode,
    redirect,
    referrer,
    referrerPolicy,
    signal,
    integrity,
    keepalive,
  };

  if (body !== undefined) {
    fetchConfig.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchConfig);

  if (res.status === 404 && treat404AsNull) {
    return null as T;
  }

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // JSON parse failed, use default error message
    }
    throw new ApiError(errorMessage, res.status, res.statusText, url);
  }

  return res.json() as Promise<T>;
}
