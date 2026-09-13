// アイドル一覧
const idols = [
    "天海 春香",
    "如月 千早",
    "星井 美希",
    "水瀬 伊織",
    "萩原雪歩",
    "菊地真",
    "島村 卯月",
    "渋谷 凛",
    "本田 未央",
    "神崎 蘭子",
    "春日 未来",
    "最上 静香",
    "伊吹 翼",
    "真壁 瑞希",
    "天道 輝",
    "桜庭 薫",
    "柏木 翼",
    "硲 道夫",
    "櫻木 真乃",
    "風野 灯織",
    "八宮 めぐる",
    "小宮 果穂",
    "花海 咲季",
    "月村 手毬",
    "藤田 ことね",
    "紫雲清夏"
];


// ランダム編成ボタンを取得
const randomButton = document.getElementById("randomButton");

// 結果を表示する場所を取得
const result = document.getElementById("result");


// ボタンが押されたときの処理
randomButton.addEventListener("click", function() {

    // アイドル一覧をコピー
    const shuffled = [...idols];

    // アイドルをシャッフル
    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    // 先頭3人を取得
    const selectedIdols = shuffled.slice(0, 3);


    // 結果を表示
    result.innerHTML = "";

    selectedIdols.forEach(function(idol) {

        const element = document.createElement("div");

        element.className = "idol";

        element.textContent = idol;

        result.appendChild(element);

    });

});
