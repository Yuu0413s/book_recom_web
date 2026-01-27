'use client';

import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  VStack,
  Link,
  Text,
  Badge,
} from '@yamada-ui/react';
import type { BookWithScore } from '../types/book';

interface Props {
  books: BookWithScore[];
}

// データソースの表示名マッピング
const sourceLabels: Record<string, string> = {
  NAROU: '小説家になろう',
  GOOGLE_BOOKS: 'Google Books',
  OPEN_LIBRARY: 'Open Library',
  AOZORA: '青空文庫',
  CINII: 'CiNii Books',
};

// データソースのバッジ色マッピング
const sourceColors: Record<string, string> = {
  NAROU: 'green',
  GOOGLE_BOOKS: 'blue',
  OPEN_LIBRARY: 'orange',
  AOZORA: 'purple',
  CINII: 'red',
};

export const NovelList = ({ books }: Props) => {
  if (books.length === 0) {
    return <Text>該当する書籍はありません。</Text>;
  }

  return (
    <VStack gap={4} w="full">
      <Text>{books.length}件の書籍が見つかりました。</Text>
      {books.map((book) => {
        if (!book || !book.sourceId) return null;

        return (
          <Card key={`${book.source}-${book.sourceId}`} variant="outline" w="100%">
            <CardHeader>
              <VStack align="start" gap={1}>
                <Badge colorScheme={sourceColors[book.source] || 'gray'}>
                  {sourceLabels[book.source] || book.source}
                </Badge>
                <Heading size="md">
                  {book.url ? (
                    <Link href={book.url} isExternal>
                      {book.title ?? 'タイトル不明'}
                    </Link>
                  ) : (
                    book.title ?? 'タイトル不明'
                  )}
                </Heading>
                <Text>{book.author ?? '作者不明'}</Text>
                {book.score != null && book.score > 0 && (
                  <Text color="secondary" fontSize="sm" fontWeight="bold">
                    類似度: {(book.score * 100).toFixed(1)}%
                  </Text>
                )}
              </VStack>
            </CardHeader>
            <CardBody>
              <Text lineClamp={3}>
                {book.description ?? 'あらすじがありません。'}
              </Text>
            </CardBody>
          </Card>
        );
      })}
    </VStack>
  );
};
