// プロジェクト全体の型定義管理

export interface Novel {
  title: string;
  ncode: string;
  userid: number;
  writer: string;
  story: string;
}

export type NarouApiResponse = [
  { allcount: number },
  ...Novel[]
];

export type NovelWithScore = Novel & {
  score?: number;
};
