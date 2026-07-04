import { describe, test, expect } from 'vitest';
import { findSongPosition, calculatePositionDiff } from '../ranking-diff';

describe('findSongPosition', () => {
  test('returns the 1-based rank of a song', () => {
    expect(findSongPosition('3', ['1', '2', '3', '4', '5'])).toBe(3);
    expect(findSongPosition('1', ['1', '2', '3'])).toBe(1);
  });

  test('returns null when the song is not present', () => {
    expect(findSongPosition('9', ['1', '2', '3'])).toBeNull();
    expect(findSongPosition('1', [])).toBeNull();
  });
});

describe('calculatePositionDiff', () => {
  test('"up" when the song is higher in the right ranking than the left', () => {
    // right ranking (own) has song1 at rank 1, left (compared) at rank 3 -> moved up 2
    expect(calculatePositionDiff('song1', ['a', 'b', 'song1'], ['song1', 'a', 'b'])).toEqual({
      type: 'up',
      amount: 2
    });
  });

  test('"down" when the song is lower in the right ranking than the left', () => {
    expect(calculatePositionDiff('song1', ['song1', 'a', 'b'], ['a', 'b', 'song1'])).toEqual({
      type: 'down',
      amount: 2
    });
  });

  test('"same" when the song is at the same position in both', () => {
    expect(calculatePositionDiff('song1', ['song1', 'a'], ['song1', 'b'])).toEqual({
      type: 'same'
    });
  });

  test('"new" when the song is only in the right ranking', () => {
    expect(calculatePositionDiff('song1', ['a', 'b'], ['song1', 'a', 'b'])).toEqual({
      type: 'new'
    });
  });

  test('"na" when the song is only in the left ranking', () => {
    expect(calculatePositionDiff('song1', ['song1', 'a', 'b'], ['a', 'b'])).toEqual({ type: 'na' });
  });

  test('"na" when the song is in neither ranking', () => {
    expect(calculatePositionDiff('song1', ['a', 'b'], ['c', 'd'])).toEqual({ type: 'na' });
  });
});
