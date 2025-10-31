# 📋 My To-Do App

モダンな UI を備えた TODO アプリです。Material UI を活用し、未完了タスクが常に上に並ぶスマートなリスト体験を提供します。

## ✨ 主な機能

- タスクの新規追加（Enter または「追加」ボタン）
- モーダルから詳細・期限付きでタスクを追加／編集
- チェックボックスによる完了／未完了の切り替え
- 編集ダイアログ内からタスクを削除
- 未完了タスクは自動的に完了済みタスクより先に表示
- 残タスク数を即時に表示

## 🛠️ 技術スタック

- React 19
- Material UI (MUI)
- Emotion（MUI のスタイリング）

## 🚀 セットアップ

リポジトリをクローンしたら依存関係をインストールします。

```bash
npm install
```

## ☁️ Firebase / Firestore 設定

このアプリは Firebase Authentication と Cloud Firestore を利用します。以下の手順でバックエンドを用意してください。

### 1. Firebase プロジェクトを用意

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成。
2. 「アプリを追加」で **Web アプリ** を選択し、表示される構成情報を控えます。
3. プロジェクトで **Authentication → Sign-in method** を開き、メール/パスワードを有効化します。

### 2. Firestore を有効化

1. サイドバーの **Firestore Database** を開き、「データベースを作成」から本番/テストモードを選んで開始。
2. リージョンを選択し、作成が完了したら `tasks` コレクション配下に任意のドキュメントを 1 件追加しておくと UI がすぐに動作確認できます。
	 - 推奨フィールド例:
		 - `title`: string
		 - `description`: string
		 - `dueDate`: string (YYYY-MM-DD 形式、空文字可)
		 - `completed`: boolean
		 - `ownerId`: string (`auth.uid`)
		 - `createdAt`: Firestore timestamp (サーバー側で自動付与)

### 3. 環境変数を設定

`src/firebase.js` は以下の環境変数を参照します。ルート直下に `.env.local` を作成し値を設定してください。

```
REACT_APP_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdefghijklmnopqrstuvwxyz
```

> `.env.local` は Git にコミットしないよう `.gitignore` に含まれています。

### 4. セキュリティルールを更新

各ユーザーが自分のタスクだけ読めるよう、Firestore ルールを以下のように更新してデプロイしてください。

```bash
firebase deploy --only firestore:rules
```

`firestore.rules` の例:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /tasks/{taskId} {
			allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;

			// 新規作成時は作成者が自分自身であることをチェック
			allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
		}
	}
}
```

### 5. (任意) ローカル開発用のデータ初期化

実データが無い状態でも UI が動作するよう、サインイン後にタスクを追加するだけで自動的にドキュメントが生成されます。必要に応じて Firebase Emulator Suite を併用してください。

### 開発サーバーを起動

```bash
npm start
```

`http://localhost:3000` にアクセスするとアプリを確認できます。

### テストの実行

```bash
npm test -- --watchAll=false
```

### 本番ビルド

```bash
npm run build
```

`build/` フォルダに最適化された成果物が出力されます。

### GitHub と Firebase Hosting の連携 (CI/CD)

継続的にデプロイしたい場合は GitHub Actions を使った自動化が便利です。以下の手順で設定できます。

1. **GitHub リポジトリを準備**  
	ローカルリポジトリを GitHub 上に push し、`main` ブランチなどを用意しておきます。

2. **Firebase CLI でワークフローを生成**  
	```bash
	firebase login
	firebase init hosting:github
	```
	対話形式で GitHub アカウントへのアクセスを許可し、
	- 対象リポジトリ
	- トリガーするブランチ (例: `main`)
	- デプロイ先チャネル (例: `live`)
	を選択します。

3. **GitHub Secrets の確認**  
	上記コマンドで生成された GitHub Actions のワークフローは `FIREBASE_SERVICE_ACCOUNT` などのシークレットを使います。
	`firebase init hosting:github` 実行時に CLI が自動で登録してくれるため、GitHub のリポジトリ設定 → Secrets and variables → Actions で値が追加されていることを確認してください。

4. **ワークフローの配置と動作**  
	`.github/workflows/firebase-hosting-merge.yml`（ブランチマージ用）や `firebase-hosting-pull-request.yml`（プレビュー用）が作成されます。コミットや PR を開くと GitHub Actions がビルド→デプロイを実行し、結果が PR 上にコメントされます。

5. **環境変数の取り扱い**  
	`.env.production` のようなファイルを用意する場合は、GitHub Secrets に登録して Actions 内で `echo "$ENV_FILE" > .env.production` のように復元するか、必要な値のみ環境変数として設定してください。

これで、ブランチへ push するだけで Firebase Hosting へのデプロイが自動実行されます。ロールバックやプレビューも Firebase Console から容易に操作できます。

## 📦 プロジェクト構成

- `src/App.js` — アプリのメインコンポーネント
- `src/App.test.js` — 主要機能を担保するユニットテスト
- `src/App.css` — 軽微なスタイル調整

## 📄 ライセンス

このプロジェクトは個人学習用です。必要に応じてご自由にカスタマイズしてください。
