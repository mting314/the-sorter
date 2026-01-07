import { HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import type { DiffType } from '~/utils/ranking-diff';
import { DiffBadge } from './DiffBadge';
import { getSongColor } from '~/utils/song';

export interface RankingSongItemProps {
  song: Song;
  rank: number;
  diff?: DiffType;
  showDiff?: boolean;
}

export function RankingSongItem({ song, rank, diff, showDiff = false }: RankingSongItemProps) {
  const color = getSongColor(song);
  const songName = song.name as string;

  return (
    <HStack
      gap={2}
      borderBottomWidth="1px"
      borderBottomColor="border.muted"
      p={2}
      _last={{ borderBottomWidth: 0 }}
    >
      <Text minW="8" color="fg.muted" fontSize="sm" fontWeight="bold" textAlign="right">
        {rank}
      </Text>

      <Stack flex={1} gap={0}>
        <Text
          layerStyle="textStroke"
          style={{ ['--color' as string]: color }}
          color="var(--color)"
          fontSize="sm"
          fontWeight="medium"
        >
          {songName}
        </Text>
        {/* {artistNames && (
          <Text color="fg.muted" fontSize="xs">
            {artistNames}
          </Text>
        )} */}
      </Stack>

      {showDiff && diff && <DiffBadge diff={diff} />}
    </HStack>
  );
}
