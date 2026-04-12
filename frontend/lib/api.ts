const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AuthHelpers = {
    getToken: () => string | null;
    refreshToken: () => Promise<string | null>;
};

let authHelpers: AuthHelpers = {
    getToken: () => null,
    refreshToken: async () => null,
};
class ApiClient {
    setAuthHelpers(helpers: AuthHelpers) {
        authHelpers = helpers;
    }

    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = authHelpers.getToken();

        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        if (res.status === 401) {
            const newToken = await authHelpers.refreshToken();
            if (newToken) {
                const retryRes = await fetch(`${API_BASE}${endpoint}`, {
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
                    throw new Error(err.error || `HTTP ${retryRes.status}`);
                }
                return retryRes.json();
            }
            throw new Error("Session expired. Please log in again.");
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Request failed" }));
            throw new Error(err.error || `HTTP ${res.status}`);
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
}

export const api = new ApiClient();