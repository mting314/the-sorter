import { Badge } from '~/components/ui/badge';
import type { DiffType } from '~/utils/ranking-diff';

export interface DiffBadgeProps {
  diff: DiffType;
}

export function DiffBadge({ diff }: DiffBadgeProps) {
  switch (diff.type) {
    case 'up':
      return (
        <Badge variant="solid" size="sm" colorPalette="green">
          ↑{diff.amount}
        </Badge>
      );

    case 'down':
      return (
        <Badge variant="solid" size="sm" colorPalette="red">
          ↓{diff.amount}
        </Badge>
      );

    case 'same':
      return (
        <Badge variant="subtle" size="sm" colorPalette="gray">
          =
        </Badge>
      );

    case 'new':
      return (
        <Badge variant="solid" size="sm" colorPalette="blue">
          NEW
        </Badge>
      );

    case 'na':
      return (
        <Badge variant="subtle" size="sm" colorPalette="gray">
          N/A
        </Badge>
      );

    default:
      return null;
  }
}
