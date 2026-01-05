import { useMemo } from 'react';
import { useSorter } from './useSorter';
import { useUserRankingsData } from './useUserRankingsData';
import type { GroupKey, UserRankingWithGroup } from '~/types/user-rankings';
import { useLocalStorage } from './useLocalStorage';

export const useUserRankingsSortData = (group: GroupKey) => {
  const allUserRankings = useUserRankingsData();
  const [noTieMode, setNoTieMode] = useLocalStorage(`dd-mode-${group}`, false);

  // Filter to only users who have rankings for this group
  const listToSort = useMemo(() => {
    return allUserRankings
      .filter((user) => user.rankings[group] && user.rankings[group]!.length > 0)
      .map((user) => ({
        ...user,
        currentGroup: group,
        currentRanking: user.rankings[group]!
      })) as UserRankingWithGroup[];
  }, [allUserRankings, group]);

  // Use the existing sorter hook with user IDs
  const sorterHook = useSorter(
    listToSort.map((u) => u.id),
    `ranking-rankings-${group}` // Unique localStorage key per group
  );

  return {
    ...sorterHook,
    noTieMode: noTieMode ?? false, // default to false
    setNoTieMode,
    listToSort,
    listCount: listToSort.length
  };
};
