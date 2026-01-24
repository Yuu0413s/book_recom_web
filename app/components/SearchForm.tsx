'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, VStack, FormControl, Text, Textarea, Input, Tabs, TabList, Tab, TabPanels, TabPanel } from '@yamada-ui/react';

interface Props {
    onFilterSearch: (criteria: { query: string; author: string }) => void;
    onSimilaritySearch: (query: string) => void;
}

export const SearchForm = ({ onFilterSearch, onSimilaritySearch }: Props) => {
    const [filterQuery, setFilterQuery] = useState('');
    const [author, setAuthor] = useState('');
    const [similarityQuery, setSimilarityQuery] = useState('');

    const handleFilterSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onFilterSearch({ query: filterQuery, author });
    };

    const handleSimilaritySubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSimilaritySearch(similarityQuery);
    };

    return (
        <Tabs w="full">
            <TabList>
                <Tab>
                    絞り込み検索
                </Tab>
                <Tab>
                    作品推薦
                </Tab>
            </TabList>
            <TabPanels>
            <TabPanel>
                <form onSubmit={handleFilterSubmit}>
                    <VStack w="full" gap={4} pt={4}>
                        <FormControl>
                            <Text as="label" mb="sm" display="block" fontSize="md" fontWeight="medium">キーワード</Text>
                            <Input
                                placeholder="タイトル・キーワード"
                                value={filterQuery}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterQuery(e.target.value)}
                            />
                        </FormControl>

                        <FormControl>
                            <Text as="label" mb="sm" display="block" fontSize="md" fontWeight="medium">作者</Text>
                            <Input
                                placeholder="作者名"
                                value={author}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)}
                            />
                        </FormControl>

                        <Button type="submit" colorScheme="primary" w="full">絞り込み検索</Button>
                    </VStack>
                </form>
            </TabPanel>

            <TabPanel>
                <form onSubmit={handleSimilaritySubmit}>
                    <VStack w="full" gap={4} pt={4}>
                        <FormControl>
                            <Text as="label" mb="sm" display="block" fontSize="md" fontWeight="medium">
                                あなたが興味のあるワード
                            </Text>
                            <Textarea
                                placeholder="例:異世界, 恋愛..."
                                value={similarityQuery}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSimilarityQuery(e.target.value)}
                                minH="120px"
                            />
                        </FormControl>

                        <Button type="submit" colorScheme="secondary" w="full">おすすめ作品を表示</Button>
                    </VStack>
                </form>
            </TabPanel>
        </TabPanels>
    </Tabs>
    );
};
