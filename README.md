# 小説検索&推薦システム

「小説家になろう」で公開されているWEB小説を検索・推薦するWebアプリケーションです。

## 機能

### 絞り込み検索
- キーワードでタイトル・あらすじを部分一致検索
- 作者名での検索
- 複合条件検索（キーワード + 作者名）

### 作品推薦（類似度検索）
- 複数のキーワードを入力すると、関連性の高い小説を推薦
- 類似度スコア（0-100%）を表示
- TOP10の推奨作品を提示

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 19 |
| 言語 | TypeScript |
| ビルドツール | Vite |
| UIライブラリ | Yamada UI |
| API | 小説家になろう API |

## セットアップ

### 必要条件
- Node.js 18以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Yuu0413s/book_recom_web.git
cd book_recom_web

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開いてアプリケーションにアクセスできます。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用ビルドを作成 |
| `npm run preview` | 本番ビルドをプレビュー |
| `npm run lint` | ESLintでコードをチェック |

## プロジェクト構成

```
src/
├── components/
│   ├── SearchForm.tsx   # 検索フォーム（タブUI）
│   └── NovelList.tsx    # 検索結果リスト
├── types/
│   └── novel.ts         # 型定義
├── App.tsx              # メインアプリケーション
├── main.tsx             # エントリーポイント
└── index.css            # グローバルスタイル
```

## API

このアプリケーションは[小説家になろう API](https://dev.syosetu.com/man/api/)を使用しています。

- エンドポイント: `https://api.syosetu.com/novelapi/api/`
- 取得項目: ncode（小説ID）、title、writer、story
- 取得上限: 200件

## ライセンス

Private
