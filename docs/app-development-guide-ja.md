# Webデスクトップ アプリ開発ガイド (日本語版)

このガイドでは、Webデスクトップ環境に新しいアプリケーションを作成し、統合する方法について説明します。

## 1. プロジェクト構造の概要

Webデスクトップは以下のように構成されています。

-   `index.html`: デスクトップをホストするメインHTMLファイル。タスクバー(`id="taskbar"`)も含む。
-   `style.css`: デスクトップ、アイコン、ウィンドウ、タスクバーのグローバルスタイル。
-   `script.js`: アプリの読み込み、ウィンドウ管理（ドラッグ、リサイズ、最大化、最小化、z-index）、タスクバー管理を行うコアJavaScriptロジック。
-   `config.json`: 利用可能なすべてのアプリケーションとそのリソース（HTML、CSS、JSファイルパス、ウィンドウ動作設定）をリストする設定ファイル。
-   `apps/`: すべての個別アプリケーションを格納するディレクトリ。
    -   `apps/YourAppName/`: 各アプリケーションは独自のサブディレクトリに配置されます。
        -   `icon.html`: アプリケーションのデスクトップアイコン用のHTMLスニペット。
        -   `appbody.html`: アプリケーションのメインウィンドウ構造用のHTMLスニペット。ウィンドウヘッダーにはタイトル表示用の `.window-header-title` とボタンコンテナ用の `.window-header-buttons` を含めることが推奨されます。
        -   `yourAppName.js`: アプリケーション固有のJavaScriptロジック。
        -   `style.css`: (オプション) アプリケーション固有のCSSスタイル。

## 2. 新規アプリケーションの作成

新しいアプリケーション（例：「MyApp」）を作成するには、以下の手順に従います。

### ステップ 2.1: アプリケーションディレクトリの作成
`apps/` ディレクトリ内にアプリケーション用の新しいフォルダを作成します。
`apps/MyApp/`

### ステップ 2.2: アイコンHTMLの作成 (`icon.html`)
`apps/MyApp/` 内に `icon.html` を作成します。
例 (`apps/MyApp/icon.html`):
```html
<div class="icon" id="my-app-icon">
    <span>My App</span>
</div>
```

### ステップ 2.3: アプリ本体HTMLの作成 (`appbody.html`)
`apps/MyApp/` 内に `appbody.html` を作成します。
ウィンドウヘッダーの構造に注意してください。
例 (`apps/MyApp/appbody.html`):
```html
<div class="window" id="my-app-window">
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
`apps/MyApp/` 内に `myApp.js` を作成します。
初期化関数は `appConfig` と `appWindowElement` を引数に取ります。
このスクリプトで、アイコンクリック時のウィンドウ表示、閉じるボタン、最小化ボタンのイベントリスナー、ドラッグ、リサイズ、最大化のロジックを実装します。タスクバーとの連携、ウィンドウの前面表示もここで行います。

例 (`apps/MyApp/myApp.js`):
```javascript
function initializeMyApp(appConfig, appWindowElement) {
    const appIcon = document.getElementById('my-app-icon'); // アイコンIDを確認

    if (!appIcon || !appWindowElement) {
        console.warn(`'${appConfig.name}' の要素が見つかりません。`);
        return;
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    const minimizeButton = appWindowElement.querySelector('.minimize-button'); // script.jsが追加
    const windowHeader = appWindowElement.querySelector('.window-header');
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle'); // script.jsが追加
    let taskbarButton = null;

    let originalDimensions = { /* 最大化からの復元用 */
        width: appWindowElement.style.width, height: appWindowElement.style.height,
        top: appWindowElement.style.top, left: appWindowElement.style.left
    };
    let isMaximized = false;

    // ウィンドウを開く/タスクバーから復元
    appIcon.addEventListener('click', () => {
        appWindowElement.style.display = 'flex';
        if (!taskbarButton && window.manageTaskbar) { // 初回オープン時にタスクバーボタン作成
            taskbarButton = window.manageTaskbar.add(appConfig, appWindowElement);
        }
        // ウィンドウのmousedownリスナーが前面表示を処理しますが、明示的なオープン/復元時にも行うと良いでしょう
        if (window.manageTaskbar) window.manageTaskbar.bringToFront(appWindowElement.id);


        if (!isMaximized) { /* サイズと位置を復元/設定 */ }
    });
    
    // ウィンドウにmousedownリスナーを追加して前面に表示
    appWindowElement.addEventListener('mousedown', () => {
        if (window.manageTaskbar) {
            window.manageTaskbar.bringToFront(appWindowElement.id);
        }
    }, true); // キャプチャフェーズを使用

    // 閉じるボタン
    closeButton.addEventListener('click', () => {
        appWindowElement.style.display = 'none';
        if (window.manageTaskbar) window.manageTaskbar.remove(appWindowElement.id);
        taskbarButton = null;
    });

    // 最小化ボタン (appConfig.minimizable が true の場合)
    if (appConfig.minimizable && minimizeButton) {
        minimizeButton.addEventListener('click', () => {
            appWindowElement.style.display = 'none';
            if (window.manageTaskbar) window.manageTaskbar.setInactive(appWindowElement.id);
        });
    }

    // 最大化/復元 (appConfig.maximizable が true の場合)
    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => { /* ...最大化/復元ロジック... */ });
    }

    // ドラッグ処理 (windowHeader)
    if (windowHeader) { 
        // ...ドラッグロジック... 
        // mousedown内で: 前面表示はウィンドウのmousedownリスナーが処理
    }

    // リサイズ処理 (appConfig.resizable と resizeHandle が存在する場合)
    if (appConfig.resizable && resizeHandle) { /* ...リサイズロジック... */ }
}
```
*(完全なドラッグ、リサイズ、最大化のロジックは既存のアプリのJSファイルを参照してください。)*

## 3. `config.json` の更新
`apps` 配列に新しいエントリを追加します。ウィンドウ動作プロパティも忘れずに。
- `defaultWidth`, `defaultHeight` (文字列, 例: "400px")
- `resizable`, `maximizable`, `minimizable` (ブール値)

例:
```json
{
  "name": "MyApp",
  "script": "apps/MyApp/myApp.js",
  "initFunction": "initializeMyApp",
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
- **グローバルスタイル**: `style.css` に定義。
- **アプリ固有スタイル**: 各アプリのフォルダ内の `style.css` に記述。`config.json` でパスを指定すれば自動で読み込まれます。

## 5. 実行とテスト
`index.html` はHTTPサーバー経由で提供する必要があります。
- **Python**: `python -m http.server` (プロジェクトルートで実行) → `http://localhost:8000`
- **Node.js (http-server)**: `http-server` (プロジェクトルートで実行) → `http://localhost:8080`

ブラウザの開発者コンソールでエラーを確認してください。

## 6. アプリ固有設定の保存 (例: IndexedDB)

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
        // アプリのinitializeMyAppまたは同等の関数内
        const lastHandle = await getSetting(YOUR_SETTING_KEY);
        if (lastHandle) {
            // ハンドルの使用/検証を試みる
        }
        ```
    -   設定変更時 (例: ユーザーがフォルダを選択):
        ```javascript
        // directoryHandle は FileSystemDirectoryHandle
        await setSetting(YOUR_SETTING_KEY, directoryHandle);
        ```

`DirectoryHandle` を IndexedDB に保存する完全な実装例については、`apps/MediaViewer/mediaViewer.js` を参照してください。ディレクトリハンドルの権限はセッションを跨いで再検証する必要があることに注意してください。
