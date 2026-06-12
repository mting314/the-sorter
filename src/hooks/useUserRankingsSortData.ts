import { useEffect, useMemo } from 'react';
import { useSorter } from './useSorter';
import { useUserRankingsData } from './useUserRankingsData';
import type { GroupKey, UserRanking } from '~/types/user-rankings';
import { useLocalStorage } from './useLocalStorage';

export const useUserRankingsSortData = (
  group: GroupKey,
  options?: { disableShortcutsRef?: { current: boolean } }
) => {
  const { users: allUserRankings, isLoading, error } = useUserRankingsData();
  const [noTieMode, setNoTieMode] = useLocalStorage(`dd-mode-${group}`, false);
  const [blindMode, setBlindMode] = useLocalStorage(`blind-mode-${group}`, false);

  // Filter to only users who have rankings for this group
  const listToSort = useMemo(() => {
    return allUserRankings
      .filter((user) => user.rankings[group] && user.rankings[group]!.length > 0)
      .map((user) => ({
        ...user
      })) as UserRanking[];
  }, [allUserRankings, group]);

  // Use the existing sorter hook with userNames
  const sorterHook = useSorter(
    listToSort.map((u) => u.userName),
    `ranking-rankings-${group}` // Unique localStorage key per group
  );

  // Keyboard shortcuts: ←/→ pick, ↓ tie, ↑ undo (mirrors the song sorters).
  const { state, left, right, tie, undo } = sorterHook;
  const disableShortcutsRef = options?.disableShortcutsRef;
  useEffect(() => {
    const handleKeystroke = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!state || state.status === 'end') return;
      // Don't act while a dialog (confirm/preview) is open.
      if (disableShortcutsRef?.current) return;
      switch (e.key) {
        case 'ArrowUp':
          undo();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          left();
          e.preventDefault();
          break;
        case 'ArrowRight':
          right();
          e.preventDefault();
          break;
        case 'ArrowDown':
          if (noTieMode) break; // tie disabled — let the key through (e.g. page scroll)
          tie();
          e.preventDefault();
          break;
      }
    };
    document.addEventListener('keydown', handleKeystroke);
    return () => document.removeEventListener('keydown', handleKeystroke);
  }, [state, left, right, tie, undo, noTieMode, disableShortcutsRef]);

  return {
    ...sorterHook,
    noTieMode: noTieMode ?? false, // default to false
    setNoTieMode,
    blindMode: blindMode ?? false, // hide names during ranking (results unaffected)
    setBlindMode,
    listToSort,
    listCount: listToSort.length,
    isLoading,
    error
  };
};
