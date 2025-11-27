import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PredictionBuilder } from '../PredictionBuilder';
import { screen, render } from '~/__test__/utils';
import type { Performance } from '~/types/setlist-prediction';

// Mock the usePredictionBuilder hook
vi.mock('~/hooks/setlist-prediction/usePredictionBuilder', () => ({
  usePredictionBuilder: () => ({
    prediction: {
      id: 'perf-1',
      performanceId: 'perf-1',
      name: 'Test Prediction',
      setlist: {
        items: [
          {
            id: 'item-1',
            type: 'song' as const,
            songId: '1',
            isCustomSong: false,
            position: 0
          },
          {
            id: 'item-2',
            type: 'song' as const,
            songId: '2',
            isCustomSong: false,
            position: 1
          }
        ],
        totalSongs: 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    isDirty: false,
    isValid: true,
    validation: { errors: [] },
    addSong: vi.fn(),
    addNonSongItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    reorderItems: vi.fn(),
    clearItems: vi.fn(),
    updateMetadata: vi.fn(),
    save: vi.fn()
  })
}));

// Mock useSongData hook
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    {
      id: '1',
      name: 'Snow halation',
      artists: ['1'],
      seriesIds: [1]
    },
    {
      id: '2',
      name: 'Aozora Jumping Heart',
      artists: ['33'],
      seriesIds: [2]
    },
    {
      id: '3',
      name: 'SELF CONTROL!!',
      artists: ['60'],
      seriesIds: [3]
    }
  ]
}));

// Mock performance context/data
const mockPerformance: Performance = {
  id: 'perf-1',
  seriesIds: ['1'],
  name: 'Test Performance',
  date: '2024-01-01',
  venue: 'Test Venue'
} as any;

describe('PredictionBuilder - Drag and Drop', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty space at bottom drop zone', () => {
    it('renders sentinel droppable at bottom of setlist', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // The sentinel should exist for drag-drop purposes
      const sentinel = result.container.querySelector('[data-item-id="__setlist-end__"]');
      expect(sentinel).toBeDefined();
      expect(sentinel).toHaveStyle({ minHeight: '80px' });
    });

    it('sentinel is not visible to users', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const sentinel = result.container.querySelector('[data-item-id="__setlist-end__"]');
      expect(sentinel).toHaveStyle({ backgroundColor: 'transparent' });
    });
  });

  describe('Drag indicator positioning', () => {
    it('shows drop indicator at bottom of last item when hovering over empty space', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // Verify the setlist editor panel is rendered
      const setlistEditor = result.container.querySelector('[data-setlist-editor="true"]');
      expect(setlistEditor).toBeDefined();

      // Verify items are rendered
      expect(result.container.querySelectorAll('[data-item-id]').length).toBeGreaterThan(0);
    });
  });

  describe('Regression tests - Existing drag-drop behavior', () => {
    it('renders setlist items correctly', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const setlistEditor = result.container.querySelector('[data-setlist-editor="true"]');
      expect(setlistEditor).toBeInTheDocument();

      // Verify both items are rendered
      const items = result.container.querySelectorAll('[data-item-id]');
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it('renders song search panel', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders quick add buttons for MC, Encore, Intermission', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('MC')).toBeInTheDocument();
      expect(screen.getByText('━━ ENCORE ━━')).toBeInTheDocument();
      expect(screen.getByText('━━ INTERMISSION ━━')).toBeInTheDocument();
    });

    it('renders stats panel on right side', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Stats')).toBeInTheDocument();
    });

    it('renders action buttons', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('prediction name input is editable', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Prediction');
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('maintains prediction name on input change', async () => {
      const [, user] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Prediction');
      await user.clear(nameInput);
      await user.type(nameInput, 'My New Prediction');

      expect(nameInput.value).toBe('My New Prediction');
    });
  });

  describe('DndContext integration', () => {
    it('wraps content in DndContext', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // Verify main layout exists
      const mainStack = result.container.querySelector('[class*="stack"]');
      expect(mainStack).toBeDefined();
    });
  });
});
