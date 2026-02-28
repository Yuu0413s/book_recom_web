import { useState } from 'react';
import { Box, VStack, HStack, Link, Text, SimpleGrid } from '@yamada-ui/react';
import type { BookWithScore } from '../types/book';

interface Props {
  books: BookWithScore[];
}

const sourceConfig: Record<string, {
  label: string;
  textColor: string;
  bg: string;
  borderColor: string;
  dotColor: string;
}> = {
  NAROU:        { label: 'なろう',       textColor: '#15803d', bg: '#f0fdf4', borderColor: '#86efac', dotColor: '#22c55e' },
  GOOGLE_BOOKS: { label: 'Google Books', textColor: '#1d4ed8', bg: '#eff6ff', borderColor: '#93c5fd', dotColor: '#3b82f6' },
  OPEN_LIBRARY: { label: 'Open Library', textColor: '#c2410c', bg: '#fff7ed', borderColor: '#fdba74', dotColor: '#f97316' },
  CINII:        { label: 'CiNii',        textColor: '#b91c1c', bg: '#fef2f2', borderColor: '#fca5a5', dotColor: '#ef4444' },
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <HStack gap={1.5} align="center">
      <Box
        w="36px"
        h="4px"
        bg="gray.100"
        rounded="full"
        overflow="hidden"
      >
        <Box
          h="full"
          w={`${pct}%`}
          bg="purple.400"
          rounded="full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </Box>
      <Text fontSize="xs" color="purple.600" fontWeight="bold" minW="max-content">
        {pct}%
      </Text>
    </HStack>
  );
}

function BookCard({ book }: { book: BookWithScore }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = sourceConfig[book.source] ?? {
    label: book.source,
    textColor: '#374151',
    bg: '#f9fafb',
    borderColor: '#d1d5db',
    dotColor: '#9ca3af',
  };
  const hasScore = book.score != null && book.score > 0;
  const hasLongDesc = (book.description?.length ?? 0) > 120;

  return (
    <Box
      bg="white"
      rounded="xl"
      overflow="hidden"
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
      transition="all 0.2s ease"
      _hover={{ shadow: 'md', borderColor: 'gray.200', transform: 'translateY(-2px)' }}
      display="flex"
      flexDirection="column"
    >
      {/* Source color strip */}
      <Box h="3px" bg={cfg.dotColor} />

      <Box p={4} flex={1} display="flex" flexDirection="column" gap={2}>
        {/* Header row */}
        <HStack justify="space-between" align="center">
          <HStack gap={1.5} align="center">
            <Box w="6px" h="6px" rounded="full" bg={cfg.dotColor} flexShrink={0} />
            <Box
              as="span"
              fontSize="xs"
              fontWeight="semibold"
              color={cfg.textColor}
              bg={cfg.bg}
              border="1px solid"
              borderColor={cfg.borderColor}
              px={2}
              py={0.5}
              rounded="md"
            >
              {cfg.label}
            </Box>
          </HStack>
          {hasScore && <ScoreBadge score={book.score!} />}
        </HStack>

        {/* Title */}
        <Text
          fontWeight="bold"
          fontSize="sm"
          lineHeight="short"
          color="gray.900"
          mt={0.5}
        >
          {book.url ? (
            <Link
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              color="gray.900"
              _hover={{ color: 'blue.600', textDecoration: 'underline' }}
            >
              {book.title ?? 'タイトル不明'}
            </Link>
          ) : (
            (book.title ?? 'タイトル不明')
          )}
        </Text>

        {/* Author */}
        {book.author && (
          <Text fontSize="xs" color="gray.500" lineHeight="tight">
            ✍️ {book.author}
          </Text>
        )}

        {/* Description */}
        <Box flex={1} mt={1}>
          {book.description ? (
            <>
              <Text
                fontSize="xs"
                color="gray.600"
                lineHeight="tall"
                lineClamp={expanded ? undefined : 3}
              >
                {book.description}
              </Text>
              {hasLongDesc && (
                <Box
                  as="button"
                  type="button"
                  fontSize="xs"
                  color="blue.500"
                  mt={1}
                  cursor="pointer"
                  border="none"
                  bg="transparent"
                  p={0}
                  _hover={{ color: 'blue.700' }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? '▲ 折りたたむ' : '▼ もっと見る'}
                </Box>
              )}
            </>
          ) : (
            <Text fontSize="xs" color="gray.300" fontStyle="italic">
              あらすじなし
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export const NovelList = ({ books }: Props) => {
  if (books.length === 0) {
    return (
      <Box
        w="full"
        py={20}
        textAlign="center"
        bg="white"
        rounded="xl"
        border="1px solid"
        borderColor="gray.100"
      >
        <Text fontSize="5xl" mb={4}>📭</Text>
        <Text fontWeight="bold" color="gray.700" fontSize="lg" mb={1}>
          書籍が見つかりませんでした
        </Text>
        <Text fontSize="sm" color="gray.400">
          別のキーワードや表現で試してみてください
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} w="full" align="start">
      <Text color="gray.400" fontSize="sm">
        {books.length} 件
      </Text>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="full">
        {books.map((book) => {
          if (!book?.sourceId) return null;
          return <BookCard key={`${book.source}-${book.sourceId}`} book={book} />;
        })}
      </SimpleGrid>
    </VStack>
  );
};
