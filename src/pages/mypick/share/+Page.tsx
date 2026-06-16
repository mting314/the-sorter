import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { join } from 'path-browserify';
import { HStack, Stack } from 'styled-system/jsx';
import seriesInfo from '../../../../data/series-info.json';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { MyPickBoard, type BoardCard } from '~/components/mypick/MyPickBoard';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';
import {
  usePerformance,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { getFullPerformanceName, getSongName } from '~/utils/names';
import {
  BUILTIN_AWARDS,
  buildUnitGroups,
  decodeMyPick,
  getLiveCostumes,
  getLiveSongEntries,
  getSongThumbUrl
} from '~/utils/mypick';
import type { MyPickState, MyPickValue } from '~/types/mypick';
import type { Artist, Song } from '~/types/songs';

const seriesColor = (ids?: (string | number)[]): string | undefined => {
  const id = ids?.[0];
  if (id === undefined) return undefined;
  return seriesInfo.find((s) => String(s.id) === String(id))?.color;
};

const localizedArtistName = (artist: Artist, lang: string): string =>
  lang === 'en' && artist.englishName ? artist.englishName : artist.name;

export function Page() {
  const songs = useSongData();
  const artists = useArtistsData();
  const { t, i18n } = useTranslation();
  const [, setStored] = useLocalStorage<MyPickState>('mypick-state');

  const shared = useMemo(() => {
    const params = new URLSearchParams(import.meta.env.SSR ? '' : location.search);
    return decodeMyPick(params.get('d'));
  }, []);

  const performanceId = shared?.performanceId;
  const performance = usePerformance(performanceId);
  const { setlist } = usePerformanceSetlist(performanceId);

  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const artistById = useMemo(() => new Map(artists.map((a) => [a.id, a])), [artists]);
  const entries = useMemo(() => getLiveSongEntries(setlist, songs), [setlist, songs]);
  const unitGroups = useMemo(() => buildUnitGroups(entries, artists), [entries, artists]);
  const costumes = useMemo(() => getLiveCostumes(performanceId), [performanceId]);

  const songSub = (song: Song): string =>
    (song.artists ?? [])
      .map((a) => artistById.get(a.id))
      .filter((a): a is Artist => Boolean(a))
      .map((a) => localizedArtistName(a, i18n.language))
      .join('・');

  const songPicked = (song: Song): BoardCard['picked'] => ({
    name: getSongName(song.name, song.englishName, i18n.language),
    sub: songSub(song),
    image: getSongThumbUrl(song)
  });

  const resolvePicked = (value: MyPickValue | undefined): BoardCard['picked'] | undefined => {
    if (!value) return undefined;
    if (value.type === 'costume') {
      const costume = costumes.find((c) => c.id === value.id);
      return costume ? { name: costume.name, sub: costume.songName, image: costume.image } : undefined;
    }
    const song = songById.get(value.id);
    return song ? songPicked(song) : undefined;
  };

  const awardCards: BoardCard[] = shared
    ? [
        ...BUILTIN_AWARDS.map((award) => ({
          id: `award:${award.key}`,
          label: t(`mypick.awards.${award.key}`),
          picked: resolvePicked(shared.awards[award.key])
        })),
        ...shared.customAwards.map((award) => ({
          id: `award:${award.id}`,
          label: award.label,
          picked: resolvePicked(shared.awards[award.id])
        }))
      ]
    : [];

  const unitCards: BoardCard[] = shared
    ? unitGroups.map((group) => {
        const pickedId = shared.unitPicks[group.artist.id];
        const song = pickedId ? songById.get(pickedId) : undefined;
        return {
          id: `unit:${group.artist.id}`,
          label: localizedArtistName(group.artist, i18n.language),
          badge: t(`mypick.units.kind_${group.kind}`),
          accentColor: seriesColor(group.artist.seriesIds),
          picked: song ? songPicked(song) : undefined
        };
      })
    : [];

  const makeOwn = () => {
    if (shared) setStored(shared);
    location.href = join(import.meta.env.BASE_URL, '/mypick');
  };

  const liveName = performance ? getFullPerformanceName(performance) : '';
  const liveSub = performance
    ? [new Date(performance.date).toLocaleDateString(), performance.venue].filter(Boolean).join(' • ')
    : undefined;

  return (
    <>
      <Metadata title={`${t('mypick.title')} - LoveLive! Sorter`} helmet />
      <Stack gap={4} w="full">
        <Stack gap={1}>
          <Text fontSize="3xl" fontWeight="bold">
            {t('mypick.title')}
          </Text>
          <Text color="fg.muted">{t('mypick.description')}</Text>
        </Stack>

        {!shared ? (
          <Text color="fg.muted">{t('mypick.no_live_selected')}</Text>
        ) : (
          <>
            <HStack
              gap={3}
              justifyContent="space-between"
              borderColor="border.default"
              borderRadius="l2"
              borderWidth="1px"
              p={3}
              flexWrap="wrap"
            >
              <Text fontSize="sm">{t('mypick.shared_view')}</Text>
              <Button size="sm" onClick={makeOwn}>
                {t('mypick.make_own')}
              </Button>
            </HStack>

            {entries.length === 0 ? (
              <Text color="fg.muted">{t('common.loading')}</Text>
            ) : (
              <MyPickBoard
                liveName={liveName}
                liveSub={liveSub}
                accentColor={seriesColor(performance?.seriesIds)}
                awards={awardCards}
                units={unitCards}
              />
            )}
          </>
        )}
      </Stack>
    </>
  );
}
