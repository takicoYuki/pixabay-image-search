# pixabay-image-search

![CI](https://github.com/takicoYuki/pixabay-image-search/actions/workflows/ci.yml/badge.svg)

[Pixabay API](https://pixabay.com/api/docs/) を使った画像検索アプリです（React + Vite）。
キーワードと画像の種類で検索し、一覧表示・追加読み込み・拡大表示ができます。

## できること

- キーワード + 画像の種類（写真 / イラスト / ベクター）で検索
- 「もっと見る」で次のページを追加読み込み（同じ画像が重複しないよう ID で除外）
- 画像をクリックすると拡大表示（Esc・背景クリック・閉じるボタンで閉じる）
- 0 件・通信エラー・API のエラー（キー不正、リクエスト過多）をそれぞれメッセージで表示
- 新しい検索を始めたら前のリクエストを中断し、古い結果で画面が上書きされないようにする
- 同じ検索結果は 24 時間キャッシュ（Pixabay の利用条件で求められているため）

## 動かし方

```bash
npm install
cp .env.example .env.local   # VITE_PIXABAY_API_KEY に自分の API キーを書く
npm run dev
```

API キーは [Pixabay API のドキュメント](https://pixabay.com/api/docs/) のページで、ログインすると確認できます。
`.env.local` は `.gitignore` に入れてあるので、キーがリポジトリに含まれることはありません。

> フロントエンドだけで動くアプリなので、ビルドした JavaScript には API キーが含まれます。
> 不特定多数に公開する場合は、キーをサーバー側に置いて中継する API を用意するのが安全です。

## 構成

```
src/
├── api.js               Pixabay API の呼び出し（URL 組み立て・エラー変換・キャッシュ）。React に依存しない
├── useImageSearch.js    検索・追加読み込み・中断の状態管理（カスタムフック）
├── App.jsx
└── components/
    ├── SearchForm.jsx
    ├── ImageGallery.jsx
    └── Lightbox.jsx
```

API の呼び出しは `fetch` を外から渡せるようにしてあり、テストでは偽のレスポンスを返して通信せずに確認しています。

## テスト

```bash
npm test
```

| テスト | 内容 |
|---|---|
| `api.test.js` | URL の組み立て、レスポンスの整形、24 時間キャッシュ、HTTP エラー・通信エラー・中断の扱い、キー未設定 |
| `App.test.jsx` | 検索と一覧表示、画像の種類の指定、もっと見る、0 件、エラー表示、拡大表示と Esc で閉じる、キー未設定時の表示 |

Vitest と Testing Library を使い、利用者と同じように「ラベル名でフォームを探して入力する」書き方にしています。
CI ではテストとビルドを実行しています。

## ライセンス

MIT（画像の利用条件は [Pixabay のライセンス](https://pixabay.com/service/license-summary/) に従います）
