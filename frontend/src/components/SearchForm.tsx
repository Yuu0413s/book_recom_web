import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, VStack, HStack, Text, Textarea, Input, Box } from '@yamada-ui/react';

interface Props {
  onFilterSearch: (criteria: { query: string; author: string }) => void;
  onSimilaritySearch: (query: string) => void;
  onReset: () => void;
  isAiLoading?: boolean;
}

type Tab = 'filter' | 'ai';

export const SearchForm = ({ onFilterSearch, onSimilaritySearch, onReset, isAiLoading }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('filter');
  const [filterQuery, setFilterQuery] = useState('');
  const [author, setAuthor] = useState('');
  const [similarityQuery, setSimilarityQuery] = useState('');

  const handleFilterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFilterSearch({ query: filterQuery, author });
  };

  const handleFilterReset = () => {
    setFilterQuery('');
    setAuthor('');
    onReset();
  };

  const handleSimilaritySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!similarityQuery.trim()) { onReset(); return; }
    onSimilaritySearch(similarityQuery);
  };

  const handleSimilarityReset = () => {
    setSimilarityQuery('');
    onReset();
  };

  return (
    <Box
      bg="white"
      rounded="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
    >
      {/* Tab header */}
      <HStack gap={0}>
        {(['filter', 'ai'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const isAiTab = tab === 'ai';
          return (
            <Box
              key={tab}
              as="button"
              type="button"
              flex={1}
              py={3}
              px={4}
              fontSize="sm"
              fontWeight={isActive ? 'bold' : 'medium'}
              color={isActive ? (isAiTab ? 'purple.700' : 'gray.800') : 'gray.400'}
              bg={isActive ? 'white' : 'gray.50'}
              borderBottom="2px solid"
              borderColor={isActive ? (isAiTab ? 'purple.500' : 'gray.900') : 'gray.100'}
              cursor="pointer"
              transition="all 0.15s"
              textAlign="center"
              border="none"
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'filter' ? '🔍 絞り込み' : '✨ AI推薦'}
            </Box>
          );
        })}
      </HStack>

      {/* Tab panels */}
      <Box p={4}>
        {activeTab === 'filter' ? (
          <form onSubmit={handleFilterSubmit}>
            <VStack gap={3}>
              <Box w="full">
                <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
                  キーワード
                </Text>
                <Input
                  placeholder="タイトル・あらすじを検索"
                  value={filterQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterQuery(e.target.value)}
                  size="md"
                  rounded="lg"
                />
              </Box>
              <Box w="full">
                <Text fontSize="xs" color="gray.500" mb={1} fontWeight="medium">
                  作者
                </Text>
                <Input
                  placeholder="作者名"
                  value={author}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)}
                  size="md"
                  rounded="lg"
                />
              </Box>
              <HStack w="full" gap={2} pt={1}>
                <Button
                  type="button"
                  variant="ghost"
                  colorScheme="gray"
                  flex={1}
                  rounded="lg"
                  onClick={handleFilterReset}
                >
                  クリア
                </Button>
                <Button
                  type="submit"
                  flex={2}
                  rounded="lg"
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: 'gray.700' }}
                >
                  検索
                </Button>
              </HStack>
            </VStack>
          </form>
        ) : (
          <form onSubmit={handleSimilaritySubmit}>
            <VStack gap={3}>
              <Box
                bg="purple.50"
                border="1px solid"
                borderColor="purple.100"
                rounded="lg"
                p={3}
                w="full"
              >
                <Text fontSize="xs" color="purple.700" lineHeight="tall">
                  読みたい雰囲気・テーマ・好きな作品などを自由に入力してください。AIが類似した書籍を探します。
                </Text>
              </Box>
              <Textarea
                placeholder="例: 異世界に転生した主人公が最強スキルで無双する話&#10;例: 切ない片思いを描いた青春恋愛小説"
                value={similarityQuery}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setSimilarityQuery(e.target.value)
                }
                minH="120px"
                resize="vertical"
                rounded="lg"
                fontSize="sm"
              />
              <HStack w="full" gap={2}>
                <Button
                  type="button"
                  variant="ghost"
                  colorScheme="gray"
                  flex={1}
                  rounded="lg"
                  onClick={handleSimilarityReset}
                  disabled={isAiLoading}
                >
                  リセット
                </Button>
                <Button
                  type="submit"
                  flex={2}
                  rounded="lg"
                  bg="purple.600"
                  color="white"
                  _hover={{ bg: 'purple.700' }}
                  loading={isAiLoading}
                  loadingText="検索中..."
                >
                  おすすめを探す
                </Button>
              </HStack>
            </VStack>
          </form>
        )}
      </Box>
    </Box>
  );
};
