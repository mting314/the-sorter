import { HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Song, Artist } from '~/types/songs';
import type { DiffType } from '~/utils/ranking-diff';
import { DiffBadge } from './DiffBadge';
import { getSongColor } from '~/utils/song';
import { getArtistName } from '~/utils/names';

export interface RankingSongItemProps {
  song: Song;
  rank: number;
  artists: Artist[];
  locale: string;
  diff?: DiffType;
  showDiff?: boolean;
}

export function RankingSongItem({
  song,
  rank,
  artists,
  locale,
  diff,
  showDiff = false,
}: RankingSongItemProps) {
  const color = getSongColor(song);
  const songName = song.name as string;

  // Get artist name
  const songArtists = song.artists
    .map((a) => artists.find((artist) => artist.id === a.id))
    .filter((a): a is Artist => a !== undefined);

  const artistNames = songArtists
    .map((a) => getArtistName(a.name, locale))
    .join(', ');

  return (
    <HStack
      gap={2}
      p={2}
      borderBottomWidth="1px"
      borderBottomColor="border.muted"
      _last={{ borderBottomWidth: 0 }}
    >
      <Text
        fontWeight="bold"
        fontSize="sm"
        color="fg.muted"
        minW="8"
        textAlign="right"
      >
        {rank}
      </Text>

      <Stack flex={1} gap={0}>
        <Text
          fontSize="sm"
          fontWeight="medium"
          layerStyle="textStroke"
          style={{ ['--color' as string]: color }}
          color="var(--color)"
        >
          {songName}
        </Text>
        {artistNames && (
          <Text fontSize="xs" color="fg.muted">
            {artistNames}
          </Text>
        )}
      </Stack>

      {showDiff && diff && (
        <DiffBadge diff={diff} />
      )}
    </HStack>
  );
}
