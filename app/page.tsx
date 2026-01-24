'use client';

import { useState, useEffect } from 'react';
import { Container, VStack, Heading, Center, Text, Loading, HStack } from "@yamada-ui/react";
import { SearchForm } from "./components/SearchForm";
import { NovelList } from "./components/NovelList";
import type { Novel, NarouApiResponse, NovelWithScore } from './types/novel';

const API_URL = 'https://api.syosetu.com/novelapi/api/?out=json&of=n-t-w-s&lim=200';

interface FilterCriteria {
    query: string;
    author: string;
}

export default function Home() {
    const [allNovels, setAllNovels] = useState<Novel[]>([]);
    const [displayedNovels, setDisplayedNovels] = useState<NovelWithScore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
    const fetchAllData = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);

            const data: NarouApiResponse = await response.json();
            const [, ...novelData] = data;

            setAllNovels(novelData);
            setDisplayedNovels(novelData);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('不明なエラーが発生しました'));
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
            setDisplayedNovels(allNovels);
            return;
    }

    const filteredNovels = allNovels.filter(novel => {
        const matchesQuery = !lowerCaseQuery ||
            (novel.title?.toLowerCase() || '').includes(lowerCaseQuery) ||
            (novel.story?.toLowerCase() || '').includes(lowerCaseQuery);

        const matchesAuthor = !lowerCaseAuthor ||
            (novel.writer?.toLowerCase() || '').includes(lowerCaseAuthor);

        return matchesQuery && matchesAuthor;
    });

    setDisplayedNovels(filteredNovels);
    };

    const handleSimilaritySearch = (query: string) => {
    if (!query.trim()) {
        setDisplayedNovels(allNovels);
        return;
    }

        const queryChars = [...new Set(query.toLowerCase().replace(/\s/g, '').split(''))];

    const scoredNovels: NovelWithScore[] = allNovels.map(novel => {
        const title = (novel.title || '').toLowerCase();
        let matchCount = 0;

        if (title) {
            for (const char of queryChars) {
                if (title.includes(char)) {
                    matchCount++;
                }
            }
        }

        const score = queryChars.length > 0 ? matchCount / queryChars.length : 0;

        return { ...novel, score };
    });

    const topNovels = scoredNovels
        .filter(novel => (novel.score ?? 0) > 0)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 10);

    setDisplayedNovels(topNovels);
    };

    return (
        <Container maxW="full" px="lg" py="lg">
            <VStack gap="lg">
                <Heading>小説検索&推薦</Heading>
                <HStack gap="lg" align="start" w="full">
                    <VStack w="30%" minW="300px" position="sticky" top="lg">
                        <SearchForm
                            onFilterSearch={handleFilterSearch}
                            onSimilaritySearch={handleSimilaritySearch}
                        />
                    </VStack>

                    <VStack w="70%">
                        {isLoading && <Center><Loading /></Center>}
                        {error && <Text color="red.500">{error.message}</Text>}
                        {!isLoading && <NovelList novels={displayedNovels} />}
                    </VStack>
                </HStack>
            </VStack>
        </Container>
    );
}
