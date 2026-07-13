import { useCallback, useEffect, useState } from "react";

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string | null;
  childName: string | null;
  childAge: number | null;
  childGender: string | null;
}

// 표시용 이름 — 보호자 호칭이 없으면 이메일 앞부분으로 폴백
export function displayName(user: {
  nickname: string | null;
  email: string;
}): string {
  return user.nickname?.trim() || user.email.split("@")[0];
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = res.ok ? await res.json() : { user: null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
