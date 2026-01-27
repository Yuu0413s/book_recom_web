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
} from '@yamada-ui/react';
import { SearchForm } from './components/SearchForm';
import { NovelList } from './components/NovelList';
import type { Book, BookWithScore } from './types/book';

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

export default function Home() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<BookWithScore[]>([]);
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

  const handleSimilaritySearch = (query: string) => {
    if (!query.trim()) {
      setDisplayedBooks(allBooks);
      return;
    }

    const queryChars = [
      ...new Set(query.toLowerCase().replace(/\s/g, '').split('')),
    ];

    const scoredBooks: BookWithScore[] = allBooks.map((book) => {
      const title = (book.title || '').toLowerCase();
      let matchCount = 0;

      if (title) {
        for (const char of queryChars) {
          if (title.includes(char)) {
            matchCount++;
          }
        }
      }

      const score = queryChars.length > 0 ? matchCount / queryChars.length : 0;

      return { ...book, score };
    });

    const topBooks = scoredBooks
      .filter((book) => (book.score ?? 0) > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);

    setDisplayedBooks(topBooks);
  };

  return (
    <Container maxW="full" px="lg" py="lg">
      <VStack gap="lg">
        <Heading>書籍検索&推薦</Heading>
        <HStack gap="lg" align="start" w="full">
          <VStack w="30%" minW="300px" position="sticky" top="lg">
            <SearchForm
              onFilterSearch={handleFilterSearch}
              onSimilaritySearch={handleSimilaritySearch}
            />
          </VStack>

          <VStack w="70%">
            {isLoading && (
              <Center>
                <Loading />
              </Center>
            )}
            {error && <Text color="red.500">{error.message}</Text>}
            {!isLoading && <NovelList books={displayedBooks} />}
          </VStack>
        </HStack>
      </VStack>
    </Container>
  );
}
