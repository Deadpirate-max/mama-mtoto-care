import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, getToken, type Nurse } from "./api";

export function useSession() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Nurse | null>(null);

  useEffect(() => {
    setUser(getToken() ? getStoredUser() : null);
    setReady(true);
  }, []);

  return { ready, user };
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const { ready, user } = useSession();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  return { ready, user };
}

export function useSignOut() {
  const navigate = useNavigate();
  return () => {
    clearSession();
    navigate({ to: "/login", replace: true });
  };
}

// 👇 NEW ROLE GUARD HOOK
export function useRequireRole(allowedRoles: string[]) {
  const navigate = useNavigate();
  const { ready, user } = useSession();

  useEffect(() => {
    if (ready) {
      if (!user) {
        // Not logged in -> go to login
        navigate({ to: "/login", replace: true });
      } else if (!allowedRoles.includes(user.role)) {
        // Logged in but wrong role -> go home
        navigate({ to: "/", replace: true });
      }
    }
    // We pass allowedRoles as a string to prevent infinite re-renders
  }, [ready, user, navigate, allowedRoles.join(",")]);

  return { ready, user };
}
