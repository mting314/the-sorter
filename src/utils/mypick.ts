import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import performanceCostumes from '../../data/performance-costumes.json';
import { computeSortableSetlistLabels } from './performance-sort';
import type { BuiltinAward, LiveCostume, MyPickState, PerformanceCostumes } from '~/types/mypick';
import type { PerformanceSetlist } from '~/types/setlist-prediction';
import type { Artist, Song } from '~/types/songs';

/**
 * Built-in award categories shown on every board. `best_costume` resolves to a
 * costume when LLFans costume data exists for the live, otherwise it falls back
 * to picking the song whose costume you loved.
 */
export const BUILTIN_AWARDS: BuiltinAward[] = [
  { key: 'best_song', kind: 'song' },
  { key: 'most_surprised', kind: 'song' },
  { key: 'cried_most', kind: 'song' },
  { key: 'best_costume', kind: 'costume' },
  { key: 'best_performance', kind: 'song' }
];

// Group acts (full-cast units). Mirrors the heuristic in utils/song-filter so an
// artist is classified the same way across the sorter and the MyPick board.
const GROUP_NAMES = new Set([
  "μ's",
  'Aqours',
  'Aqours feat. 初音ミク',
  'Saint Aqours Snow',
  '私立浦の星女学院一同',
  'シャゼリア☆キッス',
  '虹ヶ咲学園スクールアイドル同好会',
  'ニジガク with You',
  'Liella!',
  '椿滝桜女学院高等学校スクールアイドル部!',
  '蓮ノ空女学院スクールアイドルクラブ',
  'スリーズブーケ＆DOLLCHESTRA＆みらくらぱーく！'
]);

export type ArtistKind = 'group' | 'unit' | 'solo';

export function getArtistKind(artist: Pick<Artist, 'name' | 'characters'>): ArtistKind {
  if (GROUP_NAMES.has(artist.name)) return 'group';
  if ((artist.characters?.length ?? 0) <= 1) return 'solo';
  return 'unit';
}

export interface LiveSongEntry {
  song: Song;
  /** Setlist position label, e.g. M01 / EN02. */
  label: string;
}

/**
 * Ordered, de-duplicated songs performed in a live, resolved to Song objects.
 * Custom-named setlist items that can't be resolved to a song are dropped.
 */
export function getLiveSongEntries(
  setlist: PerformanceSetlist | null | undefined,
  songs: Song[]
): LiveSongEntry[] {
  if (!setlist) return [];
  const songMap = new Map(songs.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const entries: LiveSongEntry[] = [];
  for (const entry of computeSortableSetlistLabels(setlist, songs)) {
    if (seen.has(entry.songId)) continue;
    const song = songMap.get(entry.songId);
    if (!song) continue;
    seen.add(entry.songId);
    entries.push({ song, label: entry.label });
  }
  return entries;
}

export interface UnitGroup {
  artist: Artist;
  kind: ArtistKind;
  entries: LiveSongEntry[];
}

/**
 * Groups the live's songs by every performing artist/unit. A song that credits
 * multiple artists appears under each. Units are ordered groups → units → solos,
 * then by song count desc, then by name so the board reads top-down.
 */
export function buildUnitGroups(entries: LiveSongEntry[], artists: Artist[]): UnitGroup[] {
  const artistMap = new Map(artists.map((a) => [a.id, a]));
  const grouped = new Map<string, LiveSongEntry[]>();

  for (const entry of entries) {
    for (const { id } of entry.song.artists ?? []) {
      if (!artistMap.has(id)) continue;
      const list = grouped.get(id) ?? [];
      list.push(entry);
      grouped.set(id, list);
    }
  }

  const kindRank: Record<ArtistKind, number> = { group: 0, unit: 1, solo: 2 };

  return [...grouped.entries()]
    .map(([id, groupEntries]) => {
      const artist = artistMap.get(id)!;
      return { artist, kind: getArtistKind(artist), entries: groupEntries };
    })
    .sort((a, b) => {
      if (kindRank[a.kind] !== kindRank[b.kind]) return kindRank[a.kind] - kindRank[b.kind];
      if (a.entries.length !== b.entries.length) return b.entries.length - a.entries.length;
      return a.artist.name.localeCompare(b.artist.name);
    });
}

/** Costumes worn during a live, from `data/performance-costumes.json` (LLFans). */
export function getLiveCostumes(performanceId: string | undefined): LiveCostume[] {
  if (!performanceId) return [];
  const data = performanceCostumes as PerformanceCostumes;
  return data[performanceId] ?? [];
}

/** YouTube thumbnail for a song's MV, used as the card image. */
export function getSongThumbUrl(song: Song): string | undefined {
  const videoId = song.musicVideo?.videoId;
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined;
}

export function createEmptyState(performanceId: string): MyPickState {
  return { performanceId, awards: {}, unitPicks: {}, customAwards: [] };
}

// ==================== Share encoding ====================

// Compact wire format so share URLs stay short.
interface WireState {
  p: string;
  a: Record<string, [string, string]>; // award key -> [kind, id]
  u: Record<string, string>; // artistId -> songId
  c: { i: string; l: string }[]; // custom awards
}

export function encodeMyPick(state: MyPickState): string {
  const wire: WireState = {
    p: state.performanceId,
    a: Object.fromEntries(
      Object.entries(state.awards).map(([key, value]) => [key, [value.type, value.id]])
    ),
    u: state.unitPicks,
    c: state.customAwards.map((award) => ({ i: award.id, l: award.label }))
  };
  return compressToEncodedURIComponent(JSON.stringify(wire));
}

export function decodeMyPick(encoded: string | null | undefined): MyPickState | null {
  if (!encoded) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const wire = JSON.parse(json) as Partial<WireState>;
    if (!wire || typeof wire.p !== 'string') return null;
    return {
      performanceId: wire.p,
      awards: Object.fromEntries(
        Object.entries(wire.a ?? {}).map(([key, [type, id]]) => [key, { type, id }])
      ),
      unitPicks: wire.u ?? {},
      customAwards: (wire.c ?? []).map((award) => ({ id: award.i, label: award.l }))
    };
  } catch {
    return null;
  }
}
