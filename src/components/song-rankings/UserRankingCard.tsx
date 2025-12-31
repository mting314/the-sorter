import { useTranslation } from 'react-i18next';
import { Stack, HStack, Box } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import type { UserRanking } from '~/types/user-rankings';
import type { Song, Artist } from '~/types/songs';
import { RankingSongItem } from './RankingSongItem';
import { calculatePositionDiff } from '~/utils/ranking-diff';
import type { StackProps } from 'styled-system/types';

export interface UserRankingCardProps extends StackProps {
  user: UserRanking;
  ranking: string[][];
  songs: Song[];
  artists: Artist[];
  showDiffs?: boolean;
  diffRanking?: string[][];
  position?: 'left' | 'right';
}

export function UserRankingCard({
  user,
  ranking,
  songs,
  artists,
  showDiffs = false,
  diffRanking,
  position,
  ...rest
}: UserRankingCardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  // Calculate current rank for each tier
  let currentRank = 1;
  const rankedTiers = ranking.map((tier) => {
    const tierRank = currentRank;
    currentRank += tier.length;
    return { tier, rank: tierRank };
  });

  return (
    <Stack
      gap={3}
      p={4}
      borderWidth="1px"
      borderColor="border.default"
      rounded="l2"
      shadow="md"
      bg="bg.default"
      {...rest}
    >
      {/* User Header */}
      <HStack gap={3} pb={2} borderBottomWidth="1px" borderBottomColor="border.muted">
        <Avatar
          src={user.profilePicture}
          name={user.userName}
          size="md"
        />
        <Text fontSize="lg" fontWeight="bold">
          {user.userName}
        </Text>
      </HStack>

      {/* Ranking List */}
      <Stack
        gap={0}
        maxH={{ base: '400px', md: '600px' }}
        overflowY="auto"
        borderWidth="1px"
        borderColor="border.subtle"
        rounded="md"
      >
        {rankedTiers.map(({ tier, rank }) =>
          tier.map((songId) => {
            const song = songs.find((s) => s.id === songId);

            if (!song) {
              return (
                <Box key={songId} p={2} borderBottomWidth="1px">
                  <Text color="fg.muted" fontSize="sm">
                    [Unknown Song: {songId}]
                  </Text>
                </Box>
              );
            }

            // Calculate diff if needed
            const diff =
              showDiffs && diffRanking
                ? calculatePositionDiff(songId, diffRanking, ranking)
                : undefined;

            return (
              <RankingSongItem
                key={songId}
                song={song}
                rank={rank}
                artists={artists}
                locale={locale}
                diff={diff}
                showDiff={showDiffs}
              />
            );
          })
        )}
      </Stack>

      {/* Footer with song count */}
      <Text fontSize="xs" color="fg.muted" textAlign="center">
        {ranking.flat().length} songs ranked
      </Text>
    </Stack>
  );
}
