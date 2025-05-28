# WebDesktopLib.js - 技術仕様およびAPIリファレンス (日本語版)

`WebDesktopLib.js` は、Webデスクトップ環境をサポートするJavaScriptライブラリです。デスクトップ、アプリケーション、およびそれらの相互作用を管理するための中心的なコア機能とユーティリティを提供します。

## 全体構造

`WebDesktopLib` は、公開モジュールを公開するオブジェクトを返す即時実行関数式 (IIFE) です。

```javascript
const WebDesktopLib = (() => {
    // ライブラリ用のプライベート変数と関数

    // --- DOMユーティリティモジュール ---
    const DOM = { /* ... */ };

    // --- タスクバー管理モジュール ---
    const Taskbar = { /* ... */ };

    // --- ストレージ管理モジュール ---
    const Storage = { /* ... */ };

    // --- イベントバスモジュール ---
    const EventBus = { /* ... */ };

    // 公開API
    return {
        DOM,
        Taskbar,
        Storage,
        EventBus
    };
})();
```

## モジュール

### 1. `WebDesktopLib.DOM`

一般的なDOM操作のためのユーティリティ関数を提供します。

-   **`DOM.qs(selector, parent = document)`**
    -   説明: `parent.querySelector(selector)` のショートカット。
    -   パラメータ:
        -   `selector` (string): 一致させるCSSセレクタ。
        -   `parent` (Element, オプション): 検索対象の親要素。デフォルトは `document`。
    -   戻り値: (Element | null) 最初に見つかった要素、または `null`。

-   **`DOM.qsa(selector, parent = document)`**
    -   説明: `parent.querySelectorAll(selector)` のショートカット。
    -   パラメータ:
        -   `selector` (string): 一致させるCSSセレクタ。
        -   `parent` (Element, オプション): 検索対象の親要素。デフォルトは `document`。
    -   戻り値: (NodeList) 一致するすべての要素を含む静的なNodeList。

-   **`DOM.createElement(tagName, attributes = {}, children = [])`**
    -   説明: 指定された属性と子要素を持つ新しいDOM要素を作成します。
    -   パラメータ:
        -   `tagName` (string): 要素のHTMLタグ名。
        -   `attributes` (object, オプション): 設定する属性のオブジェクト。特別なキー:
            -   `className`: `element.className` を設定。
            -   `textContent` または `innerHTML`: それぞれのプロパティを設定。
            -   その他のキーは `element.setAttribute(key, value)` を使用して設定。
        -   `children` (Array, オプション): 追加する子ノード (文字列またはElement) の配列。
    -   戻り値: (Element) 新しく作成されたDOM要素。

-   **`DOM.empty(element)`**
    -   説明: 指定された要素からすべての子ノードを削除します。
    -   パラメータ:
        -   `element` (Element): 空にするDOM要素。

### 2. `WebDesktopLib.Taskbar`

アプリボタンやウィンドウのz-indexを含む、デスクトップタスクバーを管理します。

-   **`Taskbar.init(taskbarDomElement, appInstancesRef)`**
    -   説明: タスクバーマネージャを初期化します。`script.js` によって一度呼び出される必要があります。
    -   パラメータ:
        -   `taskbarDomElement` (Element): タスクバーを表すDOM要素。
        -   `appInstancesRef` (Map): `appName -> appInstance` を格納する `appInstances` Map (`script.js` 内) への参照。タスクバーボタンがアプリインスタンスと対話するために使用されます。

-   **`Taskbar.add(appConfig, appWindowElement)`**
    -   説明: アプリのボタンをタスクバーに追加します。アプリのボタンが既に存在する場合、ウィンドウが表示されていることを確認し、最前面に表示します。`appWindowElement` に初期のz-indexを割り当てます。
    -   パラメータ:
        -   `appConfig` (object): アプリケーションの設定オブジェクト。
        -   `appWindowElement` (Element): アプリのメインウィンドウのDOM要素。
    -   戻り値: (Element) 作成された、または既存のタスクバーボタン要素。

-   **`Taskbar.remove(appWindowId)`**
    -   説明: アプリのボタンをタスクバーから削除し、追跡対象からも削除します。
    -   パラメータ:
        -   `appWindowId` (string): ボタンを削除すべきアプリウィンドウのID。

-   **`Taskbar.setActive(appWindowId)`**
    -   説明: `appWindowId` に対応するタスクバーボタンをアクティブとして設定し（視覚的に強調表示）、他のボタンを非アクティブにします。
    -   パラメータ:
        -   `appWindowId` (string): アプリウィンドウのID。

-   **`Taskbar.setInactive(appWindowId)`**
    -   説明: `appWindowId` に対応するタスクバーボタンを非アクティブとして設定します。
    -   パラメータ:
        -   `appWindowId` (string): アプリウィンドウのID。

-   **`Taskbar.bringToFront(appWindowId)`**
    -   Description: 指定されたアプリウィンドウを最前面に表示し、グローバルな `z-index` カウンタをインクリメントします。また、そのタスクバーボタンをアクティブに設定します。
    -   パラメータ:
        -   `appWindowId` (string): アプリウィンドウのID。

-   **`Taskbar.getHighestZIndex()`**
    -   説明: タスクバーマネージャが使用する現在の最大のz-index値を返します。
    -   戻り値: (number)

### 3. `WebDesktopLib.Storage`

ブラウザストレージ機構のための簡略化されたラッパーを提供します。

-   **`Storage.local` (object):** `localStorage` 操作用。
    -   `set(key, value)`: `value` (`JSON.stringify` されたもの) を `key` で保存。
    -   `get(key, defaultValue = null)`: `key` の値を取得して解析。見つからない場合やエラー時は `defaultValue` を返す。
    -   `remove(key)`: `key` でアイテムを削除。
    -   `clear()`: すべての `localStorage` をクリア。

-   **`Storage.indexedDB` (object):** IndexedDB 操作用。
    -   `_openDB(dbName, version, onUpgradeNeeded)`: (プライベートヘルパーだがパターンは有用) IndexedDBを開く/作成する。
    -   `get(dbName, version, storeName, key, onUpgradeNeededCallback)`: `storeName` から `key` で値を非同期に取得。
    -   `set(dbName, version, storeName, key, value, onUpgradeNeededCallback)`: `storeName` の `key` に `value` を非同期に設定。
    -   `delete(dbName, version, storeName, key, onUpgradeNeededCallback)`: `key` でエントリを非同期に削除。
    -   `clear(dbName, version, storeName, onUpgradeNeededCallback)`: `storeName` のすべてのエントリを非同期にクリア。
    -   `onUpgradeNeededCallback` 関数 (例: `function(event) { event.target.result.createObjectStore(...); }`) は、DBが最初に作成されるかバージョンがアップグレードされるときにオブジェクトストアを作成するために不可欠です。

### 4. `WebDesktopLib.EventBus`

コンポーネント間の疎結合な通信のための単純な発行/購読システム。

-   **`EventBus.subscribe(eventName, callback)`**
    -   説明: `callback` 関数を `eventName` に購読します。
    -   パラメータ:
        -   `eventName` (string): 購読するイベントの名前。
        -   `callback` (function): イベント発行時に呼び出される関数。`publish` 時に渡されたデータを受け取ります。

-   **`EventBus.unsubscribe(eventName, callback)`**
    -   説明: 特定の `callback` を `eventName` から購読解除します。
    -   パラメータ:
        -   `eventName` (string): イベント名。
        -   `callback` (function): 購読時に使用した正確なコールバック関数の参照。

-   **`EventBus.publish(eventName, data)`**
    -   説明: イベントを発行し、提供された `data` と共にすべての購読済みコールバックを呼び出します。
    -   パラメータ:
        -   `eventName` (string): 発行するイベントの名前。
        -   `data` (any, オプション): 購読済みコールバックに渡すデータ。

## 今後の検討事項 / 潜在的なモジュール

-   **UIコンポーネント:** 標準化されたモーダル、ダイアログ、通知。
-   **国際化 (i18n):** 多言語サポートのためのユーティリティ。
-   **ドラッグアンドドロップユーティリティ:**汎用的なドラッグアンドドロップヘルパー。
-   **設定マネージャ:** より高度な設定の読み込み/管理。

このドキュメントは `WebDesktopLib.js` の進化に合わせて更新されるべきです。
