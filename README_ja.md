# Nexty - モダンなフルスタックSaaSテンプレート

Nextyは、Next.js 15、React 19、Supabaseをベースに構築された機能豊富なフルスタックSaaSアプリケーションテンプレートで、開発者がSaaSアプリケーションを迅速に構築・デプロイするための完全なソリューションを提供します。

🚀 テンプレートを入手 👉: https://nexty.dev  
🚀 Roadmap 👉: https://nexty.dev/ja/roadmap


> Nexty.devのドキュメントは準備中です。まずはこのREADMEを読んで使い始めてください。問題が発生した場合は、以下の連絡先までサポートをご依頼ください：
> メール：hi@nexty.dev
> Twitter（中国語）：https://x.com/weijunext
> Twitter（英語）：https://x.com/judewei_dev

## ✨ 主な機能

- 🚀 **Next.js 15 & React 19** - 最新の技術スタックをベースに構築
- 💳 **Stripe統合** - 完全なサブスクリプション決済システム
- 🔒 **Supabase認証** - 安全で信頼性の高いユーザー管理
- 🌍 **国際化対応** - 英語、中国語、日本語の組み込みサポート
- 🧠 **AI統合** - 複数のAIプロバイダーをサポート（OpenAI、Anthropic、DeepSeek、Googleなど）
- 📊 **管理ダッシュボード** - ユーザー管理、料金プラン、コンテンツ管理など
- 📱 **レスポンシブデザイン** - 様々なデバイスに完璧に適応
- 🎨 **Tailwind CSS** - モダンなUIデザイン
- 📧 **メールシステム** - Resendベースの通知やマーケティングメール
- 🖼️ **R2/S3ストレージ** - メディアファイル用クラウドストレージのサポート

## 🚀 クイックスタート

### 前提条件

- Node.js 18+とpnpm
- CloudFlareでドメインメールを設定
- ドメインメールを使用してSupabase、Upstash、Resendのアカウントを登録
- 決済統合用のStripeアカウント（オプション）
  - 環境変数NEXT_PUBLIC_ENABLE_STRIPEをfalseに設定することで、決済機能を無効にできます

### インストール手順

1. **プロジェクトのクローン**

```bash
git clone git@github.com:WeNextDev/nexty.dev.git
cd nexty
```

2. **依存関係のインストール**

```bash
pnpm install
```

3. **環境設定**

`.env.example`ファイルをコピーして`.env.local`にリネームし、必要な環境変数を設定します：

```bash
cp .env.example .env.local
```

4. **Supabaseの設定**

Supabaseで新しいプロジェクトを作成し、生成されたURLと匿名キーを`.env.local`ファイルに追加します。

5. **Supabase認証の設定**

`/README/supabase/auth`のスクリーンショットチュートリアルに従って設定します（関連ドキュメントは近日公開予定）。

6. **データベースコマンドの実行**

Supabaseにログインし、SQLエディタで`/data`フォルダ内の全SQLファイルを実行します。

7. **ローカルでの Supabase types.ts の生成**

まず、お使いのプラットフォーム用の Supabase CLI をインストールしてください: https://supabase.com/docs/guides/local-development/cli/getting-started

その後、ローカルのターミナルで以下のコマンドを順番に実行します：

```
supabase login

supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```

Supabase のテーブル、ポリシー、トリガー、関数を更新した場合は、このコマンドを再度実行する必要があります。

> 注意：コマンドラインで Supabase CLI のバージョンアップグレードを求められた場合は、上記リンクからアップグレードコマンドを確認し、まずそれを実行してから `supabase gen` コマンドを実行してください。

8. **Stripeの設定（オプション）**

決済機能が必要な場合は、`/README/stripe`のスクリーンショットチュートリアルに従って設定し（関連ドキュメントは近日公開予定）、StripeのAPIキーを`.env.local`ファイルに追加します。

9. **開発サーバーの実行**

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)にアクセスしてアプリケーションを確認できます。

## 📂 プロジェクト構造

```
app/                  # Next.jsアプリケーションディレクトリ
├── [locale]/         # 国際化ルート
├── api/              # APIエンドポイント
├── auth/             # 認証関連コンポーネント
components/           # 共有UIコンポーネント
config/               # ウェブサイト設定
lib/                  # ユーティリティ関数とサービス
emails/               # メールテンプレート
i18n/                 # 国際化設定と翻訳ファイル
public/               # 静的アセット
```

## 💡 主要機能モジュール

- **ユーザー認証** - Google認証、GitHub認証、マジックリンク
- **サブスクリプション管理** - プラン選択、決済処理、請求管理
- **コンテンツ管理** - ブログ、ショーケース、静的ページ（CMSは開発中）
- **ユーザーダッシュボード** - アカウント設定、サブスクリプション管理、使用統計
- **管理バックエンド** - ユーザー管理、料金プラン、コンテンツ管理
- **AI機能デモ** - 様々なAI機能デモを通じてAI機能開発をより速く学ぶ

## 🌍 国際化

プロジェクトには英語、中国語、日本語の組み込みサポートがあります：

1. `i18n/messages/`
2. `i18n/routing.ts`

## 🔧 トラブルシューティング

### APIキーが無効

Supabaseやその他のサービスのAPIキーが`.env.local`ファイルに正しく設定されていることを確認してください。

### 決済テスト

Stripeのテストモードでは、テストカード番号`4242 4242 4242 4242`を使用して決済テストができます。
