import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Center,
  Text,
  Loading,
  Button,
  Input,
  Textarea,
} from '@yamada-ui/react';
import { NovelList } from './components/NovelList';
import type { Book, BookWithScore, DataSource } from './types/book';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface BooksApiResponse {
  books: Book[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

const SOURCE_TABS: { key: 'ALL' | DataSource; label: string }[] = [
  { key: 'ALL',          label: 'すべて' },
  { key: 'NAROU',        label: 'なろう' },
  { key: 'GOOGLE_BOOKS', label: 'Google Books' },
  { key: 'OPEN_LIBRARY', label: 'Open Library' },
  { key: 'CINII',        label: 'CiNii' },
];

type SearchMode = 'browse' | 'filter' | 'ai';

export default function App() {
  const [allBooks, setAllBooks]             = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<BookWithScore[]>([]);
  const [selectedSource, setSelectedSource] = useState<'ALL' | DataSource>('ALL');
  const [isLoading, setIsLoading]           = useState(true);
  const [isAiLoading, setIsAiLoading]       = useState(false);
  const [error, setError]                   = useState<Error | null>(null);
  const [searchMode, setSearchMode]         = useState<SearchMode>('browse');

  // キーワード検索
  const [filterQuery, setFilterQuery]   = useState('');
  const [authorQuery, setAuthorQuery]   = useState('');

  // AI検索
  const [showAiPanel, setShowAiPanel]     = useState(false);
  const [aiQuery, setAiQuery]             = useState('');
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 初回ロード
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/books?limit=500`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: BooksApiResponse = await res.json();
        setAllBooks(data.books);
        setDisplayedBooks(data.books);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('読み込みに失敗しました'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // リアルタイムキーワードフィルタ（300ms debounce）
  useEffect(() => {
    if (searchMode === 'ai') return;
    const timer = setTimeout(() => {
      const q = filterQuery.toLowerCase().trim();
      const a = authorQuery.toLowerCase().trim();
      if (!q && !a) {
        setDisplayedBooks(allBooks);
        setSearchMode('browse');
        return;
      }
      setDisplayedBooks(
        allBooks.filter((b) => {
          const matchQ = !q || (b.title?.toLowerCase() ?? '').includes(q) || (b.description?.toLowerCase() ?? '').includes(q);
          const matchA = !a || (b.author?.toLowerCase() ?? '').includes(a);
          return matchQ && matchA;
        })
      );
      setSearchMode('filter');
    }, 300);
    return () => clearTimeout(timer);
  }, [filterQuery, authorQuery, allBooks, searchMode]);

  // AI検索
  const handleAiSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    setSelectedSource('ALL');
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(aiQuery)}&limit=20`);
      if (!res.ok) throw new Error(`検索エラー: ${res.status}`);
      const data = await res.json();
      setDisplayedBooks(data.books ?? []);
      setSearchMode('ai');
      setShowAiPanel(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('検索中にエラーが発生しました'));
    } finally {
      setIsAiLoading(false);
    }
  };

  // リセット
  const handleReset = () => {
    setDisplayedBooks(allBooks);
    setSearchMode('browse');
    setSelectedSource('ALL');
    setFilterQuery('');
    setAuthorQuery('');
    setAiQuery('');
    setShowAiPanel(false);
  };

  // AIパネル開閉
  const toggleAiPanel = () => {
    setShowAiPanel((v) => {
      if (!v) setTimeout(() => aiTextareaRef.current?.focus(), 50);
      return !v;
    });
  };

  const visibleBooks =
    selectedSource === 'ALL'
      ? displayedBooks
      : displayedBooks.filter((b) => b.source === selectedSource);

  return (
    <Box minH="100vh" bg="gray.50">
      {/* ── Header ── */}
      <Box bg="gray.900" color="white" px={{ base: 4, md: 8 }} py={4}>
        <HStack justify="space-between" align="center" maxW="960px" mx="auto">
          <Heading size="md" letterSpacing="tight" fontWeight="bold">
            📚 BookRecom
          </Heading>
          {!isLoading && (
            <Box bg="gray.700" px={2.5} py={0.5} rounded="full" fontSize="xs" color="gray.300">
              {allBooks.length} 冊収録
            </Box>
          )}
        </HStack>
      </Box>

      {/* ── Sticky search bar ── */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        shadow="sm"
        px={{ base: 4, md: 8 }}
        py={3}
      >
        <Box maxW="960px" mx="auto">
          {/* Keyword + AI button row */}
          <HStack gap={2} mb={searchMode !== 'ai' ? 2 : 0}>
            {searchMode === 'ai' ? (
              /* AI mode: show query summary */
              <HStack
                flex={1}
                bg="purple.50"
                border="1px solid"
                borderColor="purple.200"
                rounded="lg"
                px={3}
                py={2}
                gap={2}
              >
                <Text fontSize="sm">✨</Text>
                <Text fontSize="sm" color="purple.700" flex={1} lineClamp={1}>
                  {aiQuery}
                </Text>
                <Box
                  as="button"
                  type="button"
                  fontSize="xs"
                  color="purple.400"
                  cursor="pointer"
                  border="none"
                  bg="transparent"
                  p={0}
                  _hover={{ color: 'purple.600' }}
                  onClick={handleReset}
                >
                  ✕
                </Box>
              </HStack>
            ) : (
              <>
                <Input
                  placeholder="タイトル・キーワードで絞り込み..."
                  value={filterQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterQuery(e.target.value)}
                  rounded="lg"
                  size="md"
                  flex={1}
                  bg="gray.50"
                  border="1.5px solid"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'gray.400' }}
                />
                {(filterQuery || authorQuery) && (
                  <Box
                    as="button"
                    type="button"
                    fontSize="sm"
                    color="gray.400"
                    cursor="pointer"
                    border="none"
                    bg="transparent"
                    px={2}
                    py={1}
                    rounded="md"
                    _hover={{ color: 'gray.600', bg: 'gray.100' }}
                    onClick={handleReset}
                    whiteSpace="nowrap"
                  >
                    クリア
                  </Box>
                )}
              </>
            )}

            <Button
              onClick={toggleAiPanel}
              rounded="lg"
              size="md"
              bg={showAiPanel ? 'purple.600' : 'gray.900'}
              color="white"
              _hover={{ bg: showAiPanel ? 'purple.700' : 'gray.700' }}
              whiteSpace="nowrap"
              flexShrink={0}
              disabled={searchMode === 'ai'}
            >
              ✨ AI推薦
            </Button>
          </HStack>

          {/* Author filter - shows when keyword search active */}
          {searchMode !== 'ai' && (filterQuery || authorQuery || showAiPanel) && !showAiPanel && (
            <Input
              placeholder="作者名でさらに絞り込み..."
              value={authorQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthorQuery(e.target.value)}
              rounded="lg"
              size="sm"
              bg="gray.50"
              border="1.5px solid"
              borderColor="gray.200"
              _focus={{ bg: 'white', borderColor: 'gray.400' }}
              mb={2}
            />
          )}

          {/* AI Panel */}
          {showAiPanel && (
            <Box
              mt={2}
              bg="purple.50"
              border="1px solid"
              borderColor="purple.200"
              rounded="xl"
              p={4}
            >
              <form onSubmit={handleAiSearch}>
                <VStack gap={3} align="start">
                  <Text fontSize="xs" color="purple.600" fontWeight="medium">
                    読みたい雰囲気・テーマ・好きな作品などを入力してください
                  </Text>
                  <Textarea
                    ref={aiTextareaRef}
                    placeholder="例: 異世界転生で主人公が無双する話&#10;例: 切ない片思いを描いた青春恋愛小説"
                    value={aiQuery}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAiQuery(e.target.value)}
                    minH="90px"
                    resize="none"
                    rounded="lg"
                    fontSize="sm"
                    bg="white"
                    border="1.5px solid"
                    borderColor="purple.200"
                    _focus={{ borderColor: 'purple.400' }}
                  />
                  <HStack gap={2} w="full" justify="end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={() => setShowAiPanel(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      bg="purple.600"
                      color="white"
                      _hover={{ bg: 'purple.700' }}
                      disabled={!aiQuery.trim() || isAiLoading}
                      loading={isAiLoading}
                      loadingText="検索中..."
                    >
                      おすすめを探す
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </Box>
          )}

          {/* Source filter chips - not shown in AI mode */}
          {searchMode !== 'ai' && !showAiPanel && (
            <HStack gap={1.5} flexWrap="wrap" mt={2}>
              {SOURCE_TABS.map(({ key, label }) => {
                const count =
                  key === 'ALL'
                    ? displayedBooks.length
                    : displayedBooks.filter((b) => b.source === key).length;
                const isActive = selectedSource === key;
                return (
                  <Box
                    key={key}
                    as="button"
                    type="button"
                    px={3}
                    py={1}
                    rounded="full"
                    fontSize="xs"
                    fontWeight={isActive ? 'bold' : 'medium'}
                    cursor="pointer"
                    border="1.5px solid"
                    transition="all 0.1s"
                    bg={isActive ? 'gray.900' : 'white'}
                    color={isActive ? 'white' : 'gray.500'}
                    borderColor={isActive ? 'gray.900' : 'gray.200'}
                    _hover={isActive ? {} : { borderColor: 'gray.400', color: 'gray.700' }}
                    onClick={() => setSelectedSource(key)}
                  >
                    {label}
                    <Box as="span" ml={1} opacity={0.6}>{count}</Box>
                  </Box>
                );
              })}
            </HStack>
          )}
        </Box>
      </Box>

      {/* ── Results ── */}
      <Box maxW="960px" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        {/* Loading */}
        {(isLoading || isAiLoading) && (
          <Center py={20}>
            <VStack gap={4}>
              <Loading fontSize="3xl" color="purple.400" />
              <Text color="gray.400" fontSize="sm">
                {isAiLoading ? 'AIが書籍を検索中...' : '読み込み中...'}
              </Text>
            </VStack>
          </Center>
        )}

        {/* Error */}
        {error && (
          <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="xl" p={4} mb={4}>
            <Text color="red.600" fontSize="sm">⚠️ {error.message}</Text>
          </Box>
        )}

        {/* Results */}
        {!isLoading && !isAiLoading && <NovelList books={visibleBooks} />}
      </Box>
    </Box>
  );
}
