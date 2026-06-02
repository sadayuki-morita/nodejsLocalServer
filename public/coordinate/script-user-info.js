// スマホ情報を格納する配列
//var userInfo ;

//window.onload = function infoLoad() {
// ユーザーエージェントを取得する
var userAgent = '';

userAgent = navigator.userAgent;

// 画面サイズを取得する
var screenWidth = window.screen.width;
var screenHeight = window.screen.height;

// windowサイズを取得する
var windowWidth =  window.innerWidth;
var windowHeight = window.innerHeight;

// ピクセルレシオを取得する
var pixcelRetio = window.devicePixelRatio;

// スクリーンの色深度(bit)を取得する
var colorDepth = window.screen.colorDepth;

// 最大同時タッチ数を取得する
var maxTouchPoint = navigator.maxTouchPoint;

// オブジェクトに格納する
var userInfo = {
    "User Agent" : userAgent,
    "Screen Width" : screenWidth,
    "Screen Width" : screenWidth,
    "Screen Height" : screenHeight,
    "Window Width" : windowWidth,
    "Window Height" : windowHeight,
    "Pixel Ratio" : pixcelRetio,
    "Color Depth" : colorDepth,
    "Max TouchPoint" : maxTouchPoint
};

console.log(userInfo);

// ログに表示する
console.log("User Agent: " + userAgent);
console.log("Screen Width: " + screenWidth + "px");
console.log("Screen Height: " + screenHeight + "px");
console.log("Window Width: " + windowWidth + "px");
console.log("Window Height: " + windowHeight + "px");
console.log("Pixel Ratio: " + pixcelRetio + "device_px/css_px");
console.log("Color Depth: " + colorDepth + "bit");
console.log("Max TouchPoint: " + maxTouchPoint);

// ページに表示する

var colorDepthValue = colorDepth.toString();

document.getElementById("user").innerHTML = "ユーザーエージェント: <br>" + userAgent;
document.getElementById("screen-size").innerHTML = "画面サイズ: " + screenWidth + "px x " + screenHeight + "px";
document.getElementById("window-size").innerHTML = "ウインドウサイズ: " + windowWidth + "px x " + windowHeight + "px";
document.getElementById("pixel-ratio").innerHTML = "ピクセルレシオ(device/css): " + pixcelRetio;
document.getElementById("color-depth").innerHTML = "Color Depth: " + colorDepthValue + "bit";
document.getElementById("max-touchpoint").innerHTML = "Max touch-point: " + maxTouchPoint ;

var button = document.getElementById("info-button");
 
//window.onload = function infoLoad() {    
    // クリックイベントのリスナーを追加
   //button.addEventListener('click', function() {
        // 実行したいコードをここに記述
    
function infoLoad() {        
        // オブジェクトをJSON文字列に変換する
        const jsonString = JSON.stringify(userInfo);

        // Blobオブジェクトを作成する
        const blob = new Blob([jsonString], {type: "application/json"});

        // Blob URLを作成する
        const url = URL.createObjectURL(blob);

        // 現在の日付を取得
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");

        // ファイル名に日付を組み込む
        const fileName = "parameters_" + year + month + day + ".json";

        // <a>タグを作成する
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;       // "parameters.json";
        document.body.appendChild(link);

        // <a>タグをクリックする
        link.click();

        // URLを解放する
        URL.revokeObjectURL(url);

};


// ファイルをアップロードする。
function infoUpload() {

    // オブジェクトをJSON文字列に変換する
    const jsonString = JSON.stringify(userInfo);

    // Blobオブジェクトを作成する
    const blob = new Blob([jsonString], {type: "application/json"});

    // 現在の日付を取得
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    // ファイル名に日付を組み込む
    const fileName = "parameters_" + year + month + day + ".json";

    // フォームデータを作成
    const formData = new FormData();
    formData.append('file', blob, fileName); // Blobとしてファイルを追加
    formData.append('filename', fileName); // ファイル名を追加

    //console.log("formData= ",formData);            
    
    // CSVデータをサーバーへPOSTする
    fetch('/upload', { // サーバーのエンドポイントを指定
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log('Success:', data);      //成功時の処理
        alert(fileName +' をアップロードしました。');

    })
    .catch((error) => {
        console.error('Error:', error);     //エラー発生時の処理
    });

    /*/ uploadボタンの色を変更
    endButton.style.backgroundColor =  "red";
    endButton.style.color =  "white";

    setTimeout(() => {
        dataArry.length = 0;

        endButton.style.backgroundColor =  "buttonface";
        endButton.style.color =  "";
        startButton.style.backgroundColor =  "buttonface";
        startButton.style.color =  "";                
        fileNameButton.style.backgroundColor =  "buttonface";
        fileNameButton.style.color =  "";

        console.log("Delayed for 1 second.");

        location.reload();

    }, 1000);                   //2000);    20241016
    */
}

