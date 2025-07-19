/**
 * 破解 whatpulse 会员功能
 * 
 * whatpulse = type=http-response,pattern=^https:\/\/client\.whatpulse\.org\/v3\.0\/,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/whatpulse.js
 * 
 * @author zzturn
 * @see https://github.com/zzturn/Miscellaneous
 */

function base64Decode(str) {
  // Surge 里可以直接用 atob
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.log("base64 解码失败: " + e);
    $done({});
  }
}

function base64Encode(str) {
  // Surge 里可以直接用 btoa
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.log("base64 编码失败: " + e);
    $done({});
  }
}

try {
  console.log("whatpulse 脚本启动");

  const decoded = $response.body ? base64Decode($response.body) : null;
  if (!decoded) {
    console.log("body 为空或解码失败，直接返回原始内容");
    $done({});
  }

  console.log("base64解码后内容: " + decoded);

  let obj;
  try {
    obj = JSON.parse(decoded);
  } catch (e) {
    console.log("JSON解析失败: " + e);
    $done({});
  }

  if (obj.data && typeof obj.data === "object" && obj.data.hasOwnProperty("premium")) {
    console.log("检测到 data.premium 字段，准备修改...");
    obj.data.premium = 1;
    obj.data.premium_expire = "2099-07-30T00:00:00.000000Z";
    const newBody = base64Encode(JSON.stringify(obj));
    if (!newBody) {
      console.log("base64编码失败，返回原始内容");
      $done({});
    } else {
      console.log("修改成功，返回新body");
      $done({ body: newBody });
    }
  } else {
    console.log("未检测到 data.premium 字段，返回原始内容");
    $done({});
  }
} catch (err) {
  console.log("脚本异常: " + err);
  $done({});
}
