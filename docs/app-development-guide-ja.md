# Webデスクトップ アプリ開発ガイド (日本語版)

このガイドでは、Webデスクトップ環境に新しいアプリケーションを作成し、統合する方法について説明します。

## 1. プロジェクト構造の概要

Webデスクトップは以下のように構成されています。

-   `index.html`: デスクトップをホストするメインHTMLファイル。タスクバー(`id="taskbar"`)とスタートメニューパネル (`id="start-menu-panel"`) も含む。
-   `style.css`: デスクトップ、アイコン、ウィンドウ、タスクバー、スタートボタン、スタートメニューのグローバルスタイル。
-   `script.js`: アプリの読み込み、デスクトップ環境管理、タスクバー操作、スタートメニューの生成と機能、ウィンドウ管理（ドラッグ、リサイズ、最大化、最小化、z-index）を行うコアJavaScriptロジック。
-   `AppBase.js`: 共通のウィンドウ機能を提供するベースクラス (`AppBase`)。個々のアプリはこのクラスを拡張します。
-   `config.json`: 利用可能なすべてのアプリケーション、そのリソース（HTML、CSS、JSファイルパス）、ウィンドウ動作設定（`defaultWidth`, `defaultHeight`, `resizable`, `maximizable`, `minimizable`）、およびスタートメニューでの表示方法をリストする設定ファイル。ここの `initFunction` プロパティはアプリのクラス名であるべきです。
-   `apps/`: すべての個別アプリケーションを格納するディレクトリ。
    -   `apps/YourAppName/`: 各アプリケーションは独自のサブディレクトリに配置されます。
        -   `icon.html`: アプリケーションのデスクトップアイコン用のHTMLスニペット。メインアイコン要素のIDは、`appName.toLowerCase() + '-app-icon'` という規約に従わない場合、`config.json` の `iconId` プロパティで指定する必要があります。
        -   `appbody.html`: アプリケーションのメインウィンドウ構造用のHTMLスニペット。一貫性のために、ヘッダーを `.window-header-title` スパンと `.window-header-buttons` divで構成することが推奨されます。
        -   `yourAppName.js`: アプリのクラスを定義するJavaScriptファイル (例: `class YourAppName extends AppBase { ... }`)。このクラス名は `config.json` の `initFunction` と一致する必要があります。
        -   `style.css`: (オプション) このアプリケーション固有のCSSスタイル。

## 2. 新規アプリケーションの作成

新しいアプリケーション（例：「MyApp」）を作成するには、以下の手順に従います。

### ステップ 2.1: アプリケーションディレクトリの作成
`apps/MyApp/` を作成します。

### ステップ 2.2: アイコンHTMLの作成 (`icon.html`)
例 (`apps/MyApp/icon.html`):
```html
<div class="icon" id="my-app-icon">
    <span>My App</span>
</div>
```
*(`my-app-icon` が一意であることを確認するか、`config.json` の `iconId` プロパティを使用してください。)*

### ステップ 2.3: アプリ本体HTMLの作成 (`appbody.html`)
例 (`apps/MyApp/appbody.html`):
```html
<div class="window" id="my-app-window"> <!-- ウィンドウの一意のID -->
    <div class="window-header">
        <span class="window-header-title">My App Title</span>
        <div class="window-header-buttons">
            <!-- 最小化ボタンは script.js によってここに追加されます -->
            <button class="close-button window-header-button">X</button>
        </div>
    </div>
    <div class="window-content">
        <p>Hello from My App!</p>
    </div>
</div>
```

### ステップ 2.4: アプリケーションJavaScriptの作成 (`myApp.js`)
`AppBase` を拡張するクラスを定義します。
例 (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement);
    }
    onInit() {
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} が初期化されました。`);
        // アプリ固有の初期化ロジックをここに追加
    }
    onOpen() { /* アプリ固有のオープン時ロジック */ }
    onClose() { /* アプリ固有のクローズ時クリーンアップ */ }
    // 必要に応じて他のAppBaseメソッドをオーバーライドしたり、新しいメソッドを追加したりします
}
// window.MyApp = MyApp; // クラス名がinitFunctionと一致する場合、通常は不要
```

## 3. `config.json` の更新
"MyApp" のエントリを追加します。`initFunction` は "MyApp" (クラス名) にする必要があります。
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", 
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", 
  "iconHtml": "apps/MyApp/icon.html",
  "bodyHtml": "apps/MyApp/appbody.html",
  "css": "apps/MyApp/style.css",
  "defaultWidth": "400px",
  "defaultHeight": "300px",
  "resizable": true,
  "maximizable": true,
  "minimizable": true
}
```

## 4. アプリケーションのスタイリング
アプリ固有の `style.css` ファイルを使用します (例: `apps/MyApp/style.css`)。セレクタはウィンドウIDを使用してスコープします (例: `#my-app-window .my-class`)。

## 5. アプリの起動
- アプリは `config.json` の `name` によってスタートメニューにリストされます。
- スタートメニューでアプリをクリックすると、そのインスタンスの `open()` メソッドが呼び出されます。まだインスタンス化されていない場合（例：デスクトップアイコンが最初にクリックされていない）、`script.js` はデスクトップアイコンのクリックをシミュレートして、標準のインスタンス化とオープンプロセスをトリガーします。
- デスクトップアイコンも以前と同様にアプリを起動します。

## 6. 実行とテスト
`index.html` はHTTPサーバー経由で提供する必要があります (例: `python -m http.server`)。

## 7. アプリ固有設定の保存 (例: IndexedDB)
(このセクションは、Media Viewerの最終フォルダなどの設定にIndexedDBを使用する方法を説明する、以前更新されたものと同じです。)

アプリケーションは、ブラウザのストレージ機構を使用して独自の設定（Media Viewerの最後に使用したフォルダなど）を保存できます。`DirectoryHandle` のような複雑なオブジェクトを保存するには IndexedDB が推奨されます。

### 例: アプリでのIndexedDBの使用

1.  **DB定数の定義**:
    ```javascript
    const DB_NAME = 'WebDesktopAppSettings'; // 共有DB名
    const DB_VERSION = 1; // スキーマ変更時にインクリメント
    const STORE_NAME = 'yourAppNameSettings'; // アプリ固有のストア名
    const YOUR_SETTING_KEY = 'yourSettingKey';
    ```

2.  **DB操作のヘルパー関数** (アプリのJS内、または共有ユーティリティとして):
    ```javascript
    function openDB() { /* ... MediaViewerの例を参照 ... */ }
    async function getSetting(key) { /* ... MediaViewerの例を参照 ... */ }
    async function setSetting(key, value) { /* ... MediaViewerの例を参照 ... */ }
    ```

3.  **使用法**:
    -   アプリ読み込み時に設定を取得試行:
        ```javascript
        // アプリのonInitまたはonOpenメソッド内
        const lastHandle = await this._getSetting(this.YOUR_SETTING_KEY); // ヘルパーがクラスの一部であると仮定
        if (lastHandle) {
            // ハンドルの使用/検証を試みる
        }
        ```
    -   設定変更時 (例: ユーザーがフォルダを選択):
        ```javascript
        // directoryHandle は FileSystemDirectoryHandle
        await this._setSetting(this.YOUR_SETTING_KEY, directoryHandle);
        ```

`DirectoryHandle` を IndexedDB に保存する完全な実装例については、`apps/MediaViewer/mediaViewer.js` を参照してください。ディレクトリハンドルの権限はセッションを跨いで再検証する必要があることに注意してください。
