import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';

export interface PickOption {
  id: string;
  name: string;
  sub?: string;
  image?: string;
  color?: string;
  searchText?: string;
}

export interface SongPickDialogProps {
  open: boolean;
  title: string;
  options: PickOption[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function SongPickDialog({
  open,
  title,
  options,
  selectedId,
  onClose,
  onSelect
}: SongPickDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      `${option.name} ${option.sub ?? ''} ${option.searchText ?? ''}`.toLowerCase().includes(query)
    );
  }, [options, search]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) {
          setSearch('');
          onClose();
        }
      }}
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop />
      <Dialog.Positioner
        display="flex"
        inset={0}
        position="fixed"
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <Dialog.Content display="flex" flexDirection="column" w="full" maxW="3xl" h="80vh" maxH="80vh">
          <Stack flex={1} gap={4} minH={0} p={{ base: 4, md: 6 }} overflow="hidden">
            <HStack justifyContent="space-between" pr={8}>
              <Dialog.Title>
                <Text fontSize="xl" fontWeight="bold">
                  {title}
                </Text>
              </Dialog.Title>
            </HStack>

            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder={t('common.search')}
            />

            <Box flex={1} minH={0} overscrollBehavior="contain" overflow="auto">
              {filtered.length === 0 ? (
                <Text py={8} color="fg.muted" textAlign="center">
                  {t('common.no_items')}
                </Text>
              ) : (
                <Grid gap={3} gridTemplateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}>
                  {filtered.map((option) => {
                    const selected = option.id === selectedId;
                    return (
                      <Stack
                        key={option.id}
                        role="button"
                        tabIndex={0}
                        aria-label={option.name}
                        aria-pressed={selected}
                        onClick={() => onSelect(option.id)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(option.id);
                          }
                        }}
                        gap={2}
                        cursor="pointer"
                        borderColor={selected ? 'accent.default' : 'border.default'}
                        borderRadius="l2"
                        borderWidth={selected ? '2px' : '1px'}
                        p={2}
                        bgColor={selected ? 'accent.a2' : 'bg.default'}
                        _hover={{ borderColor: 'accent.default', bgColor: 'accent.a2' }}
                      >
                        <Box
                          style={option.color ? { backgroundColor: option.color } : undefined}
                          aspectRatio={16 / 9}
                          borderRadius="l1"
                          w="full"
                          bgColor="bg.muted"
                          overflow="hidden"
                        >
                          {option.image && (
                            <img
                              src={option.image}
                              alt=""
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </Box>
                        <Stack gap={0} minW={0}>
                          <Text fontSize="sm" fontWeight="bold" lineClamp={2}>
                            {option.name}
                          </Text>
                          {option.sub && (
                            <Text color="fg.muted" fontSize="xs" lineClamp={1}>
                              {option.sub}
                            </Text>
                          )}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Grid>
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
