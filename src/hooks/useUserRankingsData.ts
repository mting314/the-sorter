import { useMemo } from 'react';
import userRankingsData from '../../data/user-song-rankings.json';
import type { UserRankingsData } from '~/types/user-rankings';

export const useUserRankingsData = () => {
  return useMemo(() => (userRankingsData as UserRankingsData).users, []);
};
