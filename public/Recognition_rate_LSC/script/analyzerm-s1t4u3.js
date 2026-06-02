/**
 * マルチタッチ制御スクリプト：
 * Rev.2.0.0	20240927
 * 		ID1,S1,T4のIDを_cardConfのパラメータで切り換えて、共用化出来るようにした。
 * 		また、ID認証、動作閾値判定、動作疑似アナログ判定を可能化したアナライザに対応し、HTML側で動作判定の有無を変更可能化したもの。
 * Rev.2.1.0	20250305
 * 		IDパターンのタッチ向きに対応して処理を変えるrotation判定に対応。
 * Rev.3.0.1	20250630
 * 		4電極ID系列 U3-XXX に対応。ID認証、動作閾値判定、動作疑似アナログ判定、タッチ方向判定、動作閾値(疑似アナログ)＋タッチ方向判定の6モードをIndex.htmlのcardConfから設定可能化
 * 		従来の3点式2点式C-CardのSDKとの整合性で、ページ遷移しない場合の制御をカードIDと"position"で行うように変更
 * Rev.3.1.0	20250807
 * 		動作判定、タッチ方向判定でも常にcallbacksのposition='1'を返し、 callbacksの中でcardIDを処理の判定に扱えるようにする修正、
 * 		動作判定＋タッチ方向の値は、cardId−positionの形式でコールバックされる。 
 * 		ID系列をIndex.htmlから変数で変更可能化
 * Rev.3.1.1	20250905
 * 		"touchedClearInterval" をIndex.htmlから変数で変更可能化
 * 		判定値計算のLogデータ出力見直し 
 * Rev.3.1.2	20250917
 * 		動作判定、タッチ方向判定の仕様毎のanalyzed.idとanalyzed.pointの合成条件を適正化
 * Rev.3.1.3	20250924
 * 		index.htmlで定義する変数(idSerise, motionAnalogOut[], touchAngleDeg, resultData)の削減
 * Rev.3.1.4	20251010
 * 		HTMLの先頭で、idSeriseの入力を求めない方式に対応
 * Rev.3.1.5	20251014
 * 		SDKの対応で、php化するときに変更する箇所を明確化
 * Rev.3.1.6	20251104 
 * 		タッチ方向判定NGの場合、判定Stop追加
 * Rev.3.2.0	20251110
 * 		motionDetectNum[] 設定の適正化。コールバックの戻り値positionと配列の要素番号を一致させる。タッチ方向判定も同時に行う場合の対応
 * Rev.3.2.1	20251226
 * 		離れた指のタッチ情報が残ってしまう対策で、deletePoints関数を一旦self.nowtouchPointsをクリアして再度全タッチ情報をAddする方式に変更
 * 		C-Stampに対してC-Cardの認識率が低い問題の解析対応
 * Rev.3.2.2	20260127
 * 		SDK用アナライザとの共用化対応。タッチ座標解析データの5点以下のデータ取得とコンソール出力有無判定追加
 * Rev.3.2.3	20260129
 * 		HTMLでidSeriseを指定しない場合のエラー対策
 * Rev.3.2.4	20260204
 * 		cardConfの記述ファイル変更。不用なコンソールログ削除、アナライザソースのHTMLに依存するgetElementコード削除
 * Rev.3.2.5	20260520
 * 		デモページのsrc共通化、管理見直しによるディレクトリ構成の見直し、SDKのディレクトリ構造とデモ、デバッグ用のディレクトリ構造の整合性を取るため、HTMLでidSerise定義必要。
 * Rev.3.2.6	20260529
 * 		デモ用ディレクトリ構成とSDK、その他のディレクトリ構成の共用化、デモ用ディレクトリは、HTML先頭で directoryPass を指定する必要がある。
 * 		directoryPassが定義されていない場合は、デフォルトで"./script"を読み込むようにしている。
 * 
/**
 * 外部ファイルの読み込み
*/

/* ------------- SKDベースの場合とデモ、デバッグ評価等のソースの場合のディレクトリ構造、読み込みファイルの設定　20260520 */
//デモページのsrc共通化、管理見直しによるディレクトリ構成の見直し　20260518
//デモ用ディレクトリ構成とSDK、その他のディレクトリ構成の共用化、デモ用ディレクトリは、HTML先頭で directoryPass を指定する必要がある。20260529

if(typeof directoryPass === "undefined"){directoryPass = "./script";}		//HTMLでdirectoryPassが定義されていない場合のデフォルト値設定 20260529

let srcCardrmFile = directoryPass + "/cardrm-s1t4u3-ob.js";
let srcIdFile;

if(typeof idSerise=== "undefined"){							//SKDのソースの場合、phpファイルを設定　20260128 ディレクトリ構成見直し 20260518
	idSerise="";
	srcIdFile= directoryPass + "/c/cs1.php";
	srcCardrmFile= directoryPass + "/cardrm-s1t4u3-ob.php";
} else if(idSerise === "ALL"){
	srcIdFile= directoryPass + "/c/cms1allv4.js";                                //アクスタ2次試作導電パターン180度回転対応  20250516
	idSerise="S1";
} else if(idSerise === "ID1"){
	srcIdFile= directoryPass + "/c/cv8all.js";
} else if(idSerise === "T4"){
	srcIdFile= directoryPass + "/c/ct4all.js";
} else if(idSerise === "U1"){
	srcIdFile= directoryPass + "/c/cu1all.js";
} else if(idSerise === "U3"){
	srcIdFile= directoryPass + "/c/cu3all.js";
} else if(idSerise === "S1"){
	srcIdFile= directoryPass + "/c/cs1.js";
} else {
	idSerise="S1";	
	srcIdFile= directoryPass + "/c/cs1.js";
}
	console.log("idSerise= ",idSerise,", srcIdFile= ",srcIdFile, ", srcCardrmFile= ",srcCardrmFile);		//20260519

/* --------------- */
/**
 * カード解析処理制御設定
*/
var MTCardConfig = function(argument) {
	this.touchWaitTime = 700;							/* カード識別成功時に次のタッチを受け付けるまでのインターバル(msec) */
	this.showErrorAlert = true;							/* エラーアラート表示フラグ */
	this.touchElement = 'touch';						/* タッチを受け付ける要素(ID又は要素で指定) */
	this.initModalElemId = 'init_modal';				/* メディア読込用モーダルの要素のID */
	this.initModalDoneElemId = 'init_modal_done';		/* メディア読込用モーダルを閉じる(ボタン)要素のID */
	this.defaultContentsId = 'default_contents';		/* 初期表示要素のID */
	this.variableContentsClass = '.variable_contents';	/* 動的表示切替要素のクラス */
	this.elemIdPrefix = 'i';							/* この値+[1-3]のIDで定義された要素がタッチ時に表示されるようになる ※[1-3]はカードの持ち手と紐付き、1:上部、2:中部、3:下部になる -> 最終的にi1,i2,i3のようなIDになる */
	this.willStartCollbackKey = 'start';				/* カード解析処理実行直前に呼ばれるコールバックに指定するキー名 */
	this.onErrorCallbackKey = 'error';					/* カード解析処理失敗に呼ばれるコールバックに指定するキー名 */
	this.okSoundElemId = 'beep_ok';						/* カードタッチ成功時効果音要素のID */
	this.ngSoundElemId = 'beep_ng';						/* カードタッチ失敗時効果音要素のID */
	this.playSound = true;								/* カードタッチ後に効果音を鳴らすか否かの設定(true:鳴らす、false:鳴らさない) */
	this.commonErrorMsg = 'カードが認識出来ませんでした。';	/* 汎用エラーメッセージ */

	this.accuracy = 1 ;                                    	//グリッド座標誤差許容範囲(unit: grid)

	this.touchedClearInterval = 200;						//タッチイベント終了後に蓄積している座標を初期化するまでのインターバル(msec)

//motion制御
	this.transitTouchWaitTime = 25;						   	//motion制御カード移動中の識別成功時に次のタッチを受け付けるまでのインターバル(msec)
	//this.motionDetectNum = [2,-1,2,2,1,1,0,0];             	///motion制御指定配列（配列の要素番号 0:motion制御有、1:設定なし(-1固定)、2:下、3:上、4:左、5:右、6:右回転、7:左回転 の値を 閾値制御の場合 1 疑似アナログ制御の場合 2 にする。例えば、上下を閾値制御、左右回転をアナログ制御したい場合は、[2,-1,1,1,0,0,2,2]と指定する）
	this.motionDetectNum = [0,0,0,0,0,0,0,0];              	///motion制御指定配列（配列の要素番号 0:motion制御有、1:設定なし(-1固定)、2:下、3:上、4:左、5:右、6:右回転、7:左回転 の値を 閾値制御の場合 1 疑似アナログ制御の場合 2 にする。例えば、上下を閾値制御、左右回転をアナログ制御したい場合は、[2,-1,1,1,0,0,2,2]と指定する）
	this.motionThresholdGridX = 1;                       	//motion制御X方向grid幅閾値
	this.motionThresholdGridY = 1;                         	//motion制御Y方向grid幅閾値
	this.motionThresholdAngle = 15;                        	//motion制御回転角度閾値(unit: degree)
//rotation判定
	this.rotationDetect = 0;                			   	//rotation判定指定配列（0:rotation判定無、1:rotation判定有、{判定有の場合、タッチパネルX座標軸の＋方向ベクトルと基準電極原点側から遠端側に向かうベクトルのなす角0°：callback.point=1、90°：2、180°：3、270°：4}とする。）	20250305
	this.rotationThresholdAngle = 30;                      	//rotation判定角度閾値(unit: degree)		20250305

	this.motionAnalogOut = [0,0,0,0];                       //動作変化のデルタ値(=変化量/閾値)格納 motionAnalogOut = [deltaX,deltaÝ,deltaangle,deltaTime]
	this.touchAngleDeg = 0;                                 //タッチ方向判定回転角		20250630

//callbacksのposition戻り値制御
	this.fixPosition = false;								//動作判定、タッチ方向判定時のpositionの戻り値制御、false : position=analyze.point , true : position=1 cardId = cardId + "-" + analyze.point

//ID系列毎の仕様設定
	this.cardIdNum = [];                                 	//認証判定するID = CONFV8 の全ての場合、HTMLのコールバック関数内でID一致判定すること

//IDシリーズ対応する設定変更===
	if(idSerise === "S1" || idSerise === "ID1"  || idSerise === "" ){
		//S1系列、ID1系列
		//this.cardIdNum = ["ID10333-2", "S1-1306"];           	//認証判定するID
		this.yGridMax = 12;                                    	//Y方向Grid座標最大値(unit: grid)             
		this.xbasisGridDistance = 14;                          	//基準電極間X方向距離(unit: grid)            
		this.ybasisGridDistance = 10;                          	//基準電極間Y方向距離(unit: grid)            
		this.x1basisGridCoordinate = 0;                        	//基準電極1XGrid座標
		this.y1basisGridCoordinate = 10;                       	//基準電極1YGrid座標
		this.targetRad = -0.6202494859828215;                  	//基準電極を結ぶ線分とX軸の角度(unit: radian)
		this.dnCount = 5;									   	//認証するID系列の電極数					20250409 
	} else if(idSerise === "T4"){          
		//T4系列
		//this.cardIdNum = ["T4-51"];				           //認証判定するID
		this.yGridMax = 14;                                    //Y方向Grid座標最大値(unit: grid)             
		this.xbasisGridDistance = 10;                          //基準電極間X方向距離(unit: grid)            
		this.ybasisGridDistance = 10;                          //基準電極間Y方向距離(unit: grid)            
		this.x1basisGridCoordinate = 2;                        //基準電極1XGrid座標
		this.y1basisGridCoordinate = 12;                       //基準電極1YGrid座標
		this.targetRad = -0.7853981633974483;                  //基準電極を結ぶ線分とX軸の角度(unit: radian)
		this.dnCount = 5;									   //認証するID系列の電極数					20250409           
	} else if(idSerise === "U1"){
		//U1系列
		//this.cardIdNum = ["U1-33"];           				//認証判定するID
		this.yGridMax = 10;                                    	//Y方向Grid座標最大値(unit: grid)              
		this.xbasisGridDistance = 14;                          	//基準電極間X方向距離(unit: grid)            
		this.ybasisGridDistance = 10;                          	//基準電極間Y方向距離(unit: grid)            
		this.x1basisGridCoordinate = 0;                        	//基準電極1XGrid座標
		this.y1basisGridCoordinate = 10;                       	//基準電極1YGrid座標
		this.targetRad = -0.6202494859828215;                  	//基準電極を結ぶ線分とX軸の角度(unit: radian)
		this.dnCount = 4;									   	//認証するID系列の電極数					20250409           
	} else if(idSerise === "U3"){
		//U3系列
		//this.cardIdNum = ["U3-33"];           				//認証判定するID
		this.yGridMax = 10;                                    	//Y方向Grid座標最大値(unit: grid)             
		this.xbasisGridDistance = 12;                          	//基準電極間X方向距離(unit: grid)            
		this.ybasisGridDistance = 4;                          	//基準電極間Y方向距離(unit: grid)            
		this.x1basisGridCoordinate = 0;                        	//基準電極1XGrid座標
		this.y1basisGridCoordinate = 8;                      	//基準電極1YGrid座標
		this.targetRad = -0.321750554;                  		//基準電極を結ぶ線分とX軸の角度(unit: radian)
		this.dnCount = 4;									   	//認証するID系列の電極数					20250409           
	}

	var self = this;
	/* 値の指定があればセット */
	if ((typeof argument === 'object') && (argument !== null)) {
		Object.keys(argument).forEach(function (key) {
			self[key] = argument[key];			
		});
	}
};

var includeCount = 0, requireCount = 0;
(function () {
	var query = (typeof window.location.search === 'string') ? window.location.search : '';
	if (/^\?/.test(query)) { query = query.substring(1); }
	var require = [srcIdFile, srcCardrmFile], scripts = {}; requireCount = require.length;		//SKDベースの場合とデモ、デバッグ評価等のソースの場合のデイレクトリ構造、読み込みファイルの設定　20260519
	for (var i = 0; i < requireCount; i++) {
		var src = require[i] + '?' + query;  scripts[src] = document.createElement('script');  scripts[src].src = src; document.getElementsByTagName('head')[0].appendChild(scripts[src]);
		scripts[src].onload = function() {
			if (typeof CONFV8 !== 'undefined') {
				if (typeof convertConf !== 'undefined') {
					cardConfMap = convertConf(CONFV8);
				}
			}
			includeCount++;
		};
	}
})();

/**
 * 解析処理群
 * @param callback 解析結果のコールバック
 * @param willStart 解析スタート直前のコールバック
 * @param onError 解析エラー時のコールバック
 * @returns
 */
var Analyze = function (callback, willStart, onError) {
	this.callback = (typeof callback === 'function') ? callback : null;
	this.willStartAnalysis = (typeof willStart === 'function') ? willStart : null;
	this.onErrorAnalysed = (typeof onError === 'function') ? onError : null;

	/**
	 * 有効デバイス判定
	 */
	this.isEnableDevice = function(tablet) {
		if (window.ontouchstart !== undefined) {
			if (tablet === undefined) { tablet = false; }
			var ua = navigator.userAgent.toLowerCase();
			if (/ip(hone|ad|od)/.test(ua)) { this.os = 'ios';  if (/safari/.test(ua)) { if (!tablet) { if (/mobile/.test(ua)) { return true; } } else { return true; } } }
			if (/android/.test(ua)) { this.os = 'android';  if (/chrome/.test(ua)) { if (!tablet) { if (/mobile/.test(ua)) { return true; } } else { return true; } } }
		}
		return false;
	};
	/**
	 * 現在時刻
	 */
	this.getNowTime = function() { var date = new Date(); return date.getTime(); };
	/**
	 * クエリ生成
	 */
	this.buildQuery = function(params) {
		return Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
	};
	/**
	 * クエリ解析
	 */
	this.parseQuery = function(search) {
		if (typeof search !== 'string') { search = window.location.search; }
		if (/^\?/.test(search)) { search = search.substring(1); }
		var params = {}, hash = search.slice(1).split('&'), cnt = hash.length;
		for (var i = 0; i < cnt; i++) { var tmp = hash[i].split('='); params[tmp[0]] = tmp[1]; }
		return params;
	};
	/**
	 * プロパティ更新
	 */
	this.setProperty = function(name, value) {
		if (this[name] !== undefined) {
			if (typeof this[name] === 'function') { if (name !== 'callback') { return; } }
			this[name] = value;
		}
	};
	/**
	 * 参照無しでコピー(JSON経由で復元する為利用できない値有り)
	 */
	this.deepCopy = function(args) {
		var result = null;
		try { result = JSON.parse(JSON.stringify(args)); } catch (exception) { console.log(exception); }
		return result;
	};

	/**
	 * 動作判定初期化処理
	 */
	this.motionInit = function() {
		if (this.clearTimeOut !== null) { 
			clearTimeout(this.clearTimeOut); 
		}
		this.idFirstAuth= false,         		//最初のID認証フラグ    20240820
		this.authOriginPoints = [],
		this.idMotionAuth= false,        		//動作ID認証フラグ    20240820
		this.authMotionPoints= [];
		//motionAnalogOut= [0,0,0,0];				//移動変化量/閾値データ格納	20240905
		this.lastMotionAnalogOut= [];			//前イベントの移動変化量/閾値データ格納	20240906
		this.deltaMoitonAnalogOut= [];

		//document.getElementById('name').style.backgroundColor = "#1ff8ed";	

		//console.log("motioninit");			//20250924
	};
	/**
	 * 共通初期化処理
	 */
	this.init = function() {
		if (this.clearTimeOut !== null) { clearTimeout(this.clearTimeOut); }
		this.onTouch = false;  
		this.nowtouchPoints = {};  
		this.clearTimeOut = null;  
		this.pause = false;
		this.idFirstAuth= false,         		//最初のID認証フラグ    20240820
		this.authOriginPoints = [],
		this.idMotionAuth= false,        		//動作ID認証フラグ    20240820
		this.authMotionPoints= [],
		this.motionAnalogOut= [0,0,0,0];				//移動変化量/閾値データ格納	20240905
		this.lastMotionAnalogOut= [];			//前イベントの移動変化量/閾値データ格納	20240906
		this.deltaMoitonAnalogOut= [];
		this.touchAngleDeg = 0;                                  //タッチ回転角		20250630
		this.rotatePoint = 0;

		//document.getElementById('name').style.backgroundColor = "transparent";			//表題の初期背景色

		//console.log("init");			//20250924

	};

	/**
	 * 初回のみ実行する初期化処理
	 */
	this.constructor = function() {
		this.os = 'pc';  
		this.targetElement = null;  
		this.groupCodeKey = 'gp';  
		this.passive = false;  
//		this.pointNumMax = 5;
		this.pointNumMax = _cardConf.dnCount;					//20250409 ID系列電極数のパラメータdnCountで制御 
		this.enableZoomAction = false;  
		this.defaultLanguage = 'ja';  
		this.language = 'ja';
		this.errorMap = {0: null, 1: {'ja':'エラー', 'en':'Error'}, 2: {'ja':'通信エラー', 'en':'Network error'}, 3: {'ja':'処理エラー', 'en':'Process error'}, 4: {'ja':'APIキー認証エラー', 'en':'API Key error'}, 5: {'ja':'通信キャンセル', 'en':'Connection cancel'}};
		this.enableScrollAction = false;  
		this.touchedClearInterval =  _cardConf.touchedClearInterval;	//20250905	200;	//1000;	20250422	//200;	//300;
		this.isEnableDevice();  
		this.init();
		//console.log("touchedClearInterval",this.touchedClearInterval);			//20250423
	};

	this.constructor();
	var self = this;

	try { var options = Object.defineProperty({}, 'passive', { get: function() { self.passive = true; } });  window.addEventListener('test', options, options);  window.removeEventListener('test', options, options); } catch (exception) { this.passive = false; }
	/**
	 * ブラウザバック等での再表示時には動的更新値を初期化
	 */
	this.reloadFunc = function() { self.init(); };
	window.removeEventListener('pageshow', this.reloadFunc, this.passive ? {passive: true, capture: false} : false);
	window.addEventListener('pageshow', this.reloadFunc, this.passive ? {passive: true, capture: false} : false);


	/**
	 * エラーコードに該当するエラーメッセージを返却
	 * @param Number errorCode タッチイベント
	 */
	this.getErrorMessage = function(errorCode) {
		errorCode = parseInt(errorCode);
		if (self.errorMap[errorCode] === undefined) { errorCode = 1; }
		if (self.errorMap[errorCode][self.language] !== undefined) {
			return self.errorMap[errorCode][self.language];
		} else {
			if (self.errorMap[errorCode][self.defaultLanguage] !== undefined) {
				return self.errorMap[errorCode][self.defaultLanguage];
			}
		}
		return 'unknown error';
	};
	

	/**
	 * 認証に使用する各種フラグと配列をクリア
	 */
	this.clearPointsCache = function() {
		self.nowtouchPoints = {};

		self.idFirstAuth = false;			//20240925　動作判定フラグ追加
		self.idMotionAuth = false;

		};

	/**
	 * ポーズ解除
	 */
	this.restart = function() {
		self.pause = false;
		self.onTouch = false;

		//document.getElementById('name').style.backgroundColor = "transparent";					////20240808	タッチ座標増減で表題背景色を変える
	};

	/**
	 * 解析処理実行
	 */
	this.analyze = function(points) {

		if (!self.onTouch) { return false; }
		if (self.pause) { return false; }

		if (typeof self.willStartAnalysis === 'function') { self.willStartAnalysis(); }

		var analyzed = null, errorCode = 0;
		if (typeof analyzeCard !== 'undefined') {

			analyzed = analyzeCard(points, 1);													//ここで実際の解析開始 gpCodeは、1　しか無いので、1を直接入力、不要ならあとで削除

			bothDetectBlock:{
				//motion判定-------------------------------------------------------------------------			
				if(_cardConf.motionDetectNum[0] > 0 || _cardConf.rotationDetect === 1 ) {												//motionDetectNum[0]:動作閾値判定=1、動作アナログ判定=2　0より大きければ⊿X,Y,角度を計算 20240826

					if(analyzed.id !== '') {
						if(self.idFirstAuth == false && self.idMotionAuth == false) {				//ID認識初期値格納
							self.authOriginPoints=[];
							self.authOriginPoints.push(analyzed);
							self.idFirstAuth = true;
							self.idMotionAuth = false; 
							//console.log("self.authOriginPoints= ",JSON.parse(JSON.stringify(self.authOriginPoints)),"timestamp=",self.authOriginPoints[0].timestamp);		//20240826

							analyzed.point = 0;

							//rotation判定開始-------------------------------------------------------------------------
							//タッチ向き(基準電極間の線分とX座標がなす角が仕様のそれから何度回転しているか)のradian to degree単位変換
							self.touchAngleDeg = self.authOriginPoints[0].angleRad * (180 / Math.PI);

							console.log("DP,Org,",analyzed.id,",touchAngleDeg=",self.touchAngleDeg.toFixed(2),",CentX= ",self.authOriginPoints[0].centroidX.toFixed(2),",CentY= ",self.authOriginPoints[0].centroidY.toFixed(2),",Ang= ",self.touchAngleDeg.toFixed(2),",Time= ",self.authOriginPoints[0].timestamp.toFixed(2));		//20250905

							rotationDetectBlock:{
								//rotation判定　rotationDetect > 0
								if(self.touchAngleDeg  < 0 + _cardConf.rotationThresholdAngle && self.touchAngleDeg  > 0 - _cardConf.rotationThresholdAngle ){
									//"10":カード正面が、手前向き　0°±15°
										self.rotatePoint = 10;
										break rotationDetectBlock; 
									} else if(self.touchAngleDeg  < 90 + _cardConf.rotationThresholdAngle && self.touchAngleDeg  > 90 - _cardConf.rotationThresholdAngle ){
									//"20":カード正面が、右向き　90°±15°
										self.rotatePoint = 20;
										break rotationDetectBlock; 
									} else if(self.touchAngleDeg  < -180 + _cardConf.rotationThresholdAngle && self.touchAngleDeg  > -180 - _cardConf.rotationThresholdAngle ){
									//"30":カード正面が、先方向き　-180°±15°
										self.rotatePoint = 30;
										break rotationDetectBlock; 
									} else if(self.touchAngleDeg  < -90 + _cardConf.rotationThresholdAngle && self.touchAngleDeg  > -90 - _cardConf.rotationThresholdAngle ){
									//"40":カード正面が、左向き　-90°±15°
										self.rotatePoint = 40;
										break rotationDetectBlock; 
									//タッチ方向判定NGの場合、判定Stop		20251104追加
									} else {
										break bothDetectBlock; 
									}
							}

							if(_cardConf.motionDetectNum[0] === 0) { 
								analyzed.point = self.rotatePoint;
								break bothDetectBlock;
							}
						
						}else if(self.idFirstAuth == true && self.idMotionAuth == false){			//ID認識動作後格納

							analyzed.point = 0;

							self.authMotionPoints=[];
							self.authMotionPoints.push(analyzed);
			
							//console.log("self.authMotionPoints= ",JSON.parse(JSON.stringify(self.authMotionPoints)),"timestamp=",self.authMotionPoints[0].timestamp);		//20240826
							
							//変化量計算＝電極の重心座標の移動距離(＝動作後－初期)を両方のgrid幅の平均で規格化、角度は、IDアナライズ時の回転角度差(＝動作後－初期)
							let deltaX = (self.authMotionPoints[0].centroidX - self.authOriginPoints[0].centroidX) / ((self.authMotionPoints[0].gridWidth + self.authOriginPoints[0].gridWidth) / 2),
								deltaY = (self.authMotionPoints[0].centroidY - self.authOriginPoints[0].centroidY) / ((self.authMotionPoints[0].gridHeight + self.authOriginPoints[0].gridHeight) / 2),
								deltaAngle = (self.authMotionPoints[0].angleRad - self.authOriginPoints[0].angleRad) * (180 / Math.PI);
					
							if(deltaAngle > 90 ) {													//ID認識座標変換の回転角を第1象限角度に規格化　20240826 
								deltaAngle = deltaAngle - 180 ;
							}else if(deltaAngle < -90) {
								deltaAngle = deltaAngle + 180 ;
							}
							
							console.log("DP,Mtn,",analyzed.id,",deltaAngle=",deltaAngle.toFixed(2),",CentX= ",self.authMotionPoints[0].centroidX.toFixed(2),",CentY= ",self.authMotionPoints[0].centroidY.toFixed(2),",Ang= ",(self.authMotionPoints[0].angleRad * (180 / Math.PI)).toFixed(2),",Time= ",self.authMotionPoints[0].timestamp.toFixed(2));		//20250905

							//console.log("deltaAngle_1",deltaAngle.toFixed(2));

							//console.log("deltaAngle_0*angleRadSign",deltaAngle*angleRadSign);

							//前回のアナログ値解析結果を格納
							self.lastMotionAnalogOut=self.motionAnalogOut;

							//変化量の閾値比率＝アナログ値を格納
							self.motionAnalogOut=[deltaX/_cardConf.motionThresholdGridX, deltaY/_cardConf.motionThresholdGridY, deltaAngle/_cardConf.motionThresholdAngle, (self.authMotionPoints[0].timestamp - self.authOriginPoints[0].timestamp)];

							//アナログ値の変化量＝前回-今回を格納
							self.deltaMoitonAnalogOut=[self.lastMotionAnalogOut[0]-self.motionAnalogOut[0],self.lastMotionAnalogOut[1]-self.motionAnalogOut[1],self.lastMotionAnalogOut[2]-self.motionAnalogOut[2],-1*(self.lastMotionAnalogOut[3]-self.motionAnalogOut[3])];
							
							//閾値判定ブロック			analyzed.pointとmotionDetectNum[]の要素番号を一致させる。コールバックのposition値とのズレ解消　20251110
							motionDitectBlock:{
								//閾値判定　motionDetectNum[n] > 0
								if(_cardConf.motionDetectNum[2] > 0 && self.motionAnalogOut[1] > 1 && Math.abs(self.motionAnalogOut[0]) < 1){		// && Math.abs(deltaAngle) < 20){
								//"2":画面下側へ3grid～20.1mm、横方向±1grid～13.4mm幅未満、		//回転±20°～atan2(2.5,3)～横18.1mm幅未満
									analyzed.point = 2;
									self.motionInit();
									break motionDitectBlock; 
								} else if (_cardConf.motionDetectNum[3] > 0 && self.motionAnalogOut[1] < -1 && Math.abs(self.motionAnalogOut[0]) < 1){		// && Math.abs(deltaAngle) < 20){
								//"3":画面上側へ3grid～20.1mm、横方向±1grid～13.4mm幅未満、		//回転±20°～atan2(2.5,3)～横18.1mm幅未満
									analyzed.point = 3;
									self.motionInit();
									break motionDitectBlock;
								} else if (_cardConf.motionDetectNum[4] > 0 && self.motionAnalogOut[0] > 1 && Math.abs(self.motionAnalogOut[1]) < 1){		// && Math.abs(deltaAngle) < 20){
								//"4":画面右側へ2grid～13.4mm、縦方向±1grid～13.4mm幅未満、		//回転±20°～atan2(2.5,3)～横18.1mm幅未満
									analyzed.point = 4;
									self.motionInit();
									break motionDitectBlock; 
								} else if (_cardConf.motionDetectNum[5] > 0 && self.motionAnalogOut[0] < -1 && Math.abs(self.motionAnalogOut[1]) < 1){		// && Math.abs(deltaAngle) < 20){
								//"5":画面左側へ2grid～13.4mm、縦方向±1grid～13.4mm幅未満、		//回転±20°～atan2(2.5,3)～横18.1mm幅未満
									analyzed.point = 5;
									self.motionInit();
									break motionDitectBlock; 
								} else if (_cardConf.motionDetectNum[6] > 0 && self.motionAnalogOut[2] > 1 && Math.abs(self.motionAnalogOut[1]) < 1 && Math.abs(self.motionAnalogOut[0]) < 1){
								//"6":反時計回り(左回り)に+20°～atan2(0.83,1)～5.6mm,6.7mm、縦方向±1grid～13.4mm幅未満、横方向±1grid～13.4mm幅未満、
									analyzed.point = 6;
									self.motionInit();
									break motionDitectBlock; 
								} else if (_cardConf.motionDetectNum[7] > 0 && self.motionAnalogOut[2] < -1 && Math.abs(self.motionAnalogOut[1]) < 1 && Math.abs(self.motionAnalogOut[0]) < 1){
								//"7":時計回り(右回り)に‐20°～atan2(0.83,1)～5.6mm,6.7mm、縦方向±1grid～13.4mm幅未満、横方向±1grid～13.4mm幅未満、
									analyzed.point = 7;
									self.motionInit();
									break motionDitectBlock; 
								}

								//アナログ判定　motionDetectNum[n] > 1
								if(_cardConf.motionDetectNum[0] > 1){
									if(_cardConf.motionDetectNum[2] > 1 && self.deltaMoitonAnalogOut[1] < 0.1 && self.motionAnalogOut[1] > 0.05 && Math.abs(self.motionAnalogOut[0]) < 1 && Math.abs(self.motionAnalogOut[2]) < 1){
									//"2":画面下側移動距離 >5%～1mm、⊿移動距離比 10%～4mm未満、横方向±1grid～13.4mm幅未満、回転±20°～atan2(2.5,3)～横18.1mm幅未満
										analyzed.point = 2;
										break motionDitectBlock;
									} else if (_cardConf.motionDetectNum[3] > 1 && self.deltaMoitonAnalogOut[1] > -0.1 && self.motionAnalogOut[1]  < -0.05 && Math.abs(self.motionAnalogOut[0]) < 1 && Math.abs(self.motionAnalogOut[2]) < 1){
									//"3":画面上側移動距離 <-5%～1mm、⊿移動距離比 10%～4mm未満、横方向±1grid～13.4mm幅未満、回転±20°～atan2(1.1,3)～横7.4mm幅未満
										analyzed.point = 3;
										break motionDitectBlock;
									} else if (_cardConf.motionDetectNum[4] > 1 && self.deltaMoitonAnalogOut[0] < 0.1 && self.motionAnalogOut[0] > 0.05 && Math.abs(self.motionAnalogOut[1]) < 1 && Math.abs(self.motionAnalogOut[2]) < 1){
									//"4":画面右側移動距離 >5%～0.7mm、⊿移動距離比 10%～2.7mm未満、縦方向±1grid～13.4mm幅未満、回転±20°～atan2(1.1,3)～横7.4mm幅未満
										analyzed.point = 4;
										break motionDitectBlock;
									} else if (_cardConf.motionDetectNum[5] > 1 && self.deltaMoitonAnalogOut[0] > -0.1 &&  self.motionAnalogOut[0] < -0.05 && Math.abs(self.motionAnalogOut[1]) < 1 && Math.abs(self.motionAnalogOut[2]) < 1){
									//"5":画面左側移動距離 <-5%～0.7mm、⊿移動距離比 10%～2.7mm未満、縦方向±1grid～13.4mm幅未満、回転±20°～atan2(1.1,3)～横7.4mm幅未満
										analyzed.point = 5;
										break motionDitectBlock;
									} else if (_cardConf.motionDetectNum[6] > 1 && self.deltaMoitonAnalogOut[2] < 0.1 && self.motionAnalogOut[2] > 0.05 && Math.abs(self.motionAnalogOut[0]) < 1 && Math.abs(self.motionAnalogOut[1]) < 1){
									//"6":反時計回り(左回り)角度比 >5%～1°～atan2(0.05,3)～横0.34mm、⊿角度比 10%～2°～atan2(0.11,3)～横7mm、縦方向±1grid～13.4mm幅未満、横方向±1grid～13.4mm幅未満
										analyzed.point = 6;
										break motionDitectBlock;
									} else if (_cardConf.motionDetectNum[7] > 1 && self.deltaMoitonAnalogOut[2] > -0.1 && self.motionAnalogOut[2] < -0.05 && Math.abs(self.motionAnalogOut[0]) < 1 && Math.abs(self.motionAnalogOut[1]) < 1){
									//"7":時計回り(右回り)角度比 <-5%～1°～atan2(0.05,3)～横0.34mm、⊿角度比 -10%～2°～atan2(0.11,3)～横7mm、縦方向±1grid～13.4mm幅未満、横方向±1grid～13.4mm幅未満
										analyzed.point = 7;
										break motionDitectBlock;
									}
								}
							}
						}
					}
					//motion判定ここまで-------------------------------------------------------------------------

				} else {																			//motion判定しない、かつrotation判定しない場合、ID認証のみの場合
					if(analyzed.id !== '') {
						analyzed.point = 1;
					} 
				}
			}
		} else {
			analyzed = {'id': '', 'point': null};
			errorCode = 3;
		}
		if (((analyzed.id !== '') && (analyzed.point !== null)) || (0 < errorCode)) {			//IDとpoint(=3点式の保持位置番号)が取得出来たか、エラーコード出た場合の処理
			if(analyzed.point > 1){																//analyzed.point>1の時は、タッチ方向判定、動作判定有りのため、rotatePointにanalyzed.pointを合成 20250917
				if(_cardConf.rotationDetect === 1 ){ 
					if(_cardConf.motionDetectNum[0] === 0){ 
						analyzed.point = self.rotatePoint;
					} else { 
						analyzed.point = analyzed.point + self.rotatePoint;
					}
				}			
				if(_cardConf.fixPosition){														//fixPosition=trueの時は、analyzed.idにanalyzed.pointを合成 20250917
					analyzed.id = analyzed.id + "-" + analyzed.point; 						
					analyzed.point = 1; 
				}
			}
			if(analyzed.point !== 0){															//analyzed.point=0の時は、動作判定途中の期間のため、クリアしない　20250917
				self.clearPointsCache();														//nowtouchPointsがクリアされる。
			}
			if (typeof self.callback === 'function') { self.pause = true; self.callback(analyzed, errorCode); } 
				else { console.log(analyzed); }
		} else {
			errorCode = 1;
			var errorId = null, msg = 'Unknown card';
			if ((analyzed.id !== '') && (analyzed.point === null)) {
				msg = 'Unknown touch position';
				errorId = '' + analyzed.id;
			}
			if (typeof self.onErrorAnalysed === 'function') { self.onErrorAnalysed(errorCode, msg, errorId); }
			/*else { console.log(msg); }*/
		}
	};



	/**
	 * タッチ座標の蓄積処理と条件に合致した場合は認証処理へ
	 */
	this.checkTouchPoints = function(points) {		
		try {

			if (points.length === self.pointNumMax) {											//かつ、タッチ座標が５点そろったら、analyzeを実行
				self.analyze(self.deepCopy(points));
			}
		} catch (exception) {
			console.log(exception);
		}
	};

	/**
	 * 現在タッチ開始座標を保持
	 */
	this.addPoints = function (e) {
		try {
			var	timestamp = e.timeStamp,								////20240805 タッチイベントの発生時刻を取得  
				len = e.touches.length,
				type = e.type;

			for (var i = 0; i < len; i++) {
				var toucheId =  e.touches[i].identifier, 
					x =  e.touches[i].clientX,							// - rect.left, 
					y =  e.touches[i].clientY,							// - rect.top, 
					no = i,												//self.countPoints(), 
					p = {
						'inputX': x, 
						'inputY': y, 
						'id': toucheId, 
						'no': no,
						'timestamp':timestamp,
						'type': type
					};
				self.nowtouchPoints[toucheId] = self.deepCopy(p);
			}

			//console.log("add: ", self.nowtouchPoints);		//20251225

		} catch (exception) {
			console.log(exception);
		}
		return self.getPoints();
	};

	/**
	 * 現在タッチ中の座標を保持
	 */
	this.updatePoints = function(e) {
		try {
			var	timestamp = e.timeStamp,								////20240805 タッチイベントの発生時刻を取得  
				len = e.touches.length,
				type = e.type;

			for (var i = 0; i < len; i++) {
				var toucheId =  e.touches[i].identifier, 
					x =  e.touches[i].clientX,							// - rect.left, 
					y =  e.touches[i].clientY,							// - rect.top, 
					no = i,												//self.countPoints(), 
					p = {
						'inputX': x, 
						'inputY': y, 
						'id': toucheId, 
						'no': no,
						'timestamp':timestamp,
						'type': type
					};
				self.nowtouchPoints[toucheId] = self.deepCopy(p);
			}

			//console.log("upd: ", self.nowtouchPoints);		//20251225
			
		} catch (exception) {
			console.log(exception);
		}
		return self.getPoints();
	};

	/**
	 * 離れた指の座標を削除
	 */
	/*
	this.deletePoints = function(e) {
		try {
			var	len = e.touches.length;
			for (var i = 0; i < len; i++) { 
				delete self.nowtouchPoints[e.touches[i].identifier];	//touches[i].identifier]; 
			}

			console.log("del: ", self.nowtouchPoints);		//20251225
			console.log("length= ", Object.keys(self.nowtouchPoints).length);		//20251225

		} catch (exception) {
			console.log(exception);
		}
	};
	*/
	this.deletePoints = function(e) {						//20251226 離れた指のタッチ情報が残ってしまう対策、一旦self.nowtouchPointsをクリアして再度全タッチ情報をAddする

		self.nowtouchPoints = {};

		try {
			var	timestamp = e.timeStamp,								////20240805 タッチイベントの発生時刻を取得  
				len = e.touches.length,
				type = e.type;

			for (var i = 0; i < len; i++) {
				var toucheId =  e.touches[i].identifier, 
					x =  e.touches[i].clientX,							// - rect.left, 
					y =  e.touches[i].clientY,							// - rect.top, 
					no = i,												//self.countPoints(), 
					p = {
						'inputX': x, 
						'inputY': y, 
						'id': toucheId, 
						'no': no,
						'timestamp':timestamp,
						'type': type
					};
				self.nowtouchPoints[toucheId] = self.deepCopy(p);
			}

			//console.log("del: ", self.nowtouchPoints);		//20251226
			
		} catch (exception) {
			console.log(exception);
		}
		return self.getPoints();
	};

	/**
	 * 現在の同時タッチ数
	 */
	this.countPoints = function() {
		return Object.keys(self.nowtouchPoints).length;
	};

	/**
	 * 保持しているタッチ座標をIDがキーのハッシュから配列に変換して返す
	 */
	this.getPoints = function() {
		var tp = [];
		try {
			Object.keys(self.nowtouchPoints).forEach(function(key) { tp.push(self.deepCopy(self.nowtouchPoints[key])); });

			//console.log("get: ", self.nowtouchPoints);		//20251225

		} catch (exception) {
			console.log(exception);
		}
		    //------------- 20260127 タッチ座標解析
            if(typeof touchAnalysisEnable=== "undefined"){touchAnalysisEnable=false;}								//touchAnalysisEnable未定義HTML対応
            if(touchAnalysisEnable && tp.length < self.pointNumMax){ 
                for (let ix4=0; ix4 < tp.length; ix4++) {
                    touchDataArry.push([ix4,0,0,0,0,0,0,0,tp[ix4].inputX,tp[ix4].inputY,0,0,0,0,tp[ix4].timestamp,tp[ix4].type,tp[ix4].no,tp[ix4].id,tp.length]);
                }
            }
            //-------------
		return tp;
	};

	/**
	 * タッチ開始
	 */
	this.startListner = function(e) {
		self.onTouch = true;
		var points = self.addPoints(e);
		if (self.clearTimeOut !== null) { clearTimeout(self.clearTimeOut); }
			if (self.enableScrollAction) {
				if (points.length < 2) {
					e.stopPropagation();
					return true;
				}
			}
			e.stopPropagation();
			if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }
			self.checkTouchPoints(points);
		if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }
	};

	/**
	 * ドラッグ操作
	 */
	this.moveListner = function(e) {
		self.onTouch = true;
		var points = self.updatePoints(e);
		if (self.clearTimeOut !== null) { clearTimeout(self.clearTimeOut); }
			if (self.enableScrollAction) {
				if (points.length < 2) {
					e.stopPropagation();
					return true;
				}
			}
			e.stopPropagation();
			if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }
			self.checkTouchPoints(points);

		if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }
	};

	/**
	 * タッチ終了
	 */
	this.endListner = function(e) {
		if (self.clearTimeOut !== null) { clearTimeout(self.clearTimeOut); }
		self.deletePoints(e);
		var length = self.countPoints();
		self.onTouch = (0 < length);
		if (self.enableScrollAction) {
			if (length < 2) {
				e.stopPropagation();
				self.clearTimeOut = setTimeout(function() {
					self.onTouch = (0 < self.countPoints());
					self.clearPointsCache();
				}, self.touchedClearInterval);
				return true;
			}
		}
		e.stopPropagation();
		if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }

		/* タッチイベント終了後一定時間経過したら蓄積している座標を初期化 */
		self.clearTimeOut = setTimeout(function() {
			self.onTouch = (0 < self.countPoints());
			self.clearPointsCache();
		}, self.touchedClearInterval);
		return false;
	};

	/**
	 * タッチキャンセル
	 */
	this.cancelListner = function(e) {
		if ((typeof e.cancelable !== 'boolean') || e.cancelable) { e.preventDefault(); }
		self.clearTimeOut = setTimeout(function() {
			self.onTouch = (0 < self.countPoints());
			self.clearPointsCache();
		}, self.touchedClearInterval);
		console.log("cancelListner self.touchedClearInterval= ",self.touchedClearInterval);				////20240808
	};

	/**
	 * ズームキャンセル(iOS用、androidはHTMLタグ側で制御)
	 */
	this.zoomCancel = function(e) {
		if (!self.enableZoomAction) {
			if ((typeof e.cancelable !== 'boolean') || e.cancelable) {
				e.preventDefault();
			}
			return false;
		}
		console.log("zoomCancel self.enableZoomAction= ",self.enableZoomAction);						////20240808
	};

	/**
	 * 押印を受け付ける要素の追加
	 */
	this.addTouchElement = function(elementId) {
		var elem = null;
		try {
			elem = document.createElement('div'); elem.setAttribute('id', elementId);
			elem.setAttribute('style', 'bottom: 0; height: 100%; margin: 0; padding: 0; position: fixed; top: 0; width: 100%; z-index: 1000;');
			document.body.appendChild(elem);
		} catch (exception) {
			console.log(exception);
			elem = null;
		}
		return elem;
	};


	/**
	 * 受付開始
	 */
	this.start = function(element) {
		if ((element === undefined) || !element) { element = document; }
		try {
			if (window.ontouchstart !== undefined) {
				var elem = (typeof element === 'string') ? document.getElementById(element) : element;
				if (elem === null) { elem = self.addTouchElement(element); }
				self.targetElement = elem;
				if (elem) {
					self.init();
					if (elem !== document) {
						elem.style.pointerEvents = 'auto';
					}
					if (self.passive) {
						elem.addEventListener('touchstart', self.startListner, {passive: false, capture: false});  elem.addEventListener('touchmove', self.moveListner, {passive: false, capture: false});
						elem.addEventListener('touchend', self.endListner, {passive: false, capture: false});  elem.addEventListener('touchcancel', self.cancelListner, {passive: false, capture: false});
						if ('ongesturestart' in window) {
							document.addEventListener('gesturestart', self.zoomCancel, {passive: false, capture: false});  document.addEventListener('gesturechange', self.zoomCancel, {passive: false, capture: false});  document.addEventListener('gestureend', self.zoomCancel, {passive: false, capture: false});
						}
					} else {
						elem.addEventListener('touchstart', self.startListner, false);  elem.addEventListener('touchmove', self.moveListner, false);
						elem.addEventListener('touchend', self.endListner, false);  elem.addEventListener('touchcancel', self.cancelListner, false);
						if ('ongesturestart' in window) {
							document.addEventListener('gesturestart', self.zoomCancel, false);  document.addEventListener('gesturechange', self.zoomCancel, false);  document.addEventListener('gestureend', self.zoomCancel, false);
						}
					}
				}
				console.log("start ",element);				////20240806
			}
		} catch (exception) {
			console.log(exception);
			return false;
		}
		return true;
	};


	/**
	 * 受付終了
	 */
	this.stop = function(element) {
		try {
			if ((element === undefined) || !element) { element = self.targetElement; }
			var elem = (typeof element === 'string') ? document.getElementById(element) : element;
			if (elem) {
				if (self.passive) {
					elem.removeEventListener('touchstart', self.startListner, {passive: false, capture: false});  elem.removeEventListener('touchmove', self.moveListner, {passive: false, capture: false});
					elem.removeEventListener('touchend', self.endListner, {passive: false, capture: false});  elem.removeEventListener('touchcancel', self.cancelListner, {passive: false, capture: false});
					if ('ongesturestart' in window) {
						document.removeEventListener('gesturestart', self.zoomCancel, {passive: false, capture: false});  document.removeEventListener('gesturechange', self.zoomCancel, {passive: false, capture: false});  document.removeEventListener('gestureend', self.zoomCancel, {passive: false, capture: false});
					}
				} else {
					elem.removeEventListener('touchstart', self.startListner, false);  elem.removeEventListener('touchmove', self.moveListner, false);
					elem.removeEventListener('touchend', self.endListner, false);  elem.removeEventListener('touchcancel', self.cancelListner, false);
					if ('ongesturestart' in window) {
						document.removeEventListener('gesturestart', self.zoomCancel, false);  document.removeEventListener('gesturechange', self.zoomCancel, false);  document.removeEventListener('gestureend', self.zoomCancel, false);
					}
				}
				if (elem !== document) {
					elem.style.pointerEvents = 'none';
				}
				console.log("stop ",element);				////20240806
			}
		} catch (exception) {
			console.log(exception);
		}
	};


	/**
	 * 受付再設定
	 */
	this.reset = function(element) {
		if (element === undefined) { element = self.targetElement; }
		self.stop(element); self.start(element);
		console.log("reset ",element);				////20240806
	};
};
