'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Button,
  VStack,
  FormControl,
  Text,
  Textarea,
  Input,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  Card,
  CardBody,
} from '@yamada-ui/react';

interface Props {
  onFilterSearch: (criteria: { query: string; author: string }) => void;
  onSimilaritySearch: (query: string) => void;
  onReset: () => void;
}

export const SearchForm = ({ onFilterSearch, onSimilaritySearch, onReset }: Props) => {
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
    if (!similarityQuery.trim()) {
      onReset();
      return;
    }
    onSimilaritySearch(similarityQuery);
  };

  const handleSimilarityReset = () => {
    setSimilarityQuery('');
    onReset();
  };

  return (
    <Card variant="outline" w="full">
      <CardBody p={0}>
        <Tabs w="full">
          <TabList>
            <Tab flex={1}>絞り込み検索</Tab>
            <Tab flex={1}>✨ AI 推薦</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <form onSubmit={handleFilterSubmit}>
                <VStack w="full" gap={4} pt={2}>
                  <FormControl>
                    <Text
                      as="label"
                      mb="xs"
                      display="block"
                      fontSize="sm"
                      fontWeight="medium"
                      color="gray.600"
                    >
                      キーワード
                    </Text>
                    <Input
                      placeholder="タイトル・キーワード"
                      value={filterQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFilterQuery(e.target.value)
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <Text
                      as="label"
                      mb="xs"
                      display="block"
                      fontSize="sm"
                      fontWeight="medium"
                      color="gray.600"
                    >
                      作者
                    </Text>
                    <Input
                      placeholder="作者名"
                      value={author}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAuthor(e.target.value)
                      }
                    />
                  </FormControl>

                  <HStack w="full" gap={2}>
                    <Button
                      type="button"
                      variant="outline"
                      flex={1}
                      onClick={handleFilterReset}
                    >
                      クリア
                    </Button>
                    <Button type="submit" colorScheme="primary" flex={2}>
                      検索
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </TabPanel>

            <TabPanel>
              <form onSubmit={handleSimilaritySubmit}>
                <VStack w="full" gap={4} pt={2}>
                  <Text fontSize="xs" color="gray.500" lineHeight="tall">
                    読みたい雰囲気・テーマ・好きな作品などを自由に入力すると、AI が似た書籍を探します。
                  </Text>
                  <FormControl>
                    <Text
                      as="label"
                      mb="xs"
                      display="block"
                      fontSize="sm"
                      fontWeight="medium"
                      color="gray.600"
                    >
                      興味のあるテーマ・雰囲気
                    </Text>
                    <Textarea
                      placeholder="例: 異世界転生でハーレム、切ない恋愛、ミステリー..."
                      value={similarityQuery}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setSimilarityQuery(e.target.value)
                      }
                      minH="120px"
                    />
                  </FormControl>

                  <HStack w="full" gap={2}>
                    <Button
                      type="button"
                      variant="outline"
                      flex={1}
                      onClick={handleSimilarityReset}
                    >
                      リストに戻る
                    </Button>
                    <Button type="submit" colorScheme="secondary" flex={2}>
                      おすすめ作品を表示
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
};
