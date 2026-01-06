import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';
import type { GroupKey } from '~/types/user-rankings';

export interface GroupCardProps {
  groupKey: GroupKey;
  groupName: string;
  songCount: number;
  rankingCount: number;
}

export function GroupCard({ groupKey, groupName, songCount, rankingCount }: GroupCardProps) {
  const { t } = useTranslation();

  if (rankingCount === 0) {
    return null;
  }

  return (
    <a href={join(import.meta.env.BASE_URL, `/song-rankings/${groupKey}`)}>
      <Card.Root
        cursor="pointer"
        w="full"
        transition="all"
        _hover={{
          shadow: 'lg',
          borderColor: 'colorPalette.500'
        }}
      >
        <Card.Body gap={3}>
          <Card.Title fontSize="xl" fontWeight="bold">
            {groupName}
          </Card.Title>

          <Stack gap={1}>
            <Text color="fg.muted" fontSize="sm">
              {t('song_rankings.songs_count', { count: songCount })}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              {t('song_rankings.rankings_count', { count: rankingCount })}
            </Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </a>
  );
}
