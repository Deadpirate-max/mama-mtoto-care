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
