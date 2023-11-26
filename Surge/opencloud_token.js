/**
 * opencloud_token = type=http-request,pattern=^https:\/\/openkey\.cloud\/.*,requires-body=1,max-size=-1,timeout=10,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/opencloud_token.js
 * 
 * (Self-use) To rewrite authorization
 */


let headers = $request.headers;

$httpClient.get({
    url: "http://xin.local:5000/get_random_key",
}, (error, response, data) => {
    if (error === null) {
        // Parse the response data
        const res = JSON.parse(data);
        // Check if the 'result' property exists in the response
        if (res && res.result) {
            // Assuming 'result' is a string value, set it as the token
            if ('authorization' in headers) {
                delete headers['authorization'];
            }
            
            let token = "Bearer " + res.result;
            headers['Authorization'] = token;

            // Now you can use the 'token' variable as needed
            console.log("Get token from redis:", token);
        } else {
            console.error("Response did not contain the expected 'result' property.");
        }
    } else {
        console.error("Error in HTTP request:", error);
    }
    $done({ headers });
});
