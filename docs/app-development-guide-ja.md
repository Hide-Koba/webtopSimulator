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
`apps/MyApp/` 内に `myApp.js` (または `yourAppName.js`) を作成します。このファイルには、アプリケーションのJavaScriptロジックが含まれます。
アプリのHTMLとスクリプトが読み込まれた後にメインの `script.js` によって呼び出される初期化関数（例：`initializeMyApp`）を**必ず**定義する必要があります。

このスクリプトの主なタスク：
- IDを使用してアイコンとウィンドウ要素への参照を取得します。
- ウィンドウを開く（アイコンクリック時）および閉じる（閉じるボタンクリック時）ためのイベントリスナーを追加します。
- ウィンドウのドラッグ機能を実装します。

例 (`apps/MyApp/myApp.js`):
```javascript
function initializeMyApp() {
    const appIcon = document.getElementById('my-app-icon');
    const appWindow = document.getElementById('my-app-window');

    // 要素が存在することを確認
    if (!appIcon || !appWindow) {
        console.warn("MyApp の要素が見つかりません。アプリは初期化されません。");
        return;
    }

    const closeButton = appWindow.querySelector('.close-button');
    const windowHeader = appWindow.querySelector('.window-header');

    // ウィンドウを開く
    appIcon.addEventListener('click', () => {
        appWindow.style.display = 'flex'; // または .window のCSSに応じて 'block'
    });

    // ウィンドウを閉じる
    closeButton.addEventListener('click', () => {
        appWindow.style.display = 'none';
    });

    // ドラッグ可能なウィンドウのロジック (sampleApp.js や notepadApp.js などの既存アプリからコピー)
    let isDragging = false;
    let offsetX, offsetY;

    windowHeader.addEventListener('mousedown', (e) => {
        // クリックが閉じるボタン自体の上であればドラッグを防ぐ
        if (e.target === closeButton) return;
        isDragging = true;
        offsetX = e.clientX - appWindow.offsetLeft;
        offsetY = e.clientY - appWindow.offsetTop;
        appWindow.style.cursor = 'grabbing';
        // ウィンドウを前面に表示 (オプション、z-index管理が必要)
        // document.querySelectorAll('.window').forEach(win => win.style.zIndex = '10');
        // appWindow.style.zIndex = '11';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const desktop = document.getElementById('desktop');
        const maxX = desktop.offsetWidth - appWindow.offsetWidth;
        const maxY = desktop.offsetHeight - appWindow.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        appWindow.style.left = `${newX}px`;
        appWindow.style.top = `${newY}px`;
        appWindow.style.transform = 'none'; // 初期センタリングで設定された transform をクリア
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            appWindow.style.cursor = 'move';
        }
    });
}
```
*(注意: ウィンドウを前面に表示するためのz-index管理は一般的な拡張機能ですが、提供されている基本的なドラッグロジックには完全には実装されていません。複数のウィンドウが重なることが懸念される場合は、これを拡張する必要があるかもしれません。)*

## 3. `config.json` の更新
`config.json` 内の `apps` 配列に、アプリケーションの新しいエントリを追加します。

「MyApp」のエントリ例:
```json
{
  "name": "MyApp",
  "script": "apps/MyApp/myApp.js",
  "initFunction": "initializeMyApp",
  "iconHtml": "apps/MyApp/icon.html",
  "bodyHtml": "apps/MyApp/appbody.html",
  "css": "apps/MyApp/style.css"
}
```
この新しいオブジェクトが `apps` 配列の要素として追加され、正しいJSON構文が維持されていることを確認してください（例：最後のエントリでない場合は、先行するアプリオブジェクトの後にカンマを追加します）。

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
