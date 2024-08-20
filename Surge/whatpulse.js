/**
 * whatpulse = type=http-response,pattern=^https:\/\/client\.whatpulse\.org\/v3\.0\/,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/whatpulse.js
 * whatpulse 解锁 premium
 */
let body_str = $response.body;

let p_str = base64Decode(body_str);
p_str = p_str.replace(/[\0\s]+$/g, '');
console.log(`Origin data: ${p_str}`);

let p_json = JSON.parse(p_str);


if ('data' in p_json && 'premium' in p_json['data']) {
    p_json['data']['premium'] = 1;
    let res_str = JSON.stringify(p_json);
    console.log(`Rewrite with ${res_str}`);
    body = base64Encode(res_str);
    console.log(body);
    $done({body});
} else if('data' in p_json && 'is_premium' in p_json['data']){
    p_json['data']['is_premium'] = 1;
    // todo 这个 response 还有一个字段是 premium_date: "" 不知道是什么时间格式,就没乱改了
    let res_str = JSON.stringify(p_json);
    console.log(`Rewrite with ${res_str}`);
    body = base64Encode(res_str);
    console.log(body);
    $done({body});
} else {
    console.log('Not processed.')
    $done({});
}

function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  let i = 0;

  while (i < str.length) {
      const a = i < str.length ? str.charCodeAt(i++) : 0;
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;

      const b1 = (a >> 2) & 0x3F;
      const b2 = ((a & 0x03) << 4) | ((b >> 4) & 0x0F);
      const b3 = ((b & 0x0F) << 2) | ((c >> 6) & 0x03);
      const b4 = c & 0x3F;

      if (b === 0 && c === 0) {
          encoded += chars.charAt(b1) + chars.charAt(b2) + '==';
      } else if (c === 0) {
          encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + '=';
      } else {
          encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
      }
  }

  return encoded;
}


  function base64Decode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let decoded = '';
    let i = 0;
  
    // Remove any characters that are not base64 character set, including padding (=)
    str = str.replace(/[^A-Za-z0-9\+\/]/g, '');
  
    while (i < str.length) {
      const b1 = chars.indexOf(str.charAt(i++));
      const b2 = chars.indexOf(str.charAt(i++));
      const b3 = chars.indexOf(str.charAt(i++));
      const b4 = chars.indexOf(str.charAt(i++));
  
      const a = ((b1 & 0x3F) << 2) | ((b2 >> 4) & 0x03);
      const b = ((b2 & 0x0F) << 4) | ((b3 >> 2) & 0x0F);
      const c = ((b3 & 0x03) << 6) | (b4 & 0x3F);
  
      decoded += String.fromCharCode(a);
      if (b3 !== 64) decoded += String.fromCharCode(b);
      if (b4 !== 64) decoded += String.fromCharCode(c);
    }
  
    return decoded;
  }