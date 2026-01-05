import { useTranslation } from 'react-i18next';
import type { WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import { UserRankingWithGroup } from '~/types/user-rankings';

export function RankingRankingTable({ rankings }: { rankings: WithRank<UserRankingWithGroup>[] }) {
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign={'center'}>{t('ranking')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('song-name')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('artist')}</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {/* display each ranking in sorted rank order */}
        {rankings.map((c, idx) => {
          const { rank, userName, rankings } = c;

          return (
            <Table.Row
              key={idx}
              // style={{ ['--color' as 'color']: colorCode }}
              cursor="pointer"
              borderLeft="8px solid"
              borderLeftColor="var(--color)"
              borderBottomColor="var(--color)"
            >
              <Table.Cell>{rank}</Table.Cell>
              <Table.Cell>
                <Text layerStyle="textStroke" color="var(--color)" fontSize="md" fontWeight="bold">
                  {userName}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <Text>{userName}</Text>
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
