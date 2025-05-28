# Webデスクトップ アプリ開発ガイド (日本語版)

このガイドでは、Webデスクトップ環境に新しいアプリケーションを作成し、統合する方法について説明します。

## 1. プロジェクト構造の概要

Webデスクトップは以下のように構成されています。

-   `index.html`: デスクトップをホストするメインHTMLファイル。タスクバー(`id="taskbar"`)とスタートメニューパネル (`id="start-menu-panel"`) も含む。
-   `style.css`: デスクトップ、アイコン、ウィンドウ、タスクバー、スタートボタン、スタートメニューのグローバルスタイル。
-   `WebDesktopLib.js`: DOM操作 (`WebDesktopLib.DOM`)、タスクバー管理 (`WebDesktopLib.Taskbar`)、ストレージユーティリティ (`WebDesktopLib.Storage`)、イベントバス (`WebDesktopLib.EventBus`) などのコア機能を提供するサポートライブラリ。
-   `script.js`: ライブラリやアプリの読み込み、デスクトップ環境管理、タスクバー操作 ( `WebDesktopLib.Taskbar` 経由)、スタートメニューの生成と機能、ウィンドウ管理を行うコアJavaScriptロジック。
-   `AppBase.js`: 共通のウィンドウ機能を提供するベースクラス (`AppBase`)。個々のアプリはこのクラスを拡張し、コアなやり取りには `WebDesktopLib` を使用します。
-   `config.json`: 利用可能なすべてのアプリケーション、そのリソース（HTML、CSS、JSファイルパス）、ウィンドウ動作設定（`defaultWidth`, `defaultHeight`, `resizable`, `maximizable`, `minimizable`）、およびスタートメニューでの表示方法をリストする設定ファイル。ここの `initFunction` プロパティはアプリのクラス名であるべきです。
-   `apps/`: すべての個別アプリケーションを格納するディレクトリ。
    -   `apps/YourAppName/`: 各アプリケーションは独自のサブディレクトリに配置されます。
        -   `icon.html`: アプリケーションのデスクトップアイコン用のHTMLスニペット。メインアイコン要素のIDは、`appName.toLowerCase() + '-app-icon'` という規約に従わない場合、`config.json` の `iconId` プロパティで指定する必要があります。
        -   `appbody.html`: アプリケーションのメインウィンドウ構造用のHTMLスニペット。一貫性のために、ヘッダーを `.window-header-title` スパンと `.window-header-buttons` divで構成することが推奨されます。
        -   `yourAppName.js`: アプリのクラスを定義するJavaScriptファイル (例: `class YourAppName extends AppBase { ... }`)。このクラス名は `config.json` の `initFunction` と一致する必要があります。
        -   `style.css`: (オプション) このアプリケーション固有のCSSスタイル。

## 2. 新規アプリケーションの作成

(ステップ 2.1, 2.2, 2.3 は変更なし: ディレクトリ、icon.html, appbody.html の作成)

### ステップ 2.4: アプリケーションJavaScriptの作成 (`myApp.js`)
`AppBase` を拡張するクラスを定義します。
例 (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement); // AppBaseコンストラクタを呼び出す
    }
    onInit() { // AppBaseコンストラクタによって呼び出される
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} が初期化されました。`);
        // アプリ固有の初期化ロジック。例: WebDesktopLib.DOM を使用
        // this.myButton = WebDesktopLib.DOM.qs('.my-button', this.appWindowElement);
    }
    // 必要に応じて他のAppBaseメソッド (onOpen, onCloseなど) をオーバーライド
}
// window.MyApp = MyApp; // クラス名がinitFunctionと一致する場合、通常は不要
```
`AppBase` は要素のクエリに `WebDesktopLib.DOM` を、タスクバー操作に `WebDesktopLib.Taskbar` を使用するようになりました。

## 3. `config.json` の更新
(このセクションは変更なし: `initFunction` はクラス名、必要なら `iconId` を追加など)
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", 
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", 
  "iconHtml": "apps/MyApp/icon.html",
  // ... 他のプロパティ
}
```

## 4. アプリケーションのスタイリング
(このセクションは変更なし。)

## 5. アプリの起動
(このセクションは変更なし。)

## 6. 実行とテスト
(このセクションは変更なし: HTTPサーバー経由で提供。)

## 7. アプリ固有設定の保存 (例: IndexedDB)
アプリケーションは、ブラウザのストレージ機構を使用して独自の設定を保存できます。`WebDesktopLib.Storage` は `localStorage` と IndexedDB のための簡略化されたラッパーを提供します。

-   **`WebDesktopLib.Storage.local.set(key, value)` / `.get(key, defaultValue)`**: 単純なキーバリュー形式の文字列/JSONストレージ用。
-   **`WebDesktopLib.Storage.indexedDB.set(dbName, version, storeName, key, value, onUpgradeNeededCallback)` / `.get(...)`**: `FileSystemDirectoryHandle` のような複雑なオブジェクトを含む、より複雑なストレージ用。

`onUpgradeNeededCallback` は IndexedDB がオブジェクトストアをセットアップするために重要です。例:
```javascript
// アプリクラス内
_onUpgradeNeeded(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(this.MY_APP_STORE_NAME)) {
        db.createObjectStore(this.MY_APP_STORE_NAME);
    }
}

async saveMySetting(key, value) {
    await WebDesktopLib.Storage.indexedDB.set(
        'WebDesktopAppSettings', // 共通のDB名
        1, // DBバージョン
        this.MY_APP_STORE_NAME, // アプリ固有のストア
        key,
        value,
        this._onUpgradeNeeded.bind(this) // アップグレードコールバックを渡す
    );
}
```
`DirectoryHandle` を IndexedDB に保存するための `WebDesktopLib.Storage.indexedDB` の完全な実装例については、`apps/MediaViewer/mediaViewer.js` を参照してください。ディレクトリハンドルの権限はセッションを跨いで再検証する必要があることに注意してください。

## 8. コンポーネント間通信 (イベントバス)
`WebDesktopLib.EventBus` は、アプリケーションの異なる部分間（例：アプリ間、またはアプリとデスクトップ間）の疎結合な通信のための単純な発行/購読メカニズムを提供します。

-   **`WebDesktopLib.EventBus.subscribe(eventName, callback)`**: イベントのコールバックを登録します。
-   **`WebDesktopLib.EventBus.unsubscribe(eventName, callback)`**: 特定のコールバックを削除します。
-   **`WebDesktopLib.EventBus.publish(eventName, data)`**: オプションのデータと共にイベントをすべての購読者にディスパッチします。

使用例:
```javascript
// コンポーネントA (例: アプリ)
WebDesktopLib.EventBus.publish('userLoggedIn', { userId: 123, username: 'Alice' });

// コンポーネントB (例: 別のアプリまたはscript.js内のUI要素)
function handleLogin(userData) {
    console.log(`ユーザー ${userData.username} がログインしました。`);
    // UIまたは状態を更新
}
WebDesktopLib.EventBus.subscribe('userLoggedIn', handleLogin);

// 後で購読解除する場合:
// WebDesktopLib.EventBus.unsubscribe('userLoggedIn', handleLogin);
```
これはコンポーネント間の直接的な依存関係を減らすのに役立ちます。
