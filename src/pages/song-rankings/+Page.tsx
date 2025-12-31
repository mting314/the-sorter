import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Grid } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { useSongData } from '~/hooks/useSongData';
import { useUserRankingsData } from '~/hooks/useUserRankingsData';
import { GroupCard } from '~/components/song-rankings/GroupCard';
import { GROUP_ARTIST_IDS, GROUP_NAMES } from '~/constants/groups';
import type { GroupKey } from '~/types/user-rankings';

export function Page() {
  const { t } = useTranslation();
  const songs = useSongData();
  const userRankings = useUserRankingsData();

  // Calculate stats for each group
  const groupStats = useMemo(() => {
    const stats: Record<GroupKey, { songCount: number; rankingCount: number }> = {
      ceriseBouquet: { songCount: 0, rankingCount: 0 },
      dollchestra: { songCount: 0, rankingCount: 0 },
      miracraPark: { songCount: 0, rankingCount: 0 },
      groupSongs: { songCount: 0, rankingCount: 0 },
      edelNote: { songCount: 0, rankingCount: 0 },
    };

    // Count songs for each group
    Object.entries(GROUP_ARTIST_IDS).forEach(([key, artistId]) => {
      const groupKey = key as GroupKey;
      const songCount = Array.isArray(songs)
        ? songs.filter((song) => song.artists.some((a) => a.id === artistId)).length
        : 0;
      stats[groupKey].songCount = songCount;
    });

    // Count rankings for each group
    userRankings.forEach((user) => {
      Object.entries(user.rankings).forEach(([key, ranking]) => {
        const groupKey = key as GroupKey;
        if (ranking && ranking.length > 0) {
          stats[groupKey].rankingCount += 1;
        }
      });
    });

    return stats;
  }, [songs, userRankings]);

  return (
    <>
      <Metadata title={t('song_rankings.title')} helmet />
      <Stack alignItems="center" w="full" gap={6} p={{ base: 4, md: 6 }}>
        <Stack alignItems="center" gap={2}>
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold">
            {t('song_rankings.select_group')}
          </Text>
          <Text textAlign="center" color="fg.muted">
            {t('song_rankings.description')}
          </Text>
        </Stack>

        <Grid
          columns={{ base: 1, md: 2, lg: 3 }}
          gap={4}
          w="full"
          maxW="1200px"
        >
          {Object.entries(GROUP_NAMES).map(([key, name]) => {
            const groupKey = key as GroupKey;
            const stats = groupStats[groupKey];

            return (
              <GroupCard
                key={key}
                groupKey={groupKey}
                groupName={name}
                songCount={stats.songCount}
                rankingCount={stats.rankingCount}
              />
            );
          })}
        </Grid>
      </Stack>
    </>
  );
}
