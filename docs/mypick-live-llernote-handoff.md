# Handoff: "MyPick for a Live" → port into llernote

## Goal

Build a **live-specific MyPick** on the llernote site (https://hamproductions.github.io/llernote/).
For a single chosen live (performance), the user:

1. Picks their **favourite song from each performing unit/performer** in that live.
2. Hands out **award categories**: Best Song, Most Surprised, Cried the Most,
   Best Costume, Best Performance — plus **custom awards** they can add.
3. Songs come from **setlist data**. **Best Costume** uses costume data when
   available, otherwise falls back to "pick the song whose costume you loved".
4. Can **share** (URL) and **download an image** of the board.

This is distinct from llernote's existing grid `/mypick`. Add it as a new route,
suggested **`/mypick/live`**.

## A working reference already exists — DO NOT rebuild from scratch

A complete, working implementation was built in `the-sorter` first, then moved
here. Read it for the exact logic (unit grouping, award model, share
encode/decode, costume handling, the costume fetch script):

- Repo/branch: **`mting314/the-sorter` @ `feat/mypick-for-a-live`**
- Fetch a file from it without cloning, e.g.:
  ```bash
  gh api repos/mting314/the-sorter/contents/src/utils/mypick.ts?ref=feat/mypick-for-a-live --jq '.content' | base64 -d
  ```
- Reference files (paths in the-sorter):
  - `src/types/mypick.ts` — `MyPickState`, `MyPickValue`, `CustomAward`, `LiveCostume`, `PerformanceCostumes`
  - `src/utils/mypick.ts` — `BUILTIN_AWARDS`, unit grouping, setlist→songs, costume lookup, **encode/decode**
  - `src/components/mypick/{SongPickDialog,LivePickerDialog,MyPickBoard}.tsx` — UI (reference only; reuse llernote's components instead — see below)
  - `src/pages/mypick/+Page.tsx`, `src/pages/mypick/share/+Page.tsx` — page + shared read-only view
  - `scripts/fetch-live-costumes.ts` — LLFans GraphQL costume fetch → `data/performance-costumes.json`
  - `data/performance-costumes.json` — `{}` placeholder (shape: `Record<performanceId, LiveCostume[]>`)
  - i18n: `mypick.*` block in `src/i18n/locales/{en,ja}.json`

The **logic ports almost verbatim**; the **UI/imports must be adapted** to
llernote's richer infrastructure (below).

## Reuse llernote's existing infrastructure (key deltas from the reference)

llernote already has most building blocks — prefer these over the reference's
hand-rolled versions:

- **Data hooks** (`~/hooks/useData`): `useSetlists`, `useSongs`, `useSongById`,
  `useArtists`, `useArtistById`, `useCharacters`, `usePerformances`, `useSeries`,
  `getLiveThumb`.
- **Unit grouping / classification** (`~/utils/mypick-options`): `songArtistIds`,
  `isGroupSong`, `isUnitSong`, `isSoloSong`, `isOtherSong`, `isGroupArtist`,
  `buildArtistBuckets`, `GROUP_ARTIST_NAMES`. **Use these instead of the
  reference's `getArtistKind`/`GROUP_NAMES`.** To classify a performing artist
  for a row: group if `isGroupArtist(artist)`, solo if `artist.characters.length
  <= 1`, else unit.
- **Performance → cast** (`~/utils/performance-cast`): `buildPerformanceCharacterMap`.
- **Pick dialog** (`~/components/mypick/PickDialog`): reuse `PickDialog` +
  `PickItem` for both song and costume selection (it supports `categories`,
  `display: 'tiles'`, search). **Replace the reference's `SongPickDialog`.**
- **Image export** (`~/utils/share`): `downloadElementAsImage` (+ `EXPORT_BG`
  from `~/components/mypick/MyPickGrid`). **Use instead of `modern-screenshot`.**
- **Assets**: `getPicUrl(id, 'thumbnail'|'character'|'icons')`, `hasSongThumb`
  (`~/utils/song-thumbs`). Use `hasSongThumb(song.id) ? getPicUrl(song.id,
  'thumbnail') : undefined` for song images (with YouTube `musicVideo.videoId`
  thumbnail as a secondary fallback if llernote songs carry it).
- **Names**: `localizedName`, `castName` (`~/utils/names`).
- **Share**: llernote already has `encodeMyPick`/`decodeMyPick`/`myPickShareUrl`
  in `~/utils/mypick-share`, but those encode the **grid** model. The live model
  is different — add a **separate** `~/utils/mypick-live-share.ts` (port the
  reference's compact lz-string encode/decode; keep the wire format small).
- **Live picker**: check for an existing performance/setlist picker in llernote;
  if none, build a small searchable single-select list over
  `usePerformances().filter(p => p.hasSetlist)` (see reference `LivePickerDialog`).

## Data model (port from reference `src/types/mypick.ts`)

```ts
type AwardSlotKind = 'song' | 'costume';
interface MyPickValue { type: AwardSlotKind; id: string } // songId or costumeId
interface CustomAward { id: string; label: string }
interface MyPickLiveState {
  performanceId: string;
  awards: Record<string, MyPickValue>;   // award key (builtin or custom id) -> pick
  unitPicks: Record<string, string>;     // artistId -> songId
  customAwards: CustomAward[];
}
interface LiveCostume { id: string; name: string; songId?: string; songName?: string; image?: string }
type PerformanceCostumes = Record<string, LiveCostume[]>;
```

Built-in awards: `best_song`, `most_surprised`, `cried_most`,
`best_costume` (kind `costume`), `best_performance`. Persist state in
localStorage (e.g. key `mypick-live-state`).

## Costume data — where it lives + how to handle absence

- LLFans exposes costumes per setlist item via the
  `EventDetailPage_PerformanceDetail` GraphQL query: each `Performance.setlists[]`
  item has `costumes[] = { id, name, song { name } }`. See
  `docs/setlist-prediction/LLFANS_INTEGRATION.md` (Setlist Item / Costume schema)
  in **the-sorter** — llernote shares the same LLFans-derived data.
- **Neither the-sorter nor llernote commits costume data** in
  `performance-setlists.json` (that build step drops it). So:
  1. Add `data/performance-costumes.json` (start `{}`), typed `PerformanceCostumes`.
  2. Add `scripts/fetch-live-costumes.ts` (port from reference) to fetch from
     `https://ll-fans.jp/graphql` and write that file. It's the documented,
     runnable mechanism (run out-of-band, like the other `data/*.json` updates).
  3. **Best Costume** award: if `performance-costumes.json` has entries for the
     selected live → offer costumes in the PickDialog; otherwise fall back to a
     song pick and show the `costume_fallback_hint`.

## Feature spec / files to create in llernote

1. `src/types/mypick-live.ts` — the data model above (avoid clashing with the
   existing grid `~/types/attendance` MyPick types).
2. `src/utils/mypick-live.ts` — `BUILTIN_AWARDS`, `getLiveSongEntries(setlist,
   songById)` (iterate `items` where `type==='song'`, resolve `songId`, dedupe,
   build `M01/EN01` labels — check `~/utils/setlist-insights` for an existing
   label helper first), `buildUnitGroups(entries, artistById)` (group by each
   `songArtistIds`, classify via mypick-options, order group→unit→solo then by
   count), `getLiveCostumes(performanceId)`, `createEmptyState`.
3. `src/utils/mypick-live-share.ts` — `encodeMyPickLive`/`decodeMyPickLive`
   (lz-string compact wire format, ported from reference).
4. `src/components/mypick/LiveMyPickBoard.tsx` — awards section + "Best Song per
   Unit" section of cards; `forwardRef` for image export. (Port reference
   `MyPickBoard`; restyle to match llernote `mypick.*` tokens.)
5. `src/components/mypick/LivePickerDialog.tsx` — only if llernote lacks a
   performance picker.
6. `src/pages/mypick/live/+Page.tsx` (+ `+config.ts` with `title`) — main editable
   page: choose live → derive entries/units/costumes → PickDialog wiring →
   add/remove custom awards → share URL + download image.
7. `src/pages/mypick/live/share/+Page.tsx` (+ `+config.ts`) — read-only shared
   view; "Make your own" copies decoded state to localStorage and navigates to
   `/mypick/live`.
8. `data/performance-costumes.json` (`{}`) + `scripts/fetch-live-costumes.ts`.
9. Nav link to `/mypick/live` (find llernote's nav/layout).
10. i18n: add a `mypick_live.*` block to `en.json` and `ja.json` (port the
    reference's `mypick.*` strings; rename namespace to avoid the grid's
    `mypick.*`). Use `_one`/`_other` plural suffixes per llernote convention.
11. Tests mirroring llernote's page test pattern (render page, encode/decode
    round-trip, unit grouping).

## Definition of done

- `/mypick/live`: choose a live, pick a best song per unit + per award, add custom
  awards, share URL, download image; picks persist across reloads.
- `/mypick/live/share?d=...` renders a read-only board with "Make your own".
- Best Costume uses costume data when present, song fallback otherwise.
- `bun lint` + `bun type-check` + tests pass (match llernote's scripts).
- Branch off llernote `main`, e.g. `feat/mypick-for-a-live`; open a PR.
