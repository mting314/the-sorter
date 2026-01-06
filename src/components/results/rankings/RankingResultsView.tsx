import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaCopy, FaDownload } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import { Tabs } from '~/components/ui/tabs';
import { Accordion } from '~/components/ui/accordion';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { FormLabel } from '~/components/ui/form-label';
import { Heading } from '~/components/ui/heading';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useToaster } from '~/context/ToasterContext';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import type { WithRank } from '~/types';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import type { RootProps } from '~/components/ui/styled/tabs';
import { GroupKey, UserRanking } from '~/types/user-rankings';
import { RankingRankingTable } from './RankingRankingTable';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';

/**
 * Displays the final results of a ranking sorting session in a table format with export capabilities.
 *
 * This component processes a sort order array and maps it to the actual user ranking data,
 * handling ties and calculating ranks. It provides functionality to export results as
 * screenshots or downloads with customizable titles and descriptions.
 *
 * @component
 * @example
 * ```tsx
 * <RankingResultsView
 *   userRankingData={userRankings}
 *   groupKey="ceriseBouquet"
 *   order={[["Alice"], ["Bob", "Carol"], ["Dave"]]}
 *   titlePrefix="Cerise Bouquet"
 * />
 * ```
 *
 * @param {Object} props - Component props
 * @param {UserRanking[]} props.userRankingData - Array of all user ranking objects being sorted.
 *   Must contain objects with at minimum a `userName` field that matches the userNames in the order array.
 * @param {GroupKey} props.groupKey - The group key (e.g., "ceriseBouquet", "dollchestra")
 *   used to identify which song group rankings to display.
 * @param {string[][]} [props.order] - 2D array representing the sort order with ties.
 *   - Each outer array element represents a rank position
 *   - Inner arrays contain userNames of items tied at that rank
 *   - Example: [["Alice"], ["Bob", "Carol"], ["Dave"]] means:
 *     - Rank 1: userName "Alice"
 *     - Rank 2: userNames "Bob" and "Carol" (tied)
 *     - Rank 4: userName "Dave" (note the gap due to the tie)
 * @param {string} [props.titlePrefix] - Optional prefix for the result title (e.g., group name).
 *   Used in the export filename and default title.
 * @param {RootProps} props...rest - Additional props passed to the Tabs.Root component
 *
 * @returns {JSX.Element} A tabbed interface displaying:
 *   - Export settings accordion (title, description)
 *   - Screenshot/download buttons
 *   - Table view of ranked results
 *   - Hidden rendering canvas for screenshot generation
 *
 * @remarks
 * - The component uses a merge sort result format where ties are represented as arrays
 * - Ranks are calculated automatically based on position, with gaps after ties
 * - Screenshots are generated at 2x scale (2560px width) from a hidden canvas
 * - The current tab selection is persisted to localStorage
 * - Supports both native share API and clipboard fallback for screenshots
 * - We need to pass in the groupKey to pass later on to the RankingRankingTable component so that it knows which song rankings to display since the whole userRankingData array contains all groups' rankings
 */
export function RankingResultsView({
  titlePrefix,
  userRankingData,
  groupKey,
  order,
  ...props
}: RootProps & {
  titlePrefix?: string;
  userRankingData: UserRanking[];
  groupKey: GroupKey;
  order?: string[][];
}) {
  const { toast } = useToaster();
  const [title, setTitle] = useState<string>('My LoveLive! Songs Ranking Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'table'>('songs-result-tab-v2', 'table');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n: _i18n } = useTranslation();

  const songData = useSongData();
  const artistsData = useArtistsData();

  const tabs = useMemo(() => [{ id: 'table', label: t('results.table') }], [t]);

  useEffect(() => {
    if (!tabs.find((t) => t.id === currentTab)) {
      setCurrentTab('table');
    }
  }, [currentTab, setCurrentTab, tabs]);

  const rankings = useMemo(() => {
    return (
      order
        ?.map((ids, idx, arr) => {
          const startRank = arr
            .slice(0, idx)
            .reduce((p, c) => p + (Array.isArray(c) ? c.length : 1), 1);
          if (Array.isArray(ids)) {
            return ids
              .map((userName) => {
                const ranking = userRankingData.find((s) => s.userName === userName);
                return ranking ? { rank: startRank, ...ranking } : null;
              })
              .filter((d): d is WithRank<UserRanking> => d !== null);
          } else {
            // case when we only have a single userName, i.e. a single item that was sorted
            const chara = userRankingData.find((i) => i.userName === ids);
            if (!chara) return [];
            return [{ rank: startRank, ...chara }];
          }
        })
        .filter((c): c is WithRank<UserRanking>[] => !!c) ?? []
    ).flatMap((s) => s);
  }, [order, userRankingData]);

  const makeScreenshot = async () => {
    setShowRenderingCanvas(true);
    toast?.({ description: t('toast.generating_screenshot') });
    const domToBlob = await import('modern-screenshot').then((module) => module.domToBlob);
    const resultsBox = document.getElementById('results');
    setTimestamp(new Date());
    if (resultsBox) {
      const shareImage = await domToBlob(resultsBox, {
        quality: 1,
        scale: 2,
        type: 'image/png',
        features: { removeControlCharacter: false }
      });
      setShowRenderingCanvas(false);
      return shareImage;
    }
  };

  const screenshot = async () => {
    const shareImage = await makeScreenshot();
    if (!shareImage) return;
    try {
      await navigator.share({
        text: t('share.copy_text'),
        files: [new File([shareImage], 'll-sorted.png')]
      });
    } catch {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareImage }, { presentationStyle: 'attachment' })
      ]);
      toast?.({ description: t('toast.screenshot_copied') });
    }
  };

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(new File([blob], `${titlePrefix ?? 'll'}-sorted-${timestamp.valueOf()}.png`));
    } catch (error) {
      console.error(error);
    }
  };

  const exportJSON = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        order?.flatMap((item, idx) =>
          item.map((i) => {
            const userRanking = userRankingData.find((s) => s.userName === `${i}`);
            const userSongIds = userRanking?.rankings[groupKey] ?? [];

            // Enrich each song ID with title and artist
            const enrichedSongs = userSongIds.map((songId, idx) => {
              const song = songData.find((s) => s.id === songId);
              if (!song) {
                return { id: songId, title: 'Unknown', artist: 'Unknown' };
              }

              // Get artist information
              const artistId = song.artists?.[0]?.id;
              const artist = artistId ? artistsData.find((a) => a.id === artistId) : undefined;
              const artistName = artist?.name || 'Unknown';

              return `${idx + 1}. ${song?.name} - ${artistName}`;
            });

            // TODO: this will need to be updated to handle the original tie behavior where rankings are a 2D array
            return {
              rank: idx + 1,
              userName: userRanking?.userName,
              ranking: enrichedSongs
            };
          })
        ),
        null,
        2
      )
    );
    toast?.({ description: t('toast.text_copied') });
  };

  const exportText = async () => {
    await navigator.clipboard.writeText(
      order
        ?.flatMap((item, idx) =>
          item.map((i) => {
            const s = userRankingData.find((s) => s.userName === `${i}`);
            return `${idx + 1}. ${s?.userName}`;
          })
        )
        .join('\n') ?? ''
    );
    toast?.({ description: t('toast.text_copied') });
  };

  useEffect(() => {
    const sortType = t('ranking-ranking-title');
    const type = t('results.ranking');
    setTitle(
      titlePrefix
        ? t('results.results_title', { titlePrefix, sortType, type })
        : t('results.default_results_title', {
            titlePrefix,
            sortType,
            type
          })
    );
  }, [titlePrefix, currentTab, t]);
  return (
    <>
      <Stack alignItems="center" w="full" textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          {t('results.sort_results')}
        </Heading>

        <Stack w="full">
          <Accordion.Root size="md" collapsible>
            <Accordion.Item value="default" width="100%">
              <Accordion.ItemTrigger>
                <Text fontSize="lg" fontWeight="bold">
                  {t('results.export_settings')}
                </Text>
                <Accordion.ItemIndicator>
                  <FaChevronDown />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Stack>
                  <Stack w="full" textAlign="start">
                    <Wrap>
                      <FormLabel htmlFor="title">{t('results.title')}</FormLabel>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Wrap>
                    <Wrap>
                      <FormLabel htmlFor="description">{t('results.description')}</FormLabel>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </Wrap>
                  </Stack>
                </Stack>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
          <HStack justifyContent="space-between" w="full">
            <Wrap justifyContent="flex-end" w="full">
              <Button variant="subtle" onClick={() => void exportJSON()}>
                <FaCopy /> {t('results.export_json')}
              </Button>
              <Button variant="subtle" onClick={() => void exportText()}>
                <FaCopy /> {t('results.song_rankings.copy_text')}
              </Button>
              <Button variant="subtle" onClick={() => void screenshot()}>
                <FaCopy /> {t('results.copy')}
              </Button>
              <Button onClick={() => void download()}>
                <FaDownload /> {t('results.download')}
              </Button>
            </Wrap>
          </HStack>
        </Stack>

        <Tabs.Root
          lazyMount
          defaultValue="table"
          value={currentTab}
          onValueChange={(d) => setCurrentTab(d.value as 'table')}
          {...props}
        >
          <Tabs.List>
            {tabs.map((option) => (
              <Tabs.Trigger key={option.id} value={option.id}>
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          <Box w="full" p="4">
            <Tabs.Content value="table">
              <RankingRankingTable rankings={rankings} groupKey={groupKey} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
      {showRenderingCanvas && (
        <Box position="absolute" w="0" h="0" overflow="hidden">
          <Stack id="results" width="1280px" p="4" bgColor="bg.canvas">
            {title && (
              <Heading fontSize="2xl" fontWeight="bold">
                {title}
              </Heading>
            )}
            {description && <Text>{description}</Text>}
            {/* wtf does this do */}
            {currentTab === 'table' ? (
              <RankingRankingTable rankings={rankings} groupKey={groupKey} />
            ) : (
              <RankingRankingTable rankings={rankings} groupKey={groupKey} />
            )}
            <Text textAlign="end">
              {t('results.generated_at')}: {timestamp.toLocaleString()}
            </Text>
          </Stack>
        </Box>
      )}
    </>
  );
}
