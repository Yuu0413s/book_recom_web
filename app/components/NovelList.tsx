'use client';

import { Card, CardHeader, CardBody, Heading, VStack, Link, Text } from '@yamada-ui/react';
import type { NovelWithScore } from '../types/novel';

interface Props {
    novels: NovelWithScore[];
    }

    export const NovelList = ({ novels }: Props) => {
    if (novels.length === 0) {
        return <Text>該当する小説はありません。</Text>;
    }

    return (
        <VStack gap={4} w="full">
        <Text>{novels.length}件の小説が見つかりました。</Text>
        {novels.map((novel) => {
            if (!novel || !novel.ncode) return null

            return (
            <Card key={novel.ncode} variant="outline" w="100%">
                <CardHeader>
                <VStack align="start" gap={1}>
                    <Heading size="md">
                    <Link href={`https://ncode.syosetu.com/${novel.ncode.toLowerCase()}/`} isExternal>
                        {novel.title ?? 'タイトル不明'}
                    </Link>
                    </Heading>
                    <Text>{novel.writer ?? '作者不明'}</Text>
                    {/* 類似度スコアが存在する場合のみ表示 */}
                    {novel.score != null && novel.score > 0 && (
                    <Text color="secondary" fontSize="sm" fontWeight="bold">
                        類似度: {(novel.score * 100).toFixed(1)}%
                    </Text>
                    )}
                </VStack>
                </CardHeader>
                <CardBody>
                <Text lineClamp={3}>{novel.story ?? 'あらすじがありません。'}</Text>
                </CardBody>
            </Card>
            );
        })}
        </VStack>
    );
};
