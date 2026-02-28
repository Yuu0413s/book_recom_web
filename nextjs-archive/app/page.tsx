'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  Heading,
  Center,
  Text,
  Loading,
  HStack,
  Button,
} from '@yamada-ui/react';
import { SearchForm } from './components/SearchForm';
import { NovelList } from './components/NovelList';
import type { Book, BookWithScore, DataSource } from './types/book';

interface FilterCriteria {
  query: string;
  author: string;
}

interface BooksApiResponse {
  books: Book[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const SOURCE_TABS: { key: 'ALL' | DataSource; label: string }[] = [
  { key: 'ALL', label: 'すべて' },
  { key: 'NAROU', label: 'なろう' },
  { key: 'GOOGLE_BOOKS', label: 'Google Books' },
  { key: 'OPEN_LIBRARY', label: 'Open Library' },
  { key: 'AOZORA', label: '青空文庫' },
  { key: 'CINII', label: 'CiNii' },
];

export default function Home() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<BookWithScore[]>([]);
  const [selectedSource, setSelectedSource] = useState<'ALL' | DataSource>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);

        const data: BooksApiResponse = await response.json();

        setAllBooks(data.books);
        setDisplayedBooks(data.books);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('不明なエラーが発生しました')
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleFilterSearch = (criteria: FilterCriteria) => {
    const { query, author } = criteria;
    const lowerCaseQuery = query.toLowerCase().trim();
    const lowerCaseAuthor = author.toLowerCase().trim();

    if (!lowerCaseQuery && !lowerCaseAuthor) {
      setDisplayedBooks(allBooks);
      return;
    }

    const filteredBooks = allBooks.filter((book) => {
      const matchesQuery =
        !lowerCaseQuery ||
        (book.title?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (book.description?.toLowerCase() || '').includes(lowerCaseQuery);

      const matchesAuthor =
        !lowerCaseAuthor ||
        (book.author?.toLowerCase() || '').includes(lowerCaseAuthor);

      return matchesQuery && matchesAuthor;
    });

    setDisplayedBooks(filteredBooks);
  };

  const handleReset = () => {
    setDisplayedBooks(allBooks);
  };

  const handleSimilaritySearch = async (query: string) => {
    if (!query.trim()) {
      setDisplayedBooks(allBooks);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`検索エラー: ${response.status}`);
      }

      const data = await response.json();
      setDisplayedBooks(data.books || []);
    } catch (err) {
      console.error('Semantic search error:', err);
      setError(
        err instanceof Error ? err : new Error('検索中にエラーが発生しました')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const visibleBooks =
    selectedSource === 'ALL'
      ? displayedBooks
      : displayedBooks.filter((b) => b.source === selectedSource);

  return (
    <Container maxW="full" px={{ base: 'md', md: 'lg' }} py="lg">
      <VStack gap="xl">
        <VStack gap={2} textAlign="center">
          <Heading size="2xl">📚 書籍検索 &amp; 推薦</Heading>
          <Text color="gray.500" fontSize="md">
            キーワード検索や AI によるセマンティック検索で、あなたにぴったりの本を見つけよう
          </Text>
        </VStack>

        <HStack gap="xl" align="start" w="full" flexDir={{ base: 'column', md: 'row' }}>
          <VStack w={{ base: 'full', md: '30%' }} minW={{ md: '280px' }} position={{ md: 'sticky' }} top="lg">
            <SearchForm
              onFilterSearch={handleFilterSearch}
              onSimilaritySearch={handleSimilaritySearch}
              onReset={handleReset}
            />
          </VStack>

          <VStack w={{ base: 'full', md: '70%' }} gap={4}>
            <HStack gap={2} flexWrap="wrap" w="full">
              {SOURCE_TABS.map(({ key, label }) => {
                const count =
                  key === 'ALL'
                    ? displayedBooks.length
                    : displayedBooks.filter((b) => b.source === key).length;
                return (
                  <Button
                    key={key}
                    size="sm"
                    variant={selectedSource === key ? 'solid' : 'outline'}
                    colorScheme={selectedSource === key ? 'primary' : 'gray'}
                    onClick={() => setSelectedSource(key)}
                  >
                    {label} ({count})
                  </Button>
                );
              })}
            </HStack>

            {isLoading && (
              <Center py="2xl">
                <VStack gap={3}>
                  <Loading fontSize="xl" />
                  <Text color="gray.400" fontSize="sm">読み込み中...</Text>
                </VStack>
              </Center>
            )}
            {error && (
              <Text color="red.500" p={4} bg="red.50" rounded="md" w="full">
                ⚠️ {error.message}
              </Text>
            )}
            {!isLoading && <NovelList books={visibleBooks} />}
          </VStack>
        </HStack>
      </VStack>
    </Container>
  );
}
