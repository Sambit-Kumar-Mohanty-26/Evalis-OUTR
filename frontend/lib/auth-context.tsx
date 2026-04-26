"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface User {
    id: string;
    fullName: string;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "ADVISOR" | "HEAD_OF_SCHOOL";
    tenantId: string;
    tenantName: string;
    onboardingRequired?: boolean;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    onboard: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    sendOtp: (email: string) => Promise<void>;
    verifyOtp: (email: string, otp: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        try {
            const data = await api.post("/api/v1/auth/refresh");
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

    useEffect(() => {
        const stored = localStorage.getItem("evalis_access_token");
        const storedUser = localStorage.getItem("evalis_user");
        if (stored && storedUser) {
            setAccessToken(stored);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const data = await api.post("/api/v1/auth/login", { email, password });

        const userData: User = {
            id: data.user.id,
            fullName: data.user.fullName,
            role: data.user.role,
            tenantId: data.user.tenantId,
            tenantName: data.user.tenantName,
            onboardingRequired: data.user.onboardingRequired,
        };

        setAccessToken(data.accessToken);
        setUser(userData);
        localStorage.setItem("evalis_access_token", data.accessToken);
        localStorage.setItem("evalis_user", JSON.stringify(userData));

        // Role-based redirect
        if (userData.onboardingRequired && userData.role !== "ADMIN") {
            router.push("/onboard/setup");
            return;
        }

        switch (userData.role) {
            case "ADMIN":
            case "TEACHER":
            case "STUDENT":
            case "ADVISOR":
            case "HEAD_OF_SCHOOL":
                router.push("/dashboard");
                break;
        }
    }, [router]);

    const onboard = useCallback(async (onboardingData: any) => {
        await api.post("/api/v1/auth/onboard", onboardingData);
        // After successful onboarding, we don't log them in automatically 
        // because we want them to go through the official login flow to establish cookies/tokens
        router.push("/login?message=Account specialized. Please calibrate credentials.");
    }, [router]);

    const sendOtp = useCallback(async (email: string) => {
        await api.post("/api/v1/auth/send-otp", { email });
    }, []);

    const verifyOtp = useCallback(async (email: string, otp: string): Promise<string> => {
        const data = await api.post("/api/v1/auth/verify-otp", { email, otp });
        return data.preAuthToken;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/api/v1/auth/logout");
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
        <AuthContext.Provider value={{ 
            user, 
            accessToken, 
            isLoading, 
            login, 
            onboard, 
            logout, 
            isAuthenticated: !!user,
            sendOtp,
            verifyOtp
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}