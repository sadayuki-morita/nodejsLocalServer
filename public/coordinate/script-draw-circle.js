// 座標データCVSのPC,Linuxサーバーアップロード版　Rev1.0 20260113
// 座標を表示するHTML要素を取得する
const coordinatesDiv = document.getElementById('coordinates');
// touchID毎の座標を格納する配列
let touchData = [];

// タッチイベントを取得する要素を取得
const element = document.getElementById('target-element');

//var touchCoordinates = []; // タッチ座標を格納する配列


// Canvas要素を取得する
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Canvasの背景色を設定する
//context.fillStyle = 'white';
//context.fillRect(0, 0, canvas.width, canvas.height);
context.clearRect(0, 0, canvas.width, canvas.height);           //20251222

// Canvasに円を描く関数(スタンプと重ならない様に、x,y座標を1/2にして、中央に寄せる)
function drawCircle(x, y, index, color) {
    // 円を描画する座標を決定
    const circleX = (x / 2) + (canvas.width / 4); // x座標を1/2にし、canvas.width/4だけ中央に寄せる
    const circleY = (y / 2) - (canvas.height / 8) ; // y座標を1/2にし、canvas.height/8だけ上げる
    const radius = 10; // 円の半径
    //const circleColor = color;  //円の色を指定

    // 円を描画
    context.fillStyle = color; // 塗りつぶし色を設定する
    context.beginPath(); // 新しいパスを開始
    context.arc(circleX, circleY, radius, 0, Math.PI * 2, true); // 円を描画するパスを追加
    context.fill(); // 円を塗りつぶす
    context.closePath();

    // 中心にindexを描画
    context.fillStyle = "white"; // 文字色を設定する
    context.font = 'bold 20px serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    lastChar =  Math.abs(index % 10);                     //Indexの10で割った余りで、indexの１桁目を取ってくる（iPhoneの対応）
    context.fillText(lastChar, circleX, circleY);


    //console.log("circles: " + circles);
}

// touchmoveイベントが発生したときに呼び出される関数
function handleTouchs(event) {
//    event.preventDefault(); // デフォルトの動作をキャンセルする

// タッチ座標を表示するHTML要素のテキストコンテンツを更新する
    coordinatesDiv.innerHTML = ''; // 既存のテキストを削除する
    // タッチポイント表示を消去、canvasをクリア    
    context.clearRect(0, 0, canvas.width, canvas.height);

    // タッチされたすべての座標情報を含むTouchListオブジェクトを取得する
    const touches = event.touches;

    // タッチイベントの発生時刻を取得
    let timestamp = event.timeStamp;
    let type = event.type;

    // ミリ秒からDateオブジェクトに変換して可読性の高い形式に変換
    const eventDate = new Date();

    if (touches.length > 0 ) {

        // タッチ情報を1つずつ処理する
        for (let i = 0; i < touches.length; i++) {
            // タッチ情報オブジェクトからx座標とy座標を取得する
            const touch = touches[i];
            const touchId = touch.identifier;
            //let x = touch.pageX;
            //let y = touch.pageY;
            let x = touch.clientX;
            let y = touch.clientY;
            //let sx = touch.screenX;
            //let sy = touch.screenY;

            let radX = touch.radiusX;
            let radY = touch.radiusY;
            let rote = touch.rotationAngle;
            //let type = event.type;
        

            // タッチ座標と時刻をオブジェクトとして追加
            touchData.push([touches.length, type, touchId, x, y, radX, radY, rote, timestamp, eventDate.toJSON()]);
    
            // タッチ座標を表示するHTML要素のテキストコンテンツを更新する
            coordinatesDiv.innerHTML += `D${Math.abs(touchId % 10)}: C(${touch.clientX.toFixed(2)}, ${touch.clientY.toFixed(2)}), ${type}, T= ${timestamp.toFixed(2)} <br>`;

            // 青い円を描画する
            drawCircle(touch.clientX,touch.clientY,touchId,'blue');

        }

    } else {    //touchendで0ポイント、touchcancelの場合

        // タッチイベントを表示するHTML要素のテキストコンテンツを更新する
        coordinatesDiv.innerHTML = `${type}, T= ${timestamp.toFixed(2)} <br>`;
        // タッチイベントと時刻をオブジェクトとして追加
        touchData.push([touches.length, type, 0, 0, 0, 0, 0, 0, timestamp, eventDate.toJSON()]);
        
    }

    console.log(event.type, touches);

    return touchData;
}


function dataLoad(){
    // オブジェクトをJSON文字列に変換する
    const jsonString = JSON.stringify(touchData);

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
    const fileName = "touchdata_" + year + month + day + ".json";
    
    // <a>タグを作成する
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;   //"touchdata.json";
    document.body.appendChild(link);

    // <a>タグをクリックする
    link.click();

    // URLを解放する
    URL.revokeObjectURL(url);

}

// ファイルをアップロードする。
function upload() {

    // 配列データをCSV文字列に変換
    const csvData = touchData.map(row => row.join(",")).join("\n");

    console.log("csvData= ",csvData);

    // 現在の日付を取得
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hour = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");

    // ファイル名に日付を組み込む
    const fileName = "touchdata_" + year + month + day + "-" + hour + minutes + seconds + ".csv";

    console.log("fileName= ",fileName);

    // CSVデータをBlobに変換
    const blob = new Blob([csvData], { type: 'text/csv' });

    // フォームデータを作成
    const formData = new FormData();
    formData.append('file', blob, fileName); // Blobとしてファイルを追加
    formData.append('filename', fileName); // ファイル名を追加

    console.log("formData= ",formData);            
    
    // CSVデータをサーバーへPOSTする
    fetch('/upload', { // サーバーのエンドポイントを指定
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log('Success:', data);      //成功時の処理
        touchData = [];                     //アップロードしたらデータをクリア
        alert(fileName +' をアップロードしました。');
    })
    .catch((error) => {
        console.error('Error:', error);     //エラー発生時の処理
    });

}


// touchstartイベントリスナーを追加する
document.addEventListener('touchstart', handleTouchs, {passive : true});
document.addEventListener('touchmove', handleTouchs, {passive : true});
document.addEventListener('touchend', handleTouchs, {passive : true});
document.addEventListener('touchcancel', handleTouchs, {passive : true});

console.log(touchData);

