import { useEffect, useState } from 'react';
import type { UserRanking, UserRankingsData } from '~/types/user-rankings';

/**
 * Resolve the networked location of the user rankings data.
 * - `PUBLIC_ENV__RANKINGS_URL` (build-time) overrides with any absolute URL
 *   (e.g. a CDN or `https://raw.githubusercontent.com/.../user-song-rankings.json`).
 * - Otherwise it is served as a static asset alongside the site at
 *   `${BASE_URL}data/user-song-rankings.json` (GitHub Pages CDN).
 */
const getRankingsUrl = () => {
  const override = import.meta.env.PUBLIC_ENV__RANKINGS_URL;
  if (override && override.length > 0) return override;
  return `${import.meta.env.BASE_URL ?? '/'}data/user-song-rankings.json`;
};

// Module-level cache so the data is fetched once and shared across all hook
// consumers (landing page stats + each group's sort view).
let cache: UserRanking[] | null = null;
let inflight: Promise<UserRanking[]> | null = null;

const loadUserRankings = (): Promise<UserRanking[]> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(getRankingsUrl())
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load rankings: HTTP ${res.status}`);
      return res.json() as Promise<UserRankingsData>;
    })
    .then((data) => {
      cache = data.users ?? [];
      return cache;
    })
    .catch((err) => {
      inflight = null; // allow retry on next mount
      throw err;
    });
  return inflight;
};

export interface UseUserRankingsDataResult {
  users: UserRanking[];
  isLoading: boolean;
  error: Error | null;
}

export const useUserRankingsData = (): UseUserRankingsDataResult => {
  const [users, setUsers] = useState<UserRanking[]>(cache ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(cache === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cache) {
      setUsers(cache);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    loadUserRankings()
      .then((data) => {
        if (!active) return;
        setUsers(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { users, isLoading, error };
};
