import { useCallback, useEffect, useState } from "react";

export interface MyVoice {
  id: string; // ElevenLabs voice id
  name: string;
  emoji: string;
  createdAt: number;
}

export function useMyVoices() {
  const [voices, setVoices] = useState<MyVoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/voices");
      const data = res.ok ? await res.json() : { voices: [] };
      setVoices(data.voices ?? []);
    } catch {
      setVoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { voices, loading, refresh };
}
