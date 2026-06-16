// Types for the "MyPick for a Live" feature.
//
// A MyPick board is scoped to a single live (performance). The user picks:
//   - one favourite song per performing unit/performer in that live, and
//   - one song (or costume) for each award category (best song, most surprised,
//     cried the most, best costume, ...), including custom awards they add.

export type AwardSlotKind = 'song' | 'costume';

/** A built-in award category. Labels are resolved via i18n (`mypick.awards.<key>`). */
export interface BuiltinAward {
  key: string;
  /** Costume awards can resolve to a costume when costume data exists for the live. */
  kind: AwardSlotKind;
}

/** A user-defined award category. */
export interface CustomAward {
  id: string;
  label: string;
}

/** A single pick — either a setlist song or a costume worn during the live. */
export interface MyPickValue {
  type: AwardSlotKind;
  /** songId for `song`, costumeId for `costume`. */
  id: string;
}

export interface MyPickState {
  performanceId: string;
  /** award key (builtin key or custom award id) -> pick */
  awards: Record<string, MyPickValue>;
  /** artist/unit id -> picked songId */
  unitPicks: Record<string, string>;
  /** extra award categories the user added */
  customAwards: CustomAward[];
}

/**
 * A costume worn during a live, sourced from LLFans (`Costume` on each setlist
 * item). Stored in `data/performance-costumes.json` keyed by performanceId.
 */
export interface LiveCostume {
  id: string;
  name: string;
  /** Song the costume was worn for, if LLFans tied it to one. */
  songId?: string;
  songName?: string;
  /** Optional image URL (LLFans / fbcdn). */
  image?: string;
}

export type PerformanceCostumes = Record<string, LiveCostume[]>;
