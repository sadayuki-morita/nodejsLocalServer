<?php
// 文字コード
mb_language("Japanese");
mb_internal_encoding("UTF-8");

/* 入力チェック
if (
    empty($_POST['name']) ||
    empty($_POST['email']) ||
    empty($_POST['message'])
) {
    exit("入力内容が不足しています。");
}


// メールアドレス形式チェック
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    exit("メールアドレスが正しくありません。");
}
*/
//スパム対策（簡易）
if (!empty($_POST['company'])) exit("不正送信");

/*
$name = htmlspecialchars($_POST['name'], ENT_QUOTES, 'UTF-8');
$email = htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($_POST['message'], ENT_QUOTES, 'UTF-8');
*/

// 送信先
$to = "communication@multi-touchcard.com"; // ホームページお問い合わせ専用メールアドレス

$name = 'morita';

$subject = "【評価担当】$name 様";

$body = "評価完了しました。";

$email = 'noreply@multi-touchcard.com';

//$message = 'お問い合わせがありました。';

$headers = "From: {$email}\n";
$headers .= "Reply-To: {$email}\n";

//$headers = "From: noreply@multi-touchcard.com\n";
//$headers .= "Reply-To: {$email}\n";



// メール送信
if (mb_send_mail($to, $subject, $body, $headers)) {
    echo "送信に成功しました。";
    header("Location: ../customer-eval.html");
    exit;
} else {
    echo "送信に失敗しました。";
}
?>
