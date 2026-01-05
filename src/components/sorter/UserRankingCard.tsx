import { Stack, HStack, Box } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
// import { Avatar } from '~/components/ui/avatar';
import type { GroupKey, UserRanking } from '~/types/user-rankings';
import { RankingSongItem } from '../song-rankings/RankingSongItem';
import { calculatePositionDiff } from '~/utils/ranking-diff';
import type { StackProps } from 'styled-system/jsx';
import { useSongData } from '~/hooks/useSongData';

export interface UserRankingCardProps extends StackProps {
  ranking: UserRanking;
  showDiffs?: boolean;
  comparedRanking?: UserRanking;
  groupKey: GroupKey; // need to pass in group key to get the right rankings list
}

export function UserRankingCard({
  ranking,
  showDiffs = false,
  comparedRanking,
  groupKey,
  ...rest
}: UserRankingCardProps) {
  // Get song data from locally
  // Rankings just contain song IDs, we need to join this with the rest of the song data for display
  const songData = useSongData();
  const userName = ranking.userName;
  const rankingsList = ranking.rankings[groupKey] ?? [];

  return (
    <Stack
      gap={3}
      borderColor="border.default"
      rounded="l2"
      borderWidth="1px"
      p={4}
      bg="bg.default"
      shadow="md"
      {...rest}
    >
      {/* User Header */}
      <HStack gap={3} borderBottomWidth="1px" borderBottomColor="border.muted" pb={2}>
        {/* <Avatar src={user.profilePicture} name={user.userName} size="md" /> */}
        <Text fontSize="lg" fontWeight="bold">
          {userName}
        </Text>
      </HStack>

      {/* Ranking List */}
      <Stack
        gap={0}
        borderColor="border.subtle"
        rounded="md"
        borderWidth="1px"
        maxH={{ base: '400px', md: '600px' }}
        overflowY="auto"
      >
        {rankingsList.map((songId, index) => {
          const song = songData.find((s) => s.id === songId);
          const rank = index + 1;

          if (!song) {
            return (
              <Box key={songId} borderBottomWidth="1px" p={2}>
                <Text color="fg.muted" fontSize="sm">
                  [Unknown Song: {songId}]
                </Text>
              </Box>
            );
          }

          // Calculate diff if needed
          const comparedRankingsList = comparedRanking?.rankings[groupKey] ?? [];
          const diff =
            showDiffs && comparedRankingsList.length > 0
              ? calculatePositionDiff(songId, comparedRankingsList, rankingsList)
              : undefined;

          return (
            <RankingSongItem
              key={songId}
              song={song}
              rank={rank}
              diff={diff}
              showDiff={showDiffs}
            />
          );
        })}
      </Stack>

      {/* Footer with song count */}
      <Text color="fg.muted" fontSize="xs" textAlign="center">
        {rankingsList.length} songs ranked
      </Text>
    </Stack>
  );
}
