/**
 * opencloud_remove = type=http-response,pattern=^https:\/\/openkey\.cloud\/.*,requires-body=1,max-size=1024,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/opencloud_remove.js
 * 
 * (Self-use) To remove some token invalid.
 */
let headers = $request.headers;
let body_str = $response.body;
let status_code = $response.status;
if (body_str === undefined || status_code === 200) {
    $done($response);
} else {
    $notification.post("remove", body_str, body_str)
    let body = JSON.parse(body_str);
    // 判断JSON结构是否符合要求
    if (
        body.hasOwnProperty("error") &&
        typeof body.error === "object" &&
        body.error.hasOwnProperty("message") &&
        typeof body.error.message === "string" &&
        (body.error.message === "该令牌额度已用尽" || body.error.message == "无效的令牌")
    ) {
        let token = "";
        if ('authorization' in headers) {
            token = headers['authorization'];
        } else if ('Authorization' in headers) {
            token = headers['Authorization'];
        }
        const parts = token.split(" ");

        if (parts.length === 2) {
            key = parts[1];
            if (key == 'all_openai_key') {
                $done($response);
            } else {
                $httpClient.get({
                    url: `http://xin.local:5000/zrem/all_openai_key/${key}`,
                }, (error, response, data) => {
                    if (error === null) {
                        $notification.post("Remove token", key, key)
                    } else {
                        console.error("Error in HTTP request:", error);
                    }
                });
                $httpClient.get({
                    url: `http://xin.local:5000/delete/${key}`,
                }, (error, response, data) => {
                    if (error === null) {
                        $notification.post("Remove token", key, key)
                    } else {
                        console.error("Error in HTTP request:", error);
                    }
                });
            }
        }

    }
}
$done($response);
