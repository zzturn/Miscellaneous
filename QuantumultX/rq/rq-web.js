// rq-vip.js
let body = $response.body;
body = body.replace(/const VIP\s*=\s*([^;]+);?/g, 'const VIP = 1;');
$done({body});