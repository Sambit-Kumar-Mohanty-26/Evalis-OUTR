"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface User {
    id: string;
    fullName: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    tenantId: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("evalis_access_token");
        const storedUser = localStorage.getItem("evalis_user");
        if (stored && storedUser) {
            setAccessToken(stored);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Refresh failed");
            const data = await res.json();
            setAccessToken(data.accessToken);
            localStorage.setItem("evalis_access_token", data.accessToken);
            return data.accessToken;
        } catch {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem("evalis_access_token");
            localStorage.removeItem("evalis_user");
            return null;
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        const userData: User = {
            id: data.user.id,
            fullName: data.user.fullName,
            role: data.user.role,
            tenantId: data.user.tenantId,
        };

        setAccessToken(data.accessToken);
        setUser(userData);
        localStorage.setItem("evalis_access_token", data.accessToken);
        localStorage.setItem("evalis_user", JSON.stringify(userData));

        // Role-based redirect
        switch (userData.role) {
            case "ADMIN":
                router.push("/dashboard/admin");
                break;
            case "TEACHER":
                router.push("/dashboard/teacher");
                break;
            case "STUDENT":
                router.push("/dashboard/student");
                break;
        }
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch { }
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("evalis_access_token");
        localStorage.removeItem("evalis_user");
        router.push("/login");
    }, [router]);

    // Expose refreshAccessToken for the API client
    useEffect(() => {
        api.setAuthHelpers({ getToken: () => accessToken, refreshToken: refreshAccessToken });
    }, [accessToken, refreshAccessToken]);

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}