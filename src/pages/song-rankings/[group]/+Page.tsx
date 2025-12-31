import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { Stack, HStack, Grid, Box } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Metadata } from '~/components/layout/Metadata';
import { getCurrentItem } from '~/utils/sort';
import { useUserRankingsSortData } from '~/hooks/useUserRankingsSortData';
import { UserRankingCard } from '~/components/song-rankings/UserRankingCard';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';
import { GROUP_NAMES } from '~/constants/groups';
import type { GroupKey } from '~/types/user-rankings';
import { Kbd } from '~/components/ui/kbd';

export function Page({ routeParams }: { routeParams: { group: string } }) {
  const group = routeParams.group as GroupKey;
  const { t } = useTranslation();
  const songs = useSongData();
  const artists = useArtistsData();

  const {
    init,
    left: chooseLeft,
    right: chooseRight,
    state,
    count,
    tie,
    undo,
    progress,
    isEnded,
    listToSort,
    listCount,
    clear,
  } = useUserRankingsSortData(group);

  const [isStarted, setIsStarted] = useState(false);

  // Get group name
  const groupName = GROUP_NAMES[group];

  // Get current items to compare
  const { left, right } = useMemo(() => {
    if (!state || !listToSort.length) {
      return { left: null, right: null };
    }

    const current = getCurrentItem(state);
    if (!current) {
      return { left: null, right: null };
    }

    const leftUser = listToSort.find((u) => u.id === current.left);
    const rightUser = listToSort.find((u) => u.id === current.right);

    return { left: leftUser || null, right: rightUser || null };
  }, [state, listToSort]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isStarted || isEnded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        chooseLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        chooseRight();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        tie();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isEnded, chooseLeft, chooseRight, tie, undo]);

  // Handle start sorting
  const handleStart = () => {
    init();
    setIsStarted(true);
  };

  // Handle restart
  const handleRestart = () => {
    clear();
    setIsStarted(false);
  };

  // Not enough rankings to compare
  if (listCount < 2) {
    return (
      <>
        <Metadata title={`${groupName} - ${t('song_rankings.title')}`} helmet />
        <Stack alignItems="center" w="full" gap={6} p={{ base: 4, md: 6 }}>
          <Text fontSize="2xl" fontWeight="bold">
            {groupName}
          </Text>
          <Text color="fg.muted">
            Not enough user rankings available for this group. Need at least 2 rankings to compare.
          </Text>
          <Button asChild>
            <a href={join(import.meta.env.BASE_URL, '/song-rankings')}>
              Back to Group Selection
            </a>
          </Button>
        </Stack>
      </>
    );
  }

  // Before starting
  if (!isStarted || !state) {
    return (
      <>
        <Metadata title={`${groupName} - ${t('song_rankings.title')}`} helmet />
        <Stack alignItems="center" w="full" gap={6} p={{ base: 4, md: 6 }}>
          <Stack alignItems="center" gap={2}>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold">
              {groupName}
            </Text>
            <Text color="fg.muted">
              {t('song_rankings.rankings_count', { count: listCount })}
            </Text>
          </Stack>

          <Button size="lg" onClick={handleStart}>
            {t('song_rankings.start_sorting')}
          </Button>

          <Button variant="ghost" asChild>
            <a href={join(import.meta.env.BASE_URL, '/song-rankings')}>
              Back to Group Selection
            </a>
          </Button>
        </Stack>
      </>
    );
  }

  // Results view (when complete)
  if (isEnded) {
    return (
      <>
        <Metadata title={`${groupName} - ${t('song_rankings.title')}`} helmet />
        <Stack alignItems="center" w="full" gap={6} p={{ base: 4, md: 6 }}>
          <Text fontSize="2xl" fontWeight="bold">
            {groupName} - {t('song_rankings.your_result')}
          </Text>

          <Stack gap={4} w="full" maxW="800px">
            {state.arr.map((tier, tierIdx) => {
              const rank =
                state.arr.slice(0, tierIdx).reduce((sum, t) => sum + t.length, 0) + 1;

              return tier.map((userId) => {
                const user = listToSort.find((u) => u.id === userId);
                if (!user) return null;

                return (
                  <HStack key={userId} gap={4}>
                    <Text fontSize="xl" fontWeight="bold" minW="12">
                      #{rank}
                    </Text>
                    <UserRankingCard
                      user={user}
                      ranking={user.currentRanking}
                      songs={songs}
                      artists={artists}
                      flex={1}
                    />
                  </HStack>
                );
              });
            })}
          </Stack>

          <HStack gap={4}>
            <Button onClick={handleRestart}>Start Over</Button>
            <Button variant="outline" asChild>
              <a href={join(import.meta.env.BASE_URL, '/song-rankings')}>
                Back to Group Selection
              </a>
            </Button>
          </HStack>
        </Stack>
      </>
    );
  }

  // Sorting interface
  return (
    <>
      <Metadata title={`${groupName} - ${t('song_rankings.title')}`} helmet />
      <Stack alignItems="center" w="full" gap={6} p={{ base: 4, md: 6 }}>
        {/* Header with progress */}
        <Stack alignItems="center" gap={3} w="full" maxW="1200px">
          <Text fontSize="xl" fontWeight="bold">
            {groupName}
          </Text>

          <Stack w="full" gap={1}>
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color="fg.muted">
                {t('song_rankings.comparison_count', { current: count + 1, total: '?' })}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {Math.round(progress * 100)}%
              </Text>
            </HStack>
            <Progress value={progress * 100} />
          </Stack>
        </Stack>

        {/* Comparison Cards */}
        {left && right && (
          <Grid
            columns={{ base: 1, md: 2 }}
            gap={4}
            w="full"
            maxW="1200px"
          >
            <UserRankingCard
              user={left}
              ranking={left.currentRanking}
              songs={songs}
              artists={artists}
              position="left"
            />

            <UserRankingCard
              user={right}
              ranking={right.currentRanking}
              songs={songs}
              artists={artists}
              showDiffs
              diffRanking={left.currentRanking}
              position="right"
            />
          </Grid>
        )}

        {/* Action Buttons */}
        <HStack gap={4} flexWrap="wrap" justifyContent="center">
          <Button onClick={chooseLeft} size="lg" colorPalette="blue">
            <HStack>
              <Kbd>←</Kbd>
              <Text>Pick Left</Text>
            </HStack>
          </Button>

          <Button onClick={chooseRight} size="lg" colorPalette="blue">
            <HStack>
              <Text>Pick Right</Text>
              <Kbd>→</Kbd>
            </HStack>
          </Button>

          <Button onClick={tie} variant="outline">
            <HStack>
              <Kbd>↓</Kbd>
              <Text>Tie</Text>
            </HStack>
          </Button>

          <Button onClick={undo} variant="ghost">
            <HStack>
              <Kbd>↑</Kbd>
              <Text>Undo</Text>
            </HStack>
          </Button>
        </HStack>
      </Stack>
    </>
  );
}
