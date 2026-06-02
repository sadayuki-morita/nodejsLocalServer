/**
 * カード解析
 * Rev.2.0.0	20240927
 * 		ID1,S1,T4のIDを_cardConfのパラメータで切り換えて、共用化出来るようにした。
 * 		また、ID認証、動作閾値判定、動作疑似アナログ判定を可能化したアナライザに対応し、HTML側で動作判定の有無を変更可能化したもの。
 * Rev.2.1.0	20250305
 * 		IDパターンのタッチ向きに対応して処理を変えるrotation判定に対応。
 * Rev.3.0.1	20250630
 * 		4電極ID系列 U3-XXX に対応。
 * Rev.3.0.2	20251027
 * 		Base64のencode,decodeで使用のescape,unescapeの非推奨化のためfunction修正
 * Rev.3.0.3	20260123
 * 		タッチ座標解析用データ取得のためのfunction修正（非解析用HTMLでも使用可能）
 *      動作判定用重心座標算出バグ修正
 * Rev.3.0.4	20260127
 * 		SDK用アナライザとの共用化対応。タッチ座標解析データの5点以下のデータ取得とコンソール出力有無判定追加
*/

var Base64 = {
    
        encode: function (str) {
            // 文字列 → UTF-8バイト列 → バイナリ文字列 → Base64文字列
            const bytes = new TextEncoder().encode(str);
            let binary = '';
            bytes.forEach(b => binary += String.fromCharCode(b));
            return btoa(binary);
        },

        decode: function (b64str) {
            // Base64 → バイナリ文字列 → バイト列 → UTF-8文字列
            const binary = atob(b64str);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }
    },

    Point=function(no, point) {
        this.no=no;
        this.inputX=point.inputX;
        this.inputY=point.inputY;
        this.totalLength=0;
        this.baseX=0;
        this.baseY=0;
        this.rotateX=0;
        this.rotateY=0;
        this.angleRad=0;
        this.distance=0;
        this.timestamp=point.timestamp;
        this.type=point.type;
        this.centroidX=0;
        this.centroidY=0;

        this.gridX=point.gridX;       //20260120
        this.gridY=point.gridY;       //20260120
        this.identifier=point.id;       //20260123
    },

    cardConfMap={},

    convertConf=function(confData) {           		//cs1.js CONFV8 の decode後の文字列の変換 S1-227:(14,10):(8,8):(2,6):(8,0):(0,0):1

        console.log("_cardConf= ",_cardConf);


        let result={};
        if (Array.isArray(confData)) {
            for (let ix1=0; ix1 < confData.length; ix1++) {
                try {
                    let row=Base64.decode(confData[ix1]),
                        cols=row.split(':');
//                    if (cols.length !== 7) continue;
                    if (cols.length !== _cardConf.dnCount + 2) continue;                                        //20250409 ID系列電極数のパラメータdnCountで制御
                    let cardId=cols[0],
                        points=[],
//                        group=cols[6], 				//ver8のグループ番号、T4 ID体系に無いパラメータ、"1"しか使わない
                        group=cols[_cardConf.dnCount + 1], 				//20250409 ID系列電極数のパラメータdnCountで制御        //ver8のグループ番号、T4 ID体系に無いパラメータ、"1"しか使わない
                        backSide=false;				//基準電極の向きの変数、適正な面でカードをタッチした時(Yミラー反転後Grid座標で基準電極のベクトルがX軸に対して-45°)が "false",裏面でタッチした時(45°)が"true"

                        if(_cardConf.cardIdNum.length == 0 || _cardConf.cardIdNum.includes(cardId)){            //20240826

//                            for (let ix2=1; ix2 < 6; ix2++) {
                            for (let ix2=1; ix2 < _cardConf.dnCount + 1; ix2++) {                               //20250409 ID系列電極数のパラメータdnCountで制御
                                let pointXY=cols[ix2].replace(/\(|\)|\s/g, '').split(','), 		                //ASCIIのIDのGrid座標からカッコ()を取り除き、x,Yに分離してpointXY配列に入れる
                                    pointX=parseInt(pointXY[0], 10),
                                    pointY=_cardConf.yGridMax - parseInt(pointXY[1], 10);						//Y座標は、YGrid座標最大値Y=14を"0"にしてミラー反転：スマホの座標系は、左手座標系(Y方向は上が"0"で下に向かって数が増える)、Grid側のY座標をミラーして合わせる）
                                    points.push([pointX, pointY]);
                            }
                            if (result[group] === undefined) { result[group]={}; }
                            var backSideKey=String(backSide);
                            if (result[group][backSideKey] === undefined) { result[group][backSideKey]={}; }
                            result[group][backSideKey][cardId]={
                                'id': cardId,                                                                   //Card ID-No 例：T4-XXX
                                'group': group,                                                                 //3点式C-Card Ver8 のグループNo. "1"しか使用していない。他のID系列は、仕様上無い。常に"1" 
                                'backSide': backSide,                                                           //裏表判定変数、Boolean　基準電極間配線とX軸のなす角が45°の時に true 
                                'points': points    //,                                                         //各種座標格納オブジェクト
                            };
                        }
                    //}

                } catch(e) {
                    console.log('ConvertError / index=' + ix1 + ', err=' + e);
                }
            }
        }
        console.log('result ', result);
        return result;
    };
/**
 * カード解析処理
 */
var analyzeCard=function(inputPoints, group) {
    if (group === undefined) { group=1; }

        var points=[],
            card={};

        if (Array.isArray(inputPoints)) {
            for (let ix1=0, len=inputPoints.length; ix1 < len; ix1++) {
                let point=new Point(ix1, inputPoints[ix1]);
                points.push(point);
            }
        }

        let plength=points.length,
            totalX=0,
            totalY=0;
        for (var ix1=0; ix1 < plength ; ix1++) {									//motion-ditect用data取得 検知電極の重心座標の算出 20260122 ループ回数バグ修正
            totalX += points[ix1].inputX;
            totalY += points[ix1].inputY;
        }
        centroidX=totalX/plength;
        centroidY=totalY/plength;

         let maxLength = 0,
            maxPointNo1 = -1,
            maxPointNo2 = -1;
        for (var ix1=0; ix1 < plength - 1; ix1++) {									//2電極間の距離を計算して最も長くなる電極番号1,2と長さを取得する
            for (var ix2=ix1 + 1; ix2 < plength; ix2++) {
                var lengthX=points[ix1].inputX - points[ix2].inputX,
                    lengthY=points[ix1].inputY - points[ix2].inputY;
                length=Math.hypot(lengthX, lengthY);                                //Math.hypot() 関数は、各引数の二乗の合計値の平方根。
                if (length > maxLength) {
                    maxLength = length;
                    maxPointNo1 = ix1;
                    maxPointNo2 = ix2;
                }
            }
        }

        var cardId='',
            patternMatch=false,
            basePointNo1=null,
            basePointNo2=null,
            gridWidth=0,
            gridHeight=0,
            originX=0,
            originY=0,
            baseRad=0,
            targetRad=parseFloat(_cardConf.targetRad),                              //Math.atan2(-10, 14),	:Yミラー反転した後のGrid座標の基準電極座標(0,12),(14,2)の線分とX軸とのなす角 S1 atan2= -0.6202494859828215 , T4 atan2= -0.7853981633974483 , U3 atan2= -0.3217505543966422
            rotateRad=0,
            keypadPointNo=null;

        var backSide=false;

        let cardInfos=cardConfMap[group][backSide];

        try {

            for (var pattern=0; pattern < 2; pattern++) {                           //0：電極2が原点側基準電極で基準電極間配線がX軸とのなす角が135°、1：電極1が原点側基準電極で基準電極間配線がX軸とのなす角が135°、2：電極2が原点側基準電極で基準電極間配線がX軸とのなす角が45°、3：電極1が原点側基準電極で基準電極間配線がX軸とのなす角が45° 

                if (pattern % 2) {                                                  //patternが、奇数(=2で割り切れなくて()内の解が1なのでtrue) の時、電極1を基準電極1（原点側）にする
                    basePointNo1=points[maxPointNo1].no;
                    basePointNo2=points[maxPointNo2].no;
                } else {                                                            //patternが、偶数(=2で割り切れて()内の解が0なのでfalse) の時、電極2を基準電極1（原点側）にする
                    basePointNo1=points[maxPointNo2].no;
                    basePointNo2=points[maxPointNo1].no;
                }
                originX=points[basePointNo1].inputX;
                originY=points[basePointNo1].inputY;

                for (var ix2=0; ix2 < plength; ix2++) {
                    points[ix2].baseX=points[ix2].inputX - originX;		            //基準電極1=basePointNo1を原点にした座標に移動するフロー 
                    points[ix2].baseY=points[ix2].inputY - originY;
                }

                baseRad=Math.atan2(points[basePointNo2].baseY, points[basePointNo2].baseX);		                                        //基準電極2=basePointNo2とX軸とのなす角を計算 
                rotateRad=targetRad - baseRad;													                                        //上記角度とGrid座標の基準電極2とX軸とのなす角の期待値との差=座標変換回転角

                for (var ix2=0; ix2 < plength; ix2++) {									                                                //基準電極1を中心に各電極座標を回転するフロー
                    points[ix2].rotateX=points[ix2].baseX * Math.cos(rotateRad) - points[ix2].baseY * Math.sin(rotateRad);
                    points[ix2].rotateY=points[ix2].baseY * Math.cos(rotateRad) + points[ix2].baseX * Math.sin(rotateRad);
                }

                gridWidth=Math.abs((points[basePointNo2].rotateX - points[basePointNo1].rotateX) / _cardConf.xbasisGridDistance);		//1XGridのスマホX座標幅
                gridHeight=Math.abs((points[basePointNo2].rotateY - points[basePointNo1].rotateY) / _cardConf.ybasisGridDistance);		//1YGridのスマホY座標幅

                for (let ix2=0; ix2 < plength; ix2++) {
                    points[ix2].gridX=points[ix2].rotateX / gridWidth + _cardConf.x1basisGridCoordinate + 0.5;                          //回転後Y座標をYGrid幅でGrid座標系変換する
                    points[ix2].gridY=points[ix2].rotateY / gridHeight + _cardConf.y1basisGridCoordinate + 0.5;                         //回転後X座標をXGrid幅でGrid座標系変換する                }
                }

                let otherIdPointNos=[];                                             //基準電極のポイント番号を除いた配列化するフロー。
                for (let ix2=0; ix2 < plength; ix2++) {
                    if (ix2 == basePointNo1 || ix2 === basePointNo2) continue;
                    otherIdPointNos.push(ix2);
                }
                
                let oplength=otherIdPointNos.length;

                for (let key in cardInfos) {

                    let confPoints=(cardInfos[key]['points'] !== undefined) ? cardInfos[key]['points'] : [],
                        cplength=confPoints.length,
                        matchPointNos=[];

                    for (let ix3=0; ix3 < oplength; ix3++) {
                        if (otherIdPointNos[ix3] in matchPointNos == !![]) continue;
                        let gridX=points[otherIdPointNos[ix3]].gridX,
                            gridY=points[otherIdPointNos[ix3]].gridY,
                            matchFlag=false;
                        for (let ix2=0; ix2 < cplength; ix2++) {
                            let confPointX=confPoints[ix2][0] + 0.5,
                                confPointY=confPoints[ix2][1] + 0.5,
                                distance=Math.hypot(gridX - confPointX, gridY - confPointY);                                    
                        if (distance <= _cardConf.accuracy) {
                                matchFlag=true;
                                matchPointNos[ix3]=otherIdPointNos[ix3];
                                break;
                            }
                        }
                        if (!matchFlag) break;
                    }
                                        
                    if (matchPointNos.length == oplength) {
                        let matchPointFlag=true;
                        for (let ix3=0; ix3 < oplength; ix3++) {
                            if (ix3 in matchPointNos == !![]) {} else matchPointFlag=false;
                        }
                        if (matchPointFlag == true) {
                            cardId=cardInfos[key]['id'];
                            if (cardId) {
                                patternMatch=true;
                                break;
                            }
                        }
                    }
                }
                patternMatch && (matchFlag=true);       //,
                if (patternMatch) {
                    break;
                }
    
            }

            card.id=cardId;
            card.point=keypadPointNo //'start';    //keypadPointNo;
            card.points=points;
            card.angleRad=rotateRad;
            card.centroidX=centroidX;
            card.centroidY=centroidY;
            if(_cardConf.dnCount = 4){
                card.timestamp=Math.max(points[0].timestamp,points[1].timestamp,points[1].timestamp,points[2].timestamp,points[3].timestamp);
            } else {
                card.timestamp=Math.max(points[0].timestamp,points[1].timestamp,points[1].timestamp,points[2].timestamp,points[3].timestamp,points[4].timestamp);
            }
            card.type=points[0].type;
            card.gridHeight=gridHeight;
            card.gridWidth=gridWidth;
            card.baseAngle=baseRad;

		    //------------- 20260121 タッチ座標解析
            if(typeof touchAnalysisEnable=== "undefined"){touchAnalysisEnable=false;}								//touchAnalysisEnable未定義HTML対応

            if(touchAnalysisEnable){ 
                for (let ix4=0; ix4 < points.length; ix4++) {
                    touchDataArry.push([ix4,cardId,rotateRad,baseRad,centroidX,centroidY,gridHeight,gridWidth,points[ix4].inputX,points[ix4].inputY,points[ix4].gridX,points[ix4].gridY,points[ix4].rotateX,points[ix4].rotateY,points[ix4].timestamp,points[ix4].type,points[ix4].no,points[ix4].identifier,points.length]);
                }
            }
            //-------------

        } catch(e) {
            console.log(e);
        }
        //console.log("card",card);

    return card;
};
console.log('警告\n本スクリプトの解析及びアルゴリズムの再利用をする事は原則禁止とさせて頂きます。');
