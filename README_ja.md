# Nano Banana Video

Nano Banana Video は、Next.js 16、React 19、better-auth、Drizzle、PostgreSQL を使って構築された多言語 AI 生成プロダクトです。現在の主な公開プロダクト面は、Nano Banana 画像ワークフロー、プロンプト生成、Sora 2 と Veo 3.1 Fast による動画生成です。

## 現在の状態

最終確認日: 2026-03-09

- デフォルトのホームルート `/` は Nano Banana Video のプロダクトページを表示します
- 主な公開ルートは `/`、`/nanabananvideo`、`/video-generation`、`/prompt-generator`、`/login` です
- 動画生成は Sora 2、Sora 2 Pro、Veo 3.1 Fast をサポートしています
- 画像生成、Prompt Generator、Google ログイン、Stripe 決済、管理画面、Blog/CMS はコードベース上で利用可能です
- music、studio、remotion、creem はコード内に残っていますが、現在の主公開面ではありません
- `pnpm lint` は現在通過しています

## 技術スタック

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- next-intl
- Zustand
- Drizzle ORM
- PostgreSQL
- better-auth
- Stripe
- Cloudflare R2 / S3 互換ストレージ

## ローカル開発

```bash
pnpm install
pnpm dev
```

`http://localhost:3000` を開いてください。

## よく使うコマンド

```bash
pnpm dev
pnpm build
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed
```

## 補足

- このリポジトリは SaaS ボイラープレートから派生しているため、一部に旧命名や旧ドキュメントが残っています
- 現在の実態を把握するには、`README.md`、`README_zh.md`、`LAUNCH-TODO.md`、`GALLERY_TODO.md` を優先してください
