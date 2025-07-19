/**
 * chatsmith = type=http-request,pattern=^https:\/\/chatgpt\.vulcanlabs\.co\/.*,requires-body=1,max-size=-1,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/chatsmith.js
 * use smith hack key to request openai, this script only rewrite body to meet the chat smith's requirement
 * 
 * @deprecated 已放弃维护
 * @author zzturn
 * @see https://github.com/zzturn/Miscellaneous
 */
let headers = $request.headers;
let body_str = $request.body;

let body = JSON.parse(body_str);

if ('User-Agent' in headers) {
    delete headers['User-Agent'];
}
headers['user-agent'] = 'iOS App, Version 6.2.4'

body['stream'] = false;
if ('temperature' in body) {
    delete body['temperature']
}
let new_body = JSON.stringify(body)
$done({ headers, body: new_body });