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
`apps/MyApp/` 内に `myApp.js` を作成します。このファイルは `AppBase` を拡張するクラスを定義する必要があります。
`config.json` の `initFunction` プロパティには、このクラスの名前を設定します。

例 (`apps/MyApp/myApp.js`):
```javascript
class MyApp extends AppBase {
    constructor(appConfig, appWindowElement) {
        super(appConfig, appWindowElement); // AppBaseコンストラクタを呼び出す
        // AppBaseコンストラクタの最後に this.onInit() が呼び出されます。
    }

    onInit() {
        // AppBaseコンストラクタによって呼び出されます。
        // MyApp固有の初期化処理をここに追加します。
        // 例: このアプリのウィンドウ内の特定のUI要素への参照を取得
        // this.myButton = this.appWindowElement.querySelector('.my-app-button');
        // if (this.myButton) {
        //     this.myButton.addEventListener('click', () => this.doSomething());
        // }
        if (!this.isValid) return; // AppBaseのセットアップが失敗したか確認
        console.log(`${this.appConfig.name} がAppBaseを使用して初期化されました。`);
    }

    onOpen() {
        // ウィンドウが開かれた/タスクバーから復元されたときにAppBaseによって呼び出されます。
        // ウィンドウが表示されたときのアプリ固有のロジックを追加します。
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} が開かれました。`);
    }

    onClose() {
        // ウィンドウが閉じられたとき(Xボタン)にAppBaseによって呼び出されます。
        // 次回の「新規」オープンに備えて、アプリ固有の状態をここでリセットします。
        if (!this.isValid) return;
        console.log(`${this.appConfig.name} が閉じられ、固有の状態がリセットされました。`);
        // 例: if (this.myTextarea) this.myTextarea.value = '';
    }

    // 他のAppBaseライフサイクルメソッドも必要に応じてオーバーライドできます:
    // onMinimize() { ... }
    // onToggleMaximize(isNowMaximized) { ... }

    // アプリ固有のメソッドを追加:
    // doSomething() {
    //    console.log(`${this.appConfig.name} が何かを実行しています！`);
    // }
}

// クラスをグローバルに利用可能にし、script.jsがインスタンス化できるようにします。
// 通常、スクリプトのトップレベルで定義されたクラスでは自動的にそうなります。
// モジュールやバンドラを使用している場合は、window.MyApp = MyApp; が必要になることがあります。
```
`AppBase` クラスは、オープン、クローズ、最小化、最大化、ドラッグ、リサイズ、基本的なタスクバー操作といった共通機能を処理します。アプリ固有のクラスは、その独自の機能に集中し、これらのライフサイクルイベントに対してカスタム動作が必要な場合に `AppBase` のメソッドをオーバーライドできます。

## 3. `config.json` の更新
アプリケーションの新しいエントリを追加します。`initFunction` は、**アプリのクラス名**にする必要があります。
また、アイコンのHTML IDが規約 (`appName.toLowerCase() + '-app-icon'`) に従わない場合は、`iconId` プロパティを含めます。

「MyApp」のエントリ例:
```json
{
  "name": "MyApp",
  "iconId": "my-app-icon", // icon.html 内のアイコンの特定のID
  "script": "apps/MyApp/myApp.js",
  "initFunction": "MyApp", // これはクラス名と一致する必要があります
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
この新しいオブジェクトが `apps` 配列の要素として追加され、正しいJSON構文が維持されていることを確認してください。
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
