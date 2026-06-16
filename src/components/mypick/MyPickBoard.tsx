import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';

export interface BoardCard {
  /** `award:<key>` or `unit:<artistId>` */
  id: string;
  label: string;
  badge?: string;
  accentColor?: string;
  hint?: string;
  removable?: boolean;
  picked?: {
    name: string;
    sub?: string;
    image?: string;
    color?: string;
  };
}

export interface MyPickBoardProps {
  liveName: string;
  liveSub?: string;
  accentColor?: string;
  awards: BoardCard[];
  units: BoardCard[];
  editable?: boolean;
  onPick?: (cardId: string) => void;
  onClear?: (cardId: string) => void;
  onRemove?: (cardId: string) => void;
}

function PickCard({
  card,
  editable,
  onPick,
  onClear,
  onRemove
}: {
  card: BoardCard;
  editable: boolean;
  onPick?: (cardId: string) => void;
  onClear?: (cardId: string) => void;
  onRemove?: (cardId: string) => void;
}) {
  const { t } = useTranslation();
  const picked = card.picked;

  return (
    <Stack
      gap={2}
      borderColor="border.default"
      borderLeftColor={card.accentColor ?? 'accent.default'}
      borderRadius="l2"
      borderWidth="1px"
      borderLeftWidth="4px"
      p={3}
      bgColor="bg.default"
    >
      <HStack gap={2} justifyContent="space-between" alignItems="flex-start">
        <HStack gap={2} alignItems="center" minW={0}>
          <Text fontSize="sm" fontWeight="bold" lineClamp={2}>
            {card.label}
          </Text>
          {card.badge && (
            <Badge size="sm" variant="subtle">
              {card.badge}
            </Badge>
          )}
        </HStack>
        {editable && card.removable && (
          <IconButton
            aria-label={t('mypick.remove_award')}
            variant="ghost"
            size="xs"
            onClick={() => onRemove?.(card.id)}
          >
            <FaXmark />
          </IconButton>
        )}
      </HStack>

      <Stack
        gap={2}
        flexDirection="row"
        alignItems="center"
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={editable ? t('mypick.pick_song_for', { name: card.label }) : undefined}
        onClick={editable ? () => onPick?.(card.id) : undefined}
        onKeyDown={
          editable
            ? (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick?.(card.id);
                }
              }
            : undefined
        }
        cursor={editable ? 'pointer' : 'default'}
        borderRadius="l1"
        p={1}
        _hover={editable ? { bgColor: 'bg.muted' } : undefined}
      >
        <Box
          style={picked?.color ? { backgroundColor: picked.color } : undefined}
          flexShrink={0}
          w="64px"
          h="36px"
          borderRadius="sm"
          bgColor="bg.muted"
          overflow="hidden"
        >
          {picked?.image && (
            <img
              src={picked.image}
              alt=""
              crossOrigin="anonymous"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </Box>
        <Stack gap={0} flex={1} minW={0}>
          {picked ? (
            <>
              <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
                {picked.name}
              </Text>
              {picked.sub && (
                <Text color="fg.muted" fontSize="xs" lineClamp={1}>
                  {picked.sub}
                </Text>
              )}
            </>
          ) : (
            <Text color="fg.muted" fontSize="sm">
              {t('mypick.empty_pick')}
            </Text>
          )}
        </Stack>
      </Stack>

      {card.hint && (
        <Text color="fg.muted" fontSize="2xs">
          {card.hint}
        </Text>
      )}

      {editable && picked && (
        <HStack justifyContent="flex-end">
          <Button variant="link" size="xs" onClick={() => onClear?.(card.id)}>
            {t('mypick.clear_pick')}
          </Button>
        </HStack>
      )}
    </Stack>
  );
}

export const MyPickBoard = forwardRef<HTMLDivElement, MyPickBoardProps>(function MyPickBoard(
  { liveName, liveSub, accentColor, awards, units, editable = false, onPick, onClear, onRemove },
  ref
) {
  const { t } = useTranslation();

  return (
    <Stack ref={ref} gap={5} w="full" p={{ base: 4, md: 5 }} bgColor="bg.canvas" borderRadius="l3">
      <Stack gap={1} borderLeftColor={accentColor ?? 'accent.default'} borderLeftWidth="4px" pl={3}>
        <Text fontSize="lg" fontWeight="bold" overflowWrap="anywhere">
          {liveName}
        </Text>
        {liveSub && (
          <Text color="fg.muted" fontSize="sm">
            {liveSub}
          </Text>
        )}
      </Stack>

      <Stack gap={3}>
        <Text fontSize="md" fontWeight="bold">
          {t('mypick.awards.section')}
        </Text>
        <Grid gap={3} gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}>
          {awards.map((card) => (
            <PickCard
              key={card.id}
              card={card}
              editable={editable}
              onPick={onPick}
              onClear={onClear}
              onRemove={onRemove}
            />
          ))}
        </Grid>
      </Stack>

      {units.length > 0 && (
        <Stack gap={3}>
          <Text fontSize="md" fontWeight="bold">
            {t('mypick.units.section')}
          </Text>
          <Grid
            gap={3}
            gridTemplateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          >
            {units.map((card) => (
              <PickCard
                key={card.id}
                card={card}
                editable={editable}
                onPick={onPick}
                onClear={onClear}
              />
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
});
