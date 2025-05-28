# Webデスクトップ アプリ開発ガイド (日本語版)

このガイドでは、Webデスクトップ環境に新しいアプリケーションを作成し、統合する方法について説明します。

## 1. プロジェクト構造の概要

Webデスクトップは以下のように構成されています。

-   `index.html`: デスクトップをホストするメインHTMLファイル。
-   `style.css`: デスクトップ、アイコン、ウィンドウのグローバルスタイル。
-   `script.js`: アプリの読み込みとデスクトップ環境を管理するコアJavaScriptロジック。
-   `config.json`: 利用可能なすべてのアプリケーションとそのリソースをリストする設定ファイル。
-   `apps/`: すべての個別アプリケーションを格納するディレクトリ。
    -   `apps/YourAppName/`: 各アプリケーションは独自のサブディレクトリに配置されます。
        -   `icon.html`: アプリケーションのデスクトップアイコン用のHTMLスニペット。
        -   `appbody.html`: アプリケーションのメインウィンドウ構造用のHTMLスニペット。
        -   `yourAppName.js`: アプリケーション固有のJavaScriptロジック。
        -   `style.css`: (オプション) アプリケーション固有のCSSスタイル。

## 2. 新規アプリケーションの作成

新しいアプリケーション（例：「MyApp」）を作成するには、以下の手順に従います。

### ステップ 2.1: アプリケーションディレクトリの作成
`apps/` ディレクトリ内にアプリケーション用の新しいフォルダを作成します。
`apps/MyApp/`

### ステップ 2.2: アイコンHTMLの作成 (`icon.html`)
`apps/MyApp/` 内に `icon.html` を作成します。このファイルは、デスクトップ上のアプリアイコンのHTML構造を定義します。
**重要:** ルート要素には、アプリのJavaScriptが使用する一意の `id` を指定する必要があります。

例 (`apps/MyApp/icon.html`):
```html
<div class="icon" id="my-app-icon">
    <!-- アイコンの表示には img タグや他の要素を使用できます -->
    <span>My App</span>
</div>
```

### ステップ 2.3: アプリ本体HTMLの作成 (`appbody.html`)
`apps/MyApp/` 内に `appbody.html` を作成します。このファイルは、アプリのウィンドウのHTML構造を定義します。
**重要:**
- メインウィンドウの `div` には `window` クラスと一意の `id` を指定する必要があります。
- ウィンドウヘッダーの `div` には `window-header` クラスを指定する必要があります。
- 閉じるボタンには `close-button` クラスを指定する必要があります。
- コンテンツエリアの `div` には `window-content` クラスを指定する必要があります。

例 (`apps/MyApp/appbody.html`):
```html
<div class="window" id="my-app-window">
    <div class="window-header">
        <span>My App Title</span>
        <button class="close-button">X</button>
    </div>
    <div class="window-content">
        <!-- アプリのUI要素はここに配置します -->
        <p>Hello from My App!</p>
    </div>
</div>
```

### ステップ 2.4: アプリケーションJavaScriptの作成 (`myApp.js`)
`apps/MyApp/` 内に `myApp.js` を作成します。このファイルには、アプリケーションのロジックが含まれます。
初期化関数（例：`initializeMyApp`）を**必ず**定義する必要があります。この関数は `script.js` から以下の2つの引数を受け取ります。
1.  `appConfig`: `config.json` からのアプリケーション設定オブジェクト。
2.  `appWindowElement`: アプリケーションのメインウィンドウのDOM要素。

このスクリプトの主なタスク：
- アイコンへの参照を取得します（例：`document.getElementById('my-app-icon')`）。
- `appWindowElement` を使用して、ウィンドウ内の要素（閉じるボタン、ヘッダー、リサイズハンドルなど）を見つけます。
- 開閉ロジックを実装します。
- `appConfig.resizable` と `appConfig.maximizable` に基づいて、ドラッグ可能、リサイズ可能、最大化可能な動作を実装します。

例 (`apps/MyApp/myApp.js`):
```javascript
function initializeMyApp(appConfig, appWindowElement) {
    // appConfig: { name, script, ..., defaultWidth, defaultHeight, resizable, maximizable }
    // appWindowElement: このアプリのメインウィンドウのDOM要素

    const appIcon = document.getElementById('my-app-icon'); // icon.html とIDを一致させてください

    if (!appIcon || !appWindowElement) {
        console.warn(`'${appConfig.name}' の要素が見つかりません。Icon: ${appIcon}, Window: ${appWindowElement}`);
        return;
    }

    const closeButton = appWindowElement.querySelector('.close-button');
    const windowHeader = appWindowElement.querySelector('.window-header');
    // リサイズハンドルは appConfig.resizable が true の場合に script.js によって追加されます
    const resizeHandle = appWindowElement.querySelector('.window-resize-handle'); 

    let originalDimensions = { /* 最大化から復元するために保存 */
        width: appWindowElement.style.width, height: appWindowElement.style.height,
        top: appWindowElement.style.top, left: appWindowElement.style.left
    };
    let isMaximized = false;

    // ウィンドウを開く
    appIcon.addEventListener('click', () => {
        appWindowElement.style.display = 'flex';
        if (!isMaximized) {
            // デフォルトまたは保存された寸法/位置を適用
            appWindowElement.style.width = originalDimensions.width || appConfig.defaultWidth;
            appWindowElement.style.height = originalDimensions.height || appConfig.defaultHeight;
            if (!originalDimensions.left || originalDimensions.left === "50%") {
                 appWindowElement.style.left = '50%'; appWindowElement.style.top = '50%';
                 appWindowElement.style.transform = 'translate(-50%, -50%)';
            } else {
                 appWindowElement.style.left = originalDimensions.left; appWindowElement.style.top = originalDimensions.top;
                 appWindowElement.style.transform = 'none';
            }
        }
        // TODO: ウィンドウを前面に表示するz-index管理を実装
    });

    // ウィンドウを閉じる
    closeButton.addEventListener('click', () => appWindowElement.style.display = 'none');

    // ヘッダーのダブルクリックで最大化/復元
    if (appConfig.maximizable && windowHeader) {
        windowHeader.addEventListener('dblclick', (e) => {
            // ヘッダー内のボタンでのトリガーを回避
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle)) return;

            if (isMaximized) { // 復元
                appWindowElement.classList.remove('maximized');
                appWindowElement.style.width = originalDimensions.width;
                appWindowElement.style.height = originalDimensions.height;
                appWindowElement.style.top = originalDimensions.top;
                appWindowElement.style.left = originalDimensions.left;
                appWindowElement.style.transform = (originalDimensions.left === '50%') ? 'translate(-50%, -50%)' : 'none';
                isMaximized = false;
            } else { // 最大化
                originalDimensions = { /* 現在の状態を保存 */
                    width: appWindowElement.style.width, height: appWindowElement.style.height,
                    top: appWindowElement.style.top, left: appWindowElement.style.left
                };
                appWindowElement.classList.add('maximized');
                appWindowElement.style.transform = 'none'; // transformを解除
                isMaximized = true;
            }
        });
    }

    // ドラッグ可能なウィンドウ
    if (windowHeader) {
        let isDragging = false, dragOffsetX, dragOffsetY;
        windowHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || (resizeHandle && e.target === resizeHandle) || isMaximized) return;
            isDragging = true;
            appWindowElement.style.transform = 'none'; // 正確なオフセット計算のために重要
            dragOffsetX = e.clientX - appWindowElement.offsetLeft;
            dragOffsetY = e.clientY - appWindowElement.offsetTop;
            appWindowElement.style.cursor = 'grabbing';
            // TODO: 前面に表示
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            const desktop = document.getElementById('desktop');
            // 基本的な境界衝突判定
            newX = Math.max(0, Math.min(newX, desktop.offsetWidth - appWindowElement.offsetWidth));
            newY = Math.max(0, Math.min(newY, desktop.offsetHeight - appWindowElement.offsetHeight));
            appWindowElement.style.left = `${newX}px`;
            appWindowElement.style.top = `${newY}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                appWindowElement.style.cursor = 'move';
                // 最大化されていなければ新しい位置を保存
                if(!isMaximized) {
                    originalDimensions.left = appWindowElement.style.left;
                    originalDimensions.top = appWindowElement.style.top;
                }
            }
        });
    }

    // リサイズ可能なウィンドウ (有効かつハンドルが存在する場合)
    if (appConfig.resizable && resizeHandle) {
        let isResizing = false, resizeInitialX, resizeInitialY, initialWidth, initialHeight;
        resizeHandle.addEventListener('mousedown', (e) => {
            if (isMaximized) return;
            e.stopPropagation(); // ドラッグを防止
            isResizing = true;
            resizeInitialX = e.clientX; resizeInitialY = e.clientY;
            initialWidth = appWindowElement.offsetWidth; initialHeight = appWindowElement.offsetHeight;
            appWindowElement.style.transform = 'none'; // 直接的なサイジングを保証
            // 必要であれば50%/50%をピクセル値に変換
            if (appWindowElement.style.left === '50%') {
                appWindowElement.style.left = `${appWindowElement.offsetLeft}px`;
                appWindowElement.style.top = `${appWindowElement.offsetTop}px`;
            }
            document.body.style.cursor = 'nwse-resize';
            appWindowElement.style.userSelect = 'none'; // リサイズ中のテキスト選択を防止
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - resizeInitialX; const dy = e.clientY - resizeInitialY;
            let newWidth = initialWidth + dx; let newHeight = initialHeight + dy;
            const minWidth = parseInt(getComputedStyle(appWindowElement).minWidth, 10) || 150;
            const minHeight = parseInt(getComputedStyle(appWindowElement).minHeight, 10) || 100;
            newWidth = Math.max(minWidth, newWidth); newHeight = Math.max(minHeight, newHeight);
            appWindowElement.style.width = `${newWidth}px`;
            appWindowElement.style.height = `${newHeight}px`;
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                appWindowElement.style.userSelect = '';
                // 最大化されていなければ新しい寸法を保存
                if(!isMaximized) {
                    originalDimensions.width = appWindowElement.style.width;
                    originalDimensions.height = appWindowElement.style.height;
                }
            }
        });
    }
}
```
*(注意: ウィンドウを前面に表示するためのz-index管理は一般的な拡張機能であり、複数のウィンドウでのUX向上のためには実装すべきです。この例ではリサイズ/最大化ロジックに焦点を当てています。)*

## 3. `config.json` の更新
`config.json` 内の `apps` 配列に、アプリケーションの新しいエントリを追加します。新しいウィンドウ動作プロパティを含めます。
- `defaultWidth` (文字列、例: "400px")
- `defaultHeight` (文字列、例: "300px")
- `resizable` (ブール値、`true` または `false`)
- `maximizable` (ブール値、`true` または `false`)

「MyApp」のエントリ例:
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
  "maximizable": true
}
```
この新しいオブジェクトが `apps` 配列の要素として追加され、正しいJSON構文が維持されていることを確認してください。

## 4. アプリケーションのスタイリング
- **グローバルスタイル**: アイコン (`.icon`)、ウィンドウ (`.window`)、ヘッダー (`.window-header`) などの一般的なスタイルは、メインの `style.css` で定義されています。
- **アプリ固有のスタイル**: 各アプリケーションは、そのディレクトリ内に独自の `style.css` ファイルを持つことができます（例：`apps/MyApp/style.css`）。
    - このファイルを作成し、アプリケーションに固有のスタイルを追加します。
    - これらのスタイルは、アプリの `config.json` で `css` パスが正しく指定されていれば自動的に読み込まれます。
    - これは、アプリケーション固有のスタイルを管理し、グローバルな `style.css` から分離するための推奨される方法です。

## 5. 実行とテスト
`fetch` APIを使用して `config.json` とHTMLスニペットを正しく読み込むには、HTTPサーバー経由で `index.html` ファイルを提供**しなければなりません**。ファイルシステムから直接 `index.html` を開く (`file:///`) と、CORSエラーが発生する可能性が高くなります。

簡単な組み込みサーバーを使用できます。
- **Python**: ターミナルでプロジェクトルートに移動し、次を実行します。
  `python -m http.server`
  次に、ブラウザで `http://localhost:8000` を開きます。
- **Node.js (http-serverを使用)**: Node.jsがインストールされている場合は、`http-server` をグローバルにインストール (`npm install -g http-server`) し、プロジェクトルートから次を実行します。
  `http-server`
  次に、提供されたURL（通常は `http://localhost:8080`）を開きます。

変更を加えた後、ブラウザでページを更新してください。エラーがないか、ブラウザの開発者コンソールを確認してください。

この構造により、モジュール式アプリ開発が可能になり、各アプリの関心事（HTML、JS）が主に独自のディレクトリ内に保持されます。
