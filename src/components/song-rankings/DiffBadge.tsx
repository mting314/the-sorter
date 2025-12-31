import { Badge } from '~/components/ui/badge';
import type { DiffType } from '~/utils/ranking-diff';
import { DIFF_COLORS } from '~/utils/ranking-diff';

export interface DiffBadgeProps {
  diff: DiffType;
}

export function DiffBadge({ diff }: DiffBadgeProps) {
  switch (diff.type) {
    case 'up':
      return (
        <Badge variant="solid" colorPalette="green" size="sm">
          ↑{diff.amount}
        </Badge>
      );

    case 'down':
      return (
        <Badge variant="solid" colorPalette="red" size="sm">
          ↓{diff.amount}
        </Badge>
      );

    case 'same':
      return (
        <Badge variant="subtle" colorPalette="gray" size="sm">
          =
        </Badge>
      );

    case 'new':
      return (
        <Badge variant="solid" colorPalette="blue" size="sm">
          NEW
        </Badge>
      );

    case 'na':
      return (
        <Badge variant="subtle" colorPalette="gray" size="sm">
          N/A
        </Badge>
      );

    default:
      return null;
  }
}
