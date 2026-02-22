'use client';

import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  HStack,
  Link,
  Text,
  Badge,
  SimpleGrid,
  Progress,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIndicator,
  EmptyStateTitle,
} from '@yamada-ui/react';
import type { BookWithScore } from '../types/book';

interface Props {
  books: BookWithScore[];
}

const sourceLabels: Record<string, string> = {
  NAROU: '小説家になろう',
  GOOGLE_BOOKS: 'Google Books',
  OPEN_LIBRARY: 'Open Library',
  AOZORA: '青空文庫',
  CINII: 'CiNii Books',
};

const sourceColors: Record<string, string> = {
  NAROU: 'green',
  GOOGLE_BOOKS: 'blue',
  OPEN_LIBRARY: 'orange',
  AOZORA: 'purple',
  CINII: 'red',
};

export const NovelList = ({ books }: Props) => {
  if (books.length === 0) {
    return (
      <EmptyState w="full" py="2xl">
        <EmptyStateIndicator fontSize="5xl">📚</EmptyStateIndicator>
        <EmptyStateContent>
          <EmptyStateTitle>書籍が見つかりませんでした</EmptyStateTitle>
          <EmptyStateDescription>
            別のキーワードで検索してみてください
          </EmptyStateDescription>
        </EmptyStateContent>
      </EmptyState>
    );
  }

  return (
    <VStack gap={4} w="full">
      <Text color="gray.500" fontSize="sm" alignSelf="start">
        {books.length} 件の書籍が見つかりました
      </Text>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="full">
        {books.map((book) => {
          if (!book || !book.sourceId) return null;

          const scorePercent =
            book.score != null && book.score > 0
              ? Math.round(book.score * 100)
              : null;

          return (
            <Card
              key={`${book.source}-${book.sourceId}`}
              variant="outline"
              w="100%"
              transition="all 0.2s"
              _hover={{ shadow: 'md', borderColor: 'gray.300' }}
            >
              <CardHeader pb={2}>
                <VStack align="start" gap={2}>
                  <HStack justify="space-between" w="full">
                    <Badge
                      colorScheme={sourceColors[book.source] || 'gray'}
                      fontSize="xs"
                    >
                      {sourceLabels[book.source] || book.source}
                    </Badge>
                    {scorePercent !== null && (
                      <Text color="secondary" fontSize="xs" fontWeight="bold">
                        類似度 {scorePercent}%
                      </Text>
                    )}
                  </HStack>
                  {scorePercent !== null && (
                    <Progress
                      value={scorePercent}
                      colorScheme="secondary"
                      w="full"
                      rounded="full"
                      h="6px"
                    />
                  )}
                  <Heading size="sm">
                    {book.url ? (
                      <Link href={book.url} isExternal>
                        {book.title ?? 'タイトル不明'}
                      </Link>
                    ) : (
                      book.title ?? 'タイトル不明'
                    )}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {book.author ?? '作者不明'}
                  </Text>
                </VStack>
              </CardHeader>
              <CardBody pt={0}>
                <Text fontSize="sm" lineClamp={3} color="gray.600">
                  {book.description ?? 'あらすじがありません。'}
                </Text>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
};
