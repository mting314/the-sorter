import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaLink, FaMusic, FaPlus, FaRotateLeft } from 'react-icons/fa6';
import { HStack, Stack, Wrap } from 'styled-system/jsx';
import seriesInfo from '../../../data/series-info.json';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { LivePickerDialog } from '~/components/mypick/LivePickerDialog';
import { SongPickDialog, type PickOption } from '~/components/mypick/SongPickDialog';
import { MyPickBoard, type BoardCard } from '~/components/mypick/MyPickBoard';
import { useSongData } from '~/hooks/useSongData';
import { useArtistsData } from '~/hooks/useArtistsData';
import {
  usePerformance,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useToaster } from '~/context/ToasterContext';
import { getFullPerformanceName, getSongName } from '~/utils/names';
import {
  BUILTIN_AWARDS,
  buildUnitGroups,
  createEmptyState,
  getLiveCostumes,
  getLiveSongEntries,
  getSongThumbUrl
} from '~/utils/mypick';
import type { MyPickState, MyPickValue } from '~/types/mypick';
import type { Artist, Song } from '~/types/songs';

type PickTarget =
  | { kind: 'award'; awardKey: string; slotKind: 'song' | 'costume'; label: string }
  | { kind: 'unit'; artistId: string; label: string };

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
  const { toast } = useToaster();

  const [state, setState] = useLocalStorage<MyPickState>('mypick-state');
  const [livePickerOpen, setLivePickerOpen] = useState(false);
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null);
  const [newAwardLabel, setNewAwardLabel] = useState('');
  const [exporting, setExporting] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const performanceId = state?.performanceId;
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

  const toSongOption = (song: Song): PickOption => ({
    id: song.id,
    name: getSongName(song.name, song.englishName, i18n.language),
    sub: songSub(song),
    image: getSongThumbUrl(song),
    searchText: `${song.name} ${song.englishName ?? ''} ${song.phoneticName ?? ''}`
  });

  const songOptions = useMemo(
    () => entries.map((entry) => toSongOption(entry.song)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, artistById, i18n.language]
  );
  const costumeOptions = useMemo<PickOption[]>(
    () => costumes.map((c) => ({ id: c.id, name: c.name, sub: c.songName, image: c.image })),
    [costumes]
  );

  const resolvePicked = (value: MyPickValue | undefined): BoardCard['picked'] | undefined => {
    if (!value) return undefined;
    if (value.type === 'costume') {
      const costume = costumes.find((c) => c.id === value.id);
      return costume ? { name: costume.name, sub: costume.songName, image: costume.image } : undefined;
    }
    const song = songById.get(value.id);
    if (!song) return undefined;
    return {
      name: getSongName(song.name, song.englishName, i18n.language),
      sub: songSub(song),
      image: getSongThumbUrl(song)
    };
  };

  const awardCards: BoardCard[] = [
    ...BUILTIN_AWARDS.map((award) => ({
      id: `award:${award.key}`,
      label: t(`mypick.awards.${award.key}`),
      picked: resolvePicked(state?.awards[award.key]),
      hint:
        award.kind === 'costume' && costumes.length === 0
          ? t('mypick.costume_fallback_hint')
          : undefined
    })),
    ...(state?.customAwards ?? []).map((award) => ({
      id: `award:${award.id}`,
      label: award.label,
      removable: true,
      picked: resolvePicked(state?.awards[award.id])
    }))
  ];

  const unitCards: BoardCard[] = unitGroups.map((group) => {
    const pickedId = state?.unitPicks[group.artist.id];
    const song = pickedId ? songById.get(pickedId) : undefined;
    return {
      id: `unit:${group.artist.id}`,
      label: localizedArtistName(group.artist, i18n.language),
      badge: t(`mypick.units.kind_${group.kind}`),
      accentColor: seriesColor(group.artist.seriesIds),
      picked: song
        ? {
            name: getSongName(song.name, song.englishName, i18n.language),
            sub: songSub(song),
            image: getSongThumbUrl(song)
          }
        : undefined
    };
  });

  const awardSlotKind = (key: string): 'song' | 'costume' =>
    BUILTIN_AWARDS.find((a) => a.key === key)?.kind ?? 'song';

  const handleSelectLive = (id: string) => {
    if (state?.performanceId === id) return;
    setState(createEmptyState(id));
  };

  const handlePick = (cardId: string) => {
    const [section, rawId] = [cardId.slice(0, cardId.indexOf(':')), cardId.slice(cardId.indexOf(':') + 1)];
    if (section === 'award') {
      const builtin = BUILTIN_AWARDS.find((a) => a.key === rawId);
      const custom = state?.customAwards.find((a) => a.id === rawId);
      setPickTarget({
        kind: 'award',
        awardKey: rawId,
        slotKind: awardSlotKind(rawId),
        label: builtin ? t(`mypick.awards.${rawId}`) : (custom?.label ?? '')
      });
    } else if (section === 'unit') {
      const group = unitGroups.find((g) => g.artist.id === rawId);
      setPickTarget({
        kind: 'unit',
        artistId: rawId,
        label: group ? localizedArtistName(group.artist, i18n.language) : ''
      });
    }
  };

  const handleClear = (cardId: string) => {
    if (!state) return;
    const rawId = cardId.slice(cardId.indexOf(':') + 1);
    if (cardId.startsWith('award:')) {
      const awards = { ...state.awards };
      delete awards[rawId];
      setState({ ...state, awards });
    } else {
      const unitPicks = { ...state.unitPicks };
      delete unitPicks[rawId];
      setState({ ...state, unitPicks });
    }
  };

  const handleRemoveAward = (cardId: string) => {
    if (!state) return;
    const rawId = cardId.slice(cardId.indexOf(':') + 1);
    const awards = { ...state.awards };
    delete awards[rawId];
    setState({
      ...state,
      awards,
      customAwards: state.customAwards.filter((a) => a.id !== rawId)
    });
  };

  const handleSelectOption = (id: string) => {
    if (!state || !pickTarget) return;
    if (pickTarget.kind === 'unit') {
      setState({ ...state, unitPicks: { ...state.unitPicks, [pickTarget.artistId]: id } });
    } else {
      const useCostume = pickTarget.slotKind === 'costume' && costumes.length > 0;
      const value: MyPickValue = { type: useCostume ? 'costume' : 'song', id };
      setState({ ...state, awards: { ...state.awards, [pickTarget.awardKey]: value } });
    }
    setPickTarget(null);
  };

  const addCustomAward = () => {
    const label = newAwardLabel.trim();
    if (!label || !state) return;
    const id = `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    setState({ ...state, customAwards: [...state.customAwards, { id, label }] });
    setNewAwardLabel('');
  };

  const handleReset = () => {
    if (!state) return;
    if (typeof window !== 'undefined' && !window.confirm(t('mypick.reset_confirm'))) return;
    setState(createEmptyState(state.performanceId));
  };

  const shareUrl = async () => {
    if (!state) return;
    const { encodeMyPick } = await import('~/utils/mypick');
    const encoded = encodeMyPick(state);
    const url = `${location.origin}${import.meta.env.PUBLIC_ENV__BASE_URL ?? ''}/mypick/share?d=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.({ description: t('toast.url_copied') });
    } catch {}
  };

  const downloadImage = async () => {
    if (!boardRef.current || exporting) return;
    setExporting(true);
    try {
      const { domToPng } = await import('modern-screenshot');
      const bgColor = window.getComputedStyle(boardRef.current).backgroundColor;
      const dataUrl = await domToPng(boardRef.current, { scale: 2, backgroundColor: bgColor });
      const link = document.createElement('a');
      link.download = `mypick-${performanceId ?? 'live'}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const dialogOptions =
    pickTarget?.kind === 'unit'
      ? (unitGroups
          .find((g) => g.artist.id === pickTarget.artistId)
          ?.entries.map((entry) => toSongOption(entry.song)) ?? [])
      : pickTarget?.slotKind === 'costume' && costumeOptions.length > 0
        ? costumeOptions
        : songOptions;

  const selectedOptionId =
    pickTarget?.kind === 'unit'
      ? state?.unitPicks[pickTarget.artistId]
      : pickTarget
        ? state?.awards[pickTarget.awardKey]?.id
        : undefined;

  const liveName = performance ? getFullPerformanceName(performance) : '';
  const liveSub = performance
    ? [new Date(performance.date).toLocaleDateString(), performance.venue].filter(Boolean).join(' • ')
    : undefined;
  const accent = seriesColor(performance?.seriesIds);
  const hasLive = Boolean(state?.performanceId);
  const hasSongs = entries.length > 0;

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

        <Wrap gap={2}>
          <Button onClick={() => setLivePickerOpen(true)} variant="solid">
            <FaMusic /> {hasLive ? t('mypick.change_live') : t('mypick.choose_live')}
          </Button>
          {hasLive && hasSongs && (
            <>
              <Button onClick={() => void shareUrl()} variant="subtle">
                <FaLink /> {t('mypick.share_url')}
              </Button>
              <Button onClick={() => void downloadImage()} variant="subtle" disabled={exporting}>
                <FaDownload /> {t('mypick.download_image')}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <FaRotateLeft /> {t('mypick.reset')}
              </Button>
            </>
          )}
        </Wrap>

        {!hasLive ? (
          <Stack
            gap={1}
            borderColor="border.default"
            borderRadius="l2"
            borderWidth="1px"
            p={8}
            textAlign="center"
          >
            <Text fontWeight="bold">{t('mypick.no_live_selected')}</Text>
            <Text color="fg.muted" fontSize="sm">
              {t('mypick.no_live_hint')}
            </Text>
          </Stack>
        ) : !hasSongs ? (
          <Text color="fg.muted">{t('mypick.no_songs')}</Text>
        ) : (
          <>
            <MyPickBoard
              ref={boardRef}
              liveName={liveName}
              liveSub={liveSub}
              accentColor={accent}
              awards={awardCards}
              units={unitCards}
              editable
              onPick={handlePick}
              onClear={handleClear}
              onRemove={handleRemoveAward}
            />

            <HStack gap={2} maxW="md">
              <Input
                value={newAwardLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewAwardLabel(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') addCustomAward();
                }}
                placeholder={t('mypick.add_award_placeholder')}
              />
              <Button onClick={addCustomAward} variant="outline" disabled={!newAwardLabel.trim()}>
                <FaPlus /> {t('mypick.add_award')}
              </Button>
            </HStack>
          </>
        )}
      </Stack>

      <LivePickerDialog
        open={livePickerOpen}
        onOpenChange={({ open }) => setLivePickerOpen(open)}
        onSelect={handleSelectLive}
      />

      <SongPickDialog
        open={pickTarget !== null}
        title={
          pickTarget?.kind === 'unit'
            ? t('mypick.pick_song_for', { name: pickTarget.label })
            : pickTarget?.slotKind === 'costume' && costumeOptions.length > 0
              ? t('mypick.pick_costume')
              : t('mypick.pick_song')
        }
        options={dialogOptions}
        selectedId={selectedOptionId}
        onClose={() => setPickTarget(null)}
        onSelect={handleSelectOption}
      />
    </>
  );
}
