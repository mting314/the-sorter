import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Box, Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { usePerformanceData } from '~/hooks/setlist-prediction/usePerformanceData';
import { getFullPerformanceName } from '~/utils/names';
import type { Performance } from '~/types/setlist-prediction';

export interface LivePickerDialogProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (performanceId: string) => void;
}

export function LivePickerDialog({ open, onOpenChange, onSelect }: LivePickerDialogProps) {
  const { t } = useTranslation();
  const { performances, loading } = usePerformanceData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filtered = useMemo(() => {
    const withSetlist = performances.filter((p) => p.hasSetlist === true);
    const query = search.trim().toLowerCase();
    const matched = query
      ? withSetlist.filter(
          (p) =>
            p.tourName.toLowerCase().includes(query) ||
            p.performanceName?.toLowerCase().includes(query) ||
            p.venue?.toLowerCase().includes(query)
        )
      : withSetlist;
    return matched.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [performances, search]);

  const handleSelect = (performance: Performance) => {
    onSelect(performance.id);
    onOpenChange({ open: false });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} lazyMount unmountOnExit>
      <Dialog.Backdrop />
      <Dialog.Positioner
        display="flex"
        inset={0}
        position="fixed"
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <Dialog.Content display="flex" flexDirection="column" w="full" maxW="2xl" h="80vh" maxH="80vh">
          <Stack flex={1} gap={4} minH={0} p={{ base: 4, md: 6 }} overflow="hidden">
            <Dialog.Title>
              <Text fontSize="xl" fontWeight="bold">
                {t('mypick.choose_live')}
              </Text>
            </Dialog.Title>

            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder={t('common.search')}
            />

            <Box flex={1} minH={0} overscrollBehavior="contain" overflow="auto">
              {loading ? (
                <Text py={8} color="fg.muted" textAlign="center">
                  {t('common.loading')}
                </Text>
              ) : filtered.length === 0 ? (
                <Text py={8} color="fg.muted" textAlign="center">
                  {t('common.no_items')}
                </Text>
              ) : (
                <Stack gap={2}>
                  {filtered.map((performance) => (
                    <Stack
                      key={performance.id}
                      role="button"
                      tabIndex={0}
                      aria-label={getFullPerformanceName(performance)}
                      onClick={() => handleSelect(performance)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(performance);
                        }
                      }}
                      gap={0}
                      cursor="pointer"
                      borderColor="border.default"
                      borderRadius="l2"
                      borderWidth="1px"
                      p={3}
                      _hover={{ borderColor: 'accent.default', bgColor: 'accent.a2' }}
                    >
                      <Text fontSize="sm" fontWeight="bold" overflowWrap="anywhere">
                        {performance.performanceName?.trim() || performance.tourName}
                      </Text>
                      <Text color="fg.muted" fontSize="xs">
                        {new Date(performance.date).toLocaleDateString()} •{' '}
                        {performance.venue || 'TBA'}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top={3} right={3}>
            <IconButton aria-label={t('common.close')} variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
