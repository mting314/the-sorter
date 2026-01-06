import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Kbd } from '../../../components/ui/kbd';
import { Progress } from '../../../components/ui/progress';
import { Switch } from '../../../components/ui/switch';
import { Text } from '../../../components/ui/text';
import type { Character } from '../../../types';
import { getCurrentItem } from '../../../utils/sort';
import { Metadata } from '~/components/layout/Metadata';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { useUserRankingsSortData } from '~/hooks/useUserRankingsSortData';
import { UserRankingCard } from '~/components/sorter/UserRankingCard';
import { usePageContext } from 'vike-react/usePageContext';
import { GroupKey, UserRanking } from '~/types/user-rankings';
import { GROUP_NAMES } from '~/constants/groups';

const RankingResultsView = lazy(() =>
  import('../../../components/results/rankings/RankingResultsView').then((m) => ({
    default: m.RankingResultsView
  }))
);

const ConfirmMidSortDialog = lazy(() =>
  import('../../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmMidSortDialog
  }))
);

const ConfirmEndedDialog = lazy(() =>
  import('../../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmEndedDialog
  }))
);

const ConfirmNewSessionDialog = lazy(() =>
  import('../../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmNewSessionDialog
  }))
);

const SortingPreviewDialog = lazy(() =>
  import('../../../components/sorter/SortingPreviewDialog').then((m) => ({
    default: m.SortingPreviewDialog
  }))
);

export function Page() {
  const { t } = useTranslation();

  const pageContext = usePageContext();
  const groupKey = (pageContext.routeParams as { group: GroupKey }).group;
  const {
    noTieMode,
    setNoTieMode,
    showDiffsMode,
    setShowDiffsMode,
    init,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    isEnded,
    listToSort,
    listCount,
    clear
  } = useUserRankingsSortData(groupKey);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended' | 'new-session' | 'preview';
    action: 'reset' | 'clear';
  }>();

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);

  // Full title = group you're ranking + ranking title
  const titlePrefix = GROUP_NAMES[groupKey];
  const title = titlePrefix + ' ' + t('ranking-ranking-title');

  const isSorting = !!state;

  const handleStart = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'reset'
      });
    } else {
      init();
    }
  };

  const handleClear = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'clear'
      });
    } else {
      clear();
    }
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">
          {title}
        </Text>
        <Text textAlign="center">{t('description')}</Text>
        {!isSorting && (
          <>
            <Wrap>
              <Switch
                checked={showDiffsMode}
                disabled={isSorting}
                onCheckedChange={(e) => setShowDiffsMode(e.checked)}
              ></Switch>
              {t('settings.show_ranking_diffs_mode')}
              <Switch
                checked={noTieMode}
                disabled={isSorting}
                onCheckedChange={(e) => setNoTieMode(e.checked)}
              >
                {t('settings.no_tie_mode')}
              </Switch>
            </Wrap>
          </>
        )}
        <Text fontSize="sm" fontWeight="bold">
          {t('settings.sort_count', { count: listCount })}
        </Text>
        <Button
          size="sm"
          variant="outline"
          disabled={listCount === 0}
          onClick={() => setShowConfirmDialog({ type: 'preview', action: 'reset' })}
        >
          {t('sort.preview')}
        </Button>
        <Wrap justifyContent="center">
          <Button variant="solid" onClick={() => handleStart()}>
            {!isSorting ? t('sort.start') : t('sort.start_over')}
          </Button>
          {isSorting && (
            <Button variant="subtle" onClick={() => handleClear()}>
              {state?.status !== 'end' ? t('sort.stop') : t('sort.new_settings')}
            </Button>
          )}
        </Wrap>

        {/* While we're in sorting state: display left and right cards */}
        {state && (
          <Stack alignItems="center" w="full">
            {state.status !== 'end' && (
              <Stack w="full" h={{ base: '100vh', md: 'auto' }} p="4">
                <Stack flex="1" alignItems="center" w="full">
                  {currentLeft && currentRight && (
                    <HStack
                      gap="150"
                      // flex={1}
                      flexDirection={{ base: 'column', sm: 'row' }}
                      justifyContent="center"
                      alignItems="stretch"
                      width="full"
                    >
                      <Stack alignItems="center" maxW="600px">
                        <UserRankingCard
                          onClick={() => left()}
                          ranking={currentLeft}
                          groupKey={groupKey}
                          // These control showing the difference in position of songs between left and right rankings
                          showDiffs={showDiffsMode}
                          comparedRanking={currentRight}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack alignItems="center" maxW="600px">
                        <UserRankingCard
                          onClick={() => right()}
                          ranking={currentRight}
                          groupKey={groupKey}
                          // These control showing the difference in position of songs between left and right rankings
                          showDiffs={showDiffsMode}
                          comparedRanking={currentLeft}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>→</Kbd>
                        </Box>
                      </Stack>
                    </HStack>
                  )}
                  <HStack justifyContent="center" w="full">
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      onClick={() => tie()}
                      disabled={noTieMode}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.tie')}
                    </Button>
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      variant="subtle"
                      onClick={() => undo()}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.undo')}
                    </Button>
                  </HStack>
                  <Stack hideBelow="sm" gap="1">
                    <Text fontWeight="bold">{t('sort.keyboard_shortcuts')}</Text>
                    <Wrap>
                      <Text>
                        <Kbd>←</Kbd>: {t('sort.pick_left')}
                      </Text>
                      <Text>
                        <Kbd>→</Kbd>: {t('sort.pick_right')}
                      </Text>
                      <Text
                        data-disabled={noTieMode === true || undefined}
                        textDecoration={{ _disabled: 'line-through' }}
                      >
                        <Kbd>↓</Kbd>: {t('sort.tie')}
                      </Text>
                      <Text>
                        <Kbd>↑</Kbd>: {t('sort.undo')}
                      </Text>
                    </Wrap>
                  </Stack>
                </Stack>
                <Text>{t('sort.comparison_no', { count })}</Text>
                <Progress
                  translations={{ value: (details) => `${details.percent}%` }}
                  value={progress}
                  min={0}
                  max={1}
                  defaultValue={0}
                />
              </Stack>
            )}
            {state.arr && isEnded && (
              <Suspense>
                <RankingResultsView userRankingData={listToSort} order={state.arr} />
              </Suspense>
            )}
          </Stack>
        )}
      </Stack>
      <Suspense>
        <ConfirmEndedDialog
          open={showConfirmDialog?.type === 'ended'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ConfirmMidSortDialog
          open={showConfirmDialog?.type === 'mid-sort'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ConfirmNewSessionDialog
          open={showConfirmDialog?.type === 'new-session'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            // User chose to accept the new link (reset current session and use new params)
            clear();
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              // User dismissed/cancelled (keep current session, remove URL params)
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, '', url.toString());
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <SortingPreviewDialog
          open={showConfirmDialog?.type === 'preview'}
          lazyMount
          unmountOnExit
          items={listToSort}
          // Show the usernames of those with rankings to sort
          getItemName={(item) => (item as UserRanking).userName || ''}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
      </Suspense>
    </>
  );
}
