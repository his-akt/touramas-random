const CACHE_NAME = "touramas-random-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];


// インストール時にファイルを保存
self.addEventListener("install", function(event) {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

});


// 保存したファイルを優先して使用
self.addEventListener("fetch", function(event) {

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {

                // 保存済みならそれを使う
                if (response) {
                    return response;
                }

                // 保存されていなければ通常通り通信
                return fetch(event.request);

            })
    );

});