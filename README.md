# nodejsLocalServer

- ローカルサーバー、Node.jsで動作。（Xamppは、立上げ不要）
- スマホ、認証結果等をファイルに落とし、ローカルサーバーにアップロードして情報を取得する
- /Recognition_rate_LSC をhttps://multi-touchcard.com/ のサーバーに格納して、そのURL上で認証評価実施すると、評価結果をサーバーアップロードせずに、スマホのDownloadホルダに格納する。 


## ディレクトリ構造

    nodejsLocalServer  
      - /node_modules  :Git管理しない。  
      - /public     :LocalServerの公開アクセスポイント、ここに置いたものがアクセス可能。  
          - /coordinate     :スマホ情報取得ページ、画面情報、タッチ座標情報を取得し、LocalServerにアップロードする  
              - index.html  ：実行ページ  
              - script-draw-circle.js   :タッチ情報取得＋アップロードscript  
              - script-user-info.js   :スマホ画面情報取得＋アップロードscript  
              - style.css  
          - /Recognition_rate_LSC   :タッチ方向動作判定ID認証アナライザの認識率評価ページ  
              - /docs   :ドキュメント格納  Git管理しない。  
              - /css  
              - /script ：ID認証アナライザ、IDコードリストのソース、card1-ID1S1T4U3-rm-dbgでデバッグ完成したアナライザソースファイルをこの直下に置く。  
                          ここでアナライザを修正しないこと。  
                - /c : IDコードリスト   
              - index.html  :認識率評価用HTML  
              - confv8_all_gen.html   :IDコードリスト確認用ページ
      - /uploads：測定データアップロード先ディレクトリ、ここの下にファイルがアップロードされる。Git管理しない。  
      - dataSave.js  :LocalServer、データアップロード制御script  
      - package-lock.json  
      - package.json  
      - .gitignore  
      - README.md  


## Recogintion_rate_LSC

- カード型C-cardの5電極IDのID1系列、S1系列、T4系列、U1、U3系列、の全てを同一ページでID認識率が評価出来るようにしたページ。
- さらに、ID認証、タッチ方向判定、動作判定を組み合わせて全ての判定モードが評価可能。
- 初期ページの入力欄に必要な測定パラメータ入力して、C-Cardを10回タッチすると、C-StampのLogger.jsと同等のlog結果をCSVファイルを"サーバー”にアップロード保存する。 
- タッチ座標解析用データ取得のため、タッチ座標とグリッド変換座標、変換パラメータも別のCSVファイルにし、合わせてアップロードする。
- 認識率のみの評価でタッチ座標データ保存しない場合、このtouchAnalysisEnable変数の値を"false"に変更する。
  ```
    //----------    20260121 タッチ座標解析
    var touchAnalysisEnable= true,  //タッチ座標解析用データ取得フラグ：取得する＝true（巨大な座標データのCSVファイルがアップロードされる）、取得しない＝false
        touchDataArry =[];          //20260121 touchID毎の座標を格納する配列 
    //----------
  ```
- アナライザソースファイルは、デモ用、SDK用等とすべて同じものを使用する。アナライザ修正時には、/card1-ID1S1T4U3-rm-dbg のリポジトリでデバッグし、OKとなったファイルをデモ用、SDK用、この認識率評価用として夫々にコピペする。


  ### 使い方

  1. サーバー  
    + ローカルサーバー
      -  dataSave.jsのあるディレクトリの下でターミナルを開き(Open Git Bash Here等)、  
          `$ node dataSave.js`  
        と入力してローカルサーバーを立ち上げる。（portは、5000）  
        - 小平事務所PCの場合：`C:\xampp\htdocs\dev\test\nodejsLocalServer`  
        - 小平事務所Linuxの場合：`/home/morita/Documents/dev/nodejsLocalServer`  
      - ブラウザに表示させるhtmlは、'public'ディレクトリの下に設ける（ディレクトリで階層作ることは問題なし）
      - スマホのブラウザで、以下にアクセスする。Wi‐Fiの接続先に合わせてIPを変える。
        - 小平事務所PCの場合：'http://192.168.40.55:5000/Recognition_rate_LSC/' 
        - 小平事務所Linuxの場合：'http://192.168.40.168:5000/Recognition_rate_LSC/'
      - アクセスすると、"Recognition_rate_New"と同じ仕様の認識率評価ページが表示される。
      - ローカルサーバーは、アクセスポイント、portが異なれば、同時に立上げ可能。logger.jsのC-Stamp2認識率評価と同時に実行可能。

    + multi-touchcard.com サーバー
      - https://multi-touchcard.com/Recgnition_rate_LSC/ にスマホからアクセスしてローカルサーバーの場合と同様に評価測定を実施する。
      - 評価結果データファイル、タッチ座標解析結果ファイル共にローカルサーバーではなく、評価スマートフォンのDownloadホルダに格納される。
      - データ形式、ファイル名は、ローカルサーバーでの評価と同一。評価後にPCと接続してファイルをPCにカット・アンド・ペーストして同様にデータ集計可能。

  2. スマホ ブラウザ認識率評価ページ  
    - 読み込み時にプロンプトのポップアップ入力画面で、"ID系列、タッチ方向(r)と動作(m)判定の有無を'-'で区切って入力。"  
    と入力表示されるので、以下のID系列のいずれかを入力  
      - 評価可能ID系列："ID1"、"S1"、"T4"、"U3"、"U1"  
    - ID系列の後に判定モードをID系列の後に追記する（デフォルトは、"S1-r-m"）。  
      - ID認証のみの場合：追記なし  
      - タッチ方向判定有り場合："-r"  
      - 動作判定有りの場合："-m"  
      - タッチ方向判定×動作判定有りの場合："-r-m"  
    - モーダル画面のOKをクリックすると条件入力画面が表示される。  
    - スマホ機種、Check対象ID番号(-position番号)、評価者、評価環境を入力。  
      - タッチ方向判定position番号  
           "10":スタンド正面が、手前向き　0°  
           "20":スタンド正面が、右向き　90°  
           "30":スタンド正面が、先方向き　-180°  
           "40":スタンド正面が、左向き　-90°  
      - 動作判定position番号  
           "2":画面下側へ移動  
           "3":画面上側へ  
           "4":画面右側へ  
           "5":画面左側へ  
           "6":反時計回り(左回り)  
           "7":時計回り(右回り)  
      - タッチ方向×動作判定position番号  
           両方のposition番号を足し算した値、  
         ＊動作方向はタッチ方向に影響されず独立。  
    - 条件入力後、[Enter]をタッチ。ファイル名が表示されるので確認して、OKなら[Test Count Start]をタッチして、試験開始。
    - カードタッチすると、結果が画面に表示される。１回タッチしたら、[カウントボタン]を１回タッチ。
         ＊ID変換出来ない場合、全ての電極が検知出来ない場合は、[カウントボタン]が赤色になるのみで結果表示されないので、適切な動作後、結果表示されない場合は、[カウントボタン]を１回タッチする。タッチ後に、エラー結果が表示される。
    - 10回カードタッチ、カウントボタンをタッチすると、自動的にファイルが/uploadの下に保存される。その後ページがリロードされるので、測定パラメータを入れ直して再度試験する。

  3. 評価結果データファイル格納
    - PCのホルダ C:\xampp\htdocs\dev\test\nodejsLocalServer\uploads の下に、"Recognition_rate_New"と同じ仕様の認識率評価結果CSVファイルが保存される。
    - ページの入力が同一で、同じファイル名になる場合、無条件に上書きされて後からアップロードしたデータが残る。

  4. 評価結果ファイルの集計
    - PCのホルダ C:\xampp\htdocs\dev\test\nodejsLocalServer\public\Recognition_rate_LS\excel,QR の下にある"Recognition_rate_LS_log集計_20241212.xlsm"で集計する。
    - "評価ファイル入力"シートのホルダ名(フルパス)入力欄に"C:\xampp\htdocs\dev\test\nodejsLocalServer\uploads"、拡張子入力欄に"csv"と入力しマクロ実行
    - 上記ホルダの下にある評価結果.csvが全て、log集計シートにコピペされるので、全てを選択してpvot_tableを作り解析する。
    - 行のフォーマットは、C-Stamp2 Logger.jsの結果集計リスト DetailResult_XXXXXX.csv と比較できる様に合わせてある。
    - 評価結果.csvのデータ仕様：  
        maker, phone, expextCardIdNum, environment, person, count, expextCardIdNum, reCardId, passFlg, wrong_c, wrong_t,  
        メーカー(現状空欄), スマホ機種名, Check対象ID番号, 評価環境(手持ち、机上等), 評価者, タッチ回数, ID期待値, 認識ID, OK-flg, 誤認-flg, 未使用,   

        error_c, error_t, failFlg, animation, fileNameStr, fileindex, userAgent, timestamp  
        ID変換不可-flg, 未使用, 5電極検知NG-flg, 未使用, ファイル名, ファイルインデックス(通常1), ユーザーエージェント, 押印時間  

  5. タッチ座標解析結果ファイルの集計
    - PCのホルダ C:\xampp\htdocs\dev\test\nodejsLocalServer\public\Recognition_rate_LSC\excel,QR の下にある"タッチ座標変換誤差解析_20260123.xlsx"で集計する。
    - 上記ファイルを開いて"log"シートに、測定後uploadsホルダに出来るcdr_で始まるタッチ座標解析用データ格納ファイル.csvを全てコピペする。
    - ペーストすると自動的に認識率解析で行った10回のタッチ評価毎に、グラフ化し統計データを取得する。1回の押印に対しlog数<21回までは、正常に集計可能。21行/1回認証以上あるログは、必要な行数をシートに追加する。スピル表示だ消えて自動的に再計算してくれる。

    - 評価結果.csvのデータ仕様：
      - ix4,cardId,rotateRad,baseRad,centroidX,centroidY,gridHeight,gridWidth,points[ix4].inputX,points[ix4].inputY,points[ix4].gridX,points[ix4].gridY,points[ix4].rotateX,points[ix4].rotateY,points[ix4].timestamp,points[ix4].type,points[ix4].no,points[ix4].identifier,points.length


## coordinate

- スマホ情報および画面情報、タッチ座標情報をそれぞれ取得し、LocalServerにアップロードする  
- スマホ情報および画面情報
  - ページを開いた時画面に表示されている情報を画面右上赤のボタンを押した時にだけ/uploadの下にアップロードされる。
  - ファイルのデータ形式はjson

- タッチ座標情報
  - 画面タッチして、イベントリスナーが更新される毎に座標データ、タイムスタンプ等を格納。
  - 画面にタッチ位置を画面座標×1/2の位置に青円で表示する。
  - 画面右下青のボタンを押した時にだけそれまでのタッチ座標データを/uploadの下にアップロードし、タッチ座標データをクリアする。
  - ファイルのデータ形式はcsv


## アナライザバージョン

- analyzerm-s1t4u3-ob.js  Rev.3.2.6 20260529
- cardrm-s1t4u3-ob.js  Rev.3.0.4 20260204
- ctrlmr.js Rev.3.2.1 20260204
                  
## 来歴

- 作成　20241127
- Rev.1　20250423

- アナライザファイルセット修正更新  20251003
- アナライザファイルセット修正更新  20251110
- タッチキャンセルのバグ修正        20251226  
- 動作判定用重心座標算出バグ修正    20260123
- SDK用ソースとの共用化、タッチ座標解析データLog取得内容変更    20260127
- cardConfの記述ファイル変更。 不用なコンソールログ削除、アナライザソースのHTMLに依存するgetElementコード削除   20260204
- デモページ群およびSDKのアナライザソースとの共用化　20260601                                    
- Recogintion_rate_LSCの cardConfの測定間待ち時間1秒に変更`'touchWaitTime': 1000,`、それ以外のパラメータはデフォルト。README.mdの説明修正 20260602
- multi-touchcard.com上で動作させた時には、測定結果ファイルをアプロードせずに、評価スマホのDownloadホルダに格納するように修正   20260609





