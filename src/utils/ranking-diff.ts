export type DiffType =
  | { type: 'up'; amount: number }
  | { type: 'down'; amount: number }
  | { type: 'same' }
  | { type: 'new' }
  | { type: 'na' };

/**
 * Find the position of a song in a ranking (flat array)
 * Returns the 1-based rank of the song
 * Returns null if the song is not found
 *
 * @example
 * findSongPosition('3', ['1', '2', '3', '4', '5'])
 * // Returns 3
 */
export function findSongPosition(songId: string, ranking: string[]): number | null {
  const index = ranking.indexOf(songId);
  return index === -1 ? null : index + 1;
}

/**
 * Calculate the position difference of a song between two rankings
 *
 * @param songId - The song ID to compare
 * @param leftRanking - The left (base) ranking to compare from
 * @param rightRanking - The right (comparison) ranking
 * @returns DiffType indicating the type and amount of difference
 *
 * @example
 * // Song moved from position 3 to position 1
 * calculatePositionDiff('song1', ['a', 'b', 'song1'], ['song1', 'a', 'b'])
 * // Returns { type: 'up', amount: 2 }
 */
export function calculatePositionDiff(
  songId: string,
  leftRanking: string[],
  rightRanking: string[]
): DiffType {
  const leftPos = findSongPosition(songId, leftRanking);
  const rightPos = findSongPosition(songId, rightRanking);

  // Song is NEW in right ranking (not in left)
  if (leftPos === null && rightPos !== null) {
    return { type: 'new' };
  }

  // Song is N/A (not in right ranking, but was in left)
  if (leftPos !== null && rightPos === null) {
    return { type: 'na' };
  }

  // Song not found in either ranking
  if (leftPos === null || rightPos === null) {
    return { type: 'na' };
  }

  // Calculate difference
  // Positive diff means song moved down (worse position)
  // Negative diff means song moved up (better position)
  const diff = rightPos - leftPos;

  if (diff === 0) {
    return { type: 'same' };
  }

  if (diff < 0) {
    // Song moved up (better position)
    return { type: 'up', amount: Math.abs(diff) };
  }

  // Song moved down (worse position)
  return { type: 'down', amount: diff };
}

/**
 * Color mapping for diff types
 */
export const DIFF_COLORS = {
  up: 'green.500', // Better position
  down: 'red.500', // Worse position
  same: 'gray.500', // Same position
  new: 'blue.500', // New in this ranking
  na: 'gray.400', // Not in this ranking
} as const;
