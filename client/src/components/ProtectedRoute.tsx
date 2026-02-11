import * as React from "react";
import { useLocation } from "wouter";
import { useMentorStore } from "@/store/useMentorStore";

// Protected Route Component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [, setLocation] = useLocation();
    const user = useMentorStore((s) => s.user);
    const hydrateFromServer = useMentorStore((s) => s.hydrateFromServer);
    const [isChecking, setIsChecking] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            await hydrateFromServer();
            setIsChecking(false);
        };
        checkAuth();
    }, [hydrateFromServer]);

    React.useEffect(() => {
        if (!isChecking && !user) {
            setLocation("/login");
        }
    }, [user, isChecking, setLocation]);

    if (isChecking || !user) {
        return null;
    }

    return <>{children}</>;
}
