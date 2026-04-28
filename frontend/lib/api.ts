const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Timeout per request — 30s to tolerate slow connections
const REQUEST_TIMEOUT_MS = 30_000;
// Retries for network-level failures (not 4xx/5xx)
const MAX_RETRIES = 2;

type AuthHelpers = {
    getToken: () => string | null;
    refreshToken: () => Promise<string | null>;
};

let authHelpers: AuthHelpers = {
    getToken: () => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("evalis_access_token");
        }
        return null;
    },
    refreshToken: async () => null,
};

function isNetworkError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || err.name === "AbortError";
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
        if ((err as any)?.name === "AbortError") {
            throw new Error("Request timed out. Check your connection and try again.");
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

class ApiClient {
    setAuthHelpers(helpers: AuthHelpers) {
        authHelpers = helpers;
    }
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];

    private onRefreshed(token: string) {
        this.refreshSubscribers.map((cb) => cb(token));
        this.refreshSubscribers = [];
    }

    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {},
        attempt = 0
    ): Promise<T> {
        const token = authHelpers.getToken();

        let res: Response;
        try {
            res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
                ...options,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && endpoint !== "/api/v1/auth/refresh" ? { Authorization: `Bearer ${token}` } : {}),
                    ...options.headers,
                },
            });
        } catch (err) {
            // Retry on network errors (dropped connection, timeout)
            if (isNetworkError(err) && attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                return this.request<T>(endpoint, options, attempt + 1);
            }
            throw err;
        }

        if (res.status === 401) {
            if (endpoint === "/api/v1/auth/refresh") {
                throw new Error("Session expired. Please log in again.");
            }

            if (!this.isRefreshing) {
                this.isRefreshing = true;
                try {
                    const newToken = await authHelpers.refreshToken();
                    if (newToken) {
                        this.isRefreshing = false;
                        this.onRefreshed(newToken);
                    } else {
                        throw new Error("Refresh failed");
                    }
                } catch (err) {
                    this.isRefreshing = false;
                    this.refreshSubscribers = [];
                    throw err;
                }
            }

            return new Promise((resolve, reject) => {
                this.refreshSubscribers.push(async (newToken: string) => {
                    try {
                        const retryRes = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
                            ...options,
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${newToken}`,
                                ...options.headers,
                            },
                        });
                        if (!retryRes.ok) {
                            const err = await retryRes.json().catch(() => ({ error: "Request failed" }));
                            return reject(new Error(err.error || `HTTP ${retryRes.status}`));
                        }
                        resolve(retryRes.json());
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Request failed" }));
            const message = err.details || err.error || `HTTP ${res.status}`;
            throw new Error(message);
        }

        return res.json();
    }

    get<T = any>(endpoint: string) {
        return this.request<T>(endpoint, { method: "GET" });
    }

    post<T = any>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    put<T = any>(endpoint: string, body?: any) {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    delete<T = any>(endpoint: string) {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
        const token = authHelpers.getToken();

        const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
            method: "POST",
            credentials: "include",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (res.status === 401) {
            const newToken = await authHelpers.refreshToken();
            if (newToken) {
                const retryRes = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${newToken}`,
                    },
                    body: formData,
                });
                if (!retryRes.ok) {
                    const err = await retryRes.json().catch(() => ({ error: "Upload failed" }));
                    throw new Error(err.error || `HTTP ${retryRes.status}`);
                }
                return retryRes.json();
            }
            throw new Error("Session expired. Please log in again.");
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Upload failed" }));
            throw new Error(err.details || err.error || `HTTP ${res.status}`);
        }

        return res.json();
    }
}

export const api = new ApiClient();