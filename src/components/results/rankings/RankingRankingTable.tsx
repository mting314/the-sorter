import { useTranslation } from 'react-i18next';
import type { WithRank } from '~/types';
import { Stack } from 'styled-system/jsx';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import { UserRankingWithGroup } from '~/types/user-rankings';
import { UserRankingCard } from '~/components/sorter/UserRankingCard';

export function RankingRankingTable({ rankings }: { rankings: WithRank<UserRankingWithGroup>[] }) {
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign={'center'}>{t('ranking')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('song_rankings.ranking-username')}</Table.Header>
          <Table.Header textAlign={'center'}>{t('song_rankings.rankings')}</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {/* display each ranking in sorted rank order */}
        {rankings.map((individualRanking, idx) => {
          const { rank, userName, currentGroup } = individualRanking;

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
              {/* Ranking Username */}
              <Table.Cell>
                <Text layerStyle="textStroke" color="var(--color)" fontSize="md" fontWeight="bold">
                  {userName}
                </Text>
              </Table.Cell>
              {/* Ranking Display */}
              <Table.Cell>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <UserRankingCard ranking={individualRanking} groupKey={currentGroup}  />
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
