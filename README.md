# Signal — 100人AI検索模擬テスト

GEO(生成AI検索最適化)診断ツール「Signal」の、外部ホスティング用プロジェクトです。
トップページの「100人テスト」「Battlefield比較」は、`/api/diagnose` と `/api/battlefield` という
サーバーレス関数(Anthropic APIを呼び出す)経由で動作します。

## 構成

```
index.html        トップページ本体(診断UI一式を含む単一HTML)
api/diagnose.js    100人テスト用のサーバーレス関数(Vercel Functions)
api/battlefield.js 競合比較(Battlefield/Steal10)用のサーバーレス関数
lib/claude.js      Anthropic APIを呼び出す共通処理(JSON抽出・パース含む)
package.json       依存関係(@anthropic-ai/sdk)
vercel.json        Vercel設定(最小構成)
.env.example       必要な環境変数のサンプル
```

フロントエンド(index.html)は、以前このHTML1枚だけの姿でClaudeのアーティファクト機能
(`claude.use('sample')`)を使って動いていましたが、それはClaudeの中でしか動かないため、
このプロジェクトでは `fetch('/api/diagnose', ...)` / `fetch('/api/battlefield', ...)` に置き換えています。
プロンプトの組み立てはこれまで通りクライアント側(index.html)で行い、
サーバー側はそのプロンプトをAnthropic APIに渡してJSONを取り出すだけのシンプルな役割です。

## デプロイ手順(Vercel)

### 1. Anthropic APIキーを取得する

https://console.anthropic.com/settings/keys で新しいAPIキーを発行してください
(`sk-ant-` から始まる文字列です)。利用は従量課金です。

### 2. GitHubリポジトリを作る

このフォルダ一式をGitHubの新しいリポジトリにpushしてください。

```bash
cd signal-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<あなたのアカウント>/<リポジトリ名>.git
git push -u origin main
```

(GitHubのWeb画面から「Add file → Upload files」でこのフォルダの中身をそのままアップロードする方法でも構いません)

### 3. Vercelにインポートする

1. https://vercel.com にログイン(GitHubアカウントでログイン可能)
2. 「Add New → Project」から、今作ったGitHubリポジトリを選択してImport
3. Framework Presetは「Other」のままでOK(ビルドコマンド不要)
4. 「Environment Variables」に以下を追加:
   - Key: `ANTHROPIC_API_KEY`
   - Value: 手順1で取得したAPIキー
5. 「Deploy」をクリック

数十秒でデプロイが完了し、`https://<プロジェクト名>.vercel.app` のURLが発行されます。
これでまず無料の付属URLで公開できます。

### 4. 独自ドメインを使う場合

Vercelのプロジェクト設定 → Domains から、お持ちのドメイン(または新規取得したドメイン)を追加し、
案内されるDNSレコード(CNAME/Aレコード)を、ドメインのDNS管理画面に設定してください。
ドメインをまだお持ちでない場合は、Vercel上やお名前.com、Google Domainsなどのレジストラで取得できます。

## ローカルで動作確認する場合

```bash
npm install -g vercel   # 初回のみ
cd signal-site
npm install
cp .env.example .env    # ANTHROPIC_API_KEY を実際の値に書き換える
vercel dev
```

`http://localhost:3000` で、本番と同じ構成(index.html + /api/*)を確認できます。

## 注意点・今後の改善候補

- **無料枠の管理はブラウザのlocalStorageのみ**で行っています(`signal_100test_usage`)。
  これは利用者のブラウザ側の情報なので、簡単にリセット・回避されます。本格的に無料枠を
  制限したい場合は、IPアドレスや認証ベースのサーバー側レート制限を `/api` 側に追加してください。
- ナビゲーションにある `articles.html` や `comparisons/index.html` などのページは、
  現時点ではリンク先のファイルが存在しません(診断ツール本体を優先して用意しています)。
  必要に応じて追加してください。
- モデルは `lib/claude.js` 内で `claude-sonnet-4-5-20250929` を指定しています。
  別モデルを使いたい場合はここを書き換えてください。
