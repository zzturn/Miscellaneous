/**
 * author: 𝙯𝙯𝙩𝙪𝙧𝙣
 * desc: app 内大部分 vip 功能
 */

var obj = JSON.parse($response.body);

// 确保对象存在
if (!obj.data) obj.data = {};
if (!obj.data.service_list) obj.data.service_list = {};

// 设置订阅状态
obj.data.is_vip = true;
obj.data.isVip = true;
obj.data.is_itunes_purchase = true; // 国际版使用
obj.data.is_googleplay_subscribe = true; // 国际版使用
obj.data.vip_due_at = "2099-12-31 23:59:59";
obj.data.is_ios_sub = 1;
obj.data.service_list.vip_is_have = 1;

$done({body: JSON.stringify(obj)});