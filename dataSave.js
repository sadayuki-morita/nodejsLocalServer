const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const cors = require('cors');
const port = 5000;

app.use(cors());

// Multerの設定：保存先とファイル名を設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        // uploadsディレクトリがなければ作成
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir); // アップロード先ディレクトリ
    },
    filename: (req, file, cb) => {
        // クライアント側から送られたファイル名を使用
        const originalFileName = req.body.filename || file.originalname; // ファイル名を指定しなかった場合、デフォルトの名前を使用
        cb(null, originalFileName);
    }
});
    
const upload = multer({ storage: storage });


// データをPOSTしてファイルを保存するエンドポイント
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.send('File uploaded successfully: ' + req.file.filename);
    } else {
        res.status(400).send('File upload failed');
    }
});

// 静的ファイルの提供 (HTMLページなどを提供する場合)
app.use(express.static(path.join(__dirname, 'public')));


// サーバーの起動
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
