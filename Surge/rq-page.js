/**
 * Render the RQ best-fitness page with the data returned by its normal API.
 *
 * rq-best-fitness-page = type=http-response,pattern=^https:\/\/www\.rq\.run\/User\/Training\/best_fitness(?:\?.*)?$,requires-body=true,max-size=-1,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/rq-page.js
 * rq-best-fitness-api = type=http-request,pattern=^https:\/\/www\.rq\.run\/dc\/api(?:\?.*)?$,script-path=https://raw.githubusercontent.com/zzturn/Miscellaneous/master/Surge/rq-page.js
 */

var request = typeof $request !== "undefined" ? $request : {};
var response = typeof $response !== "undefined" ? $response : null;
var url = request.url || "";

function dateKey(year, month, day) {
    return Number(year) * 10000 + Number(month) * 100 + Number(day);
}

function threeYearsBefore(year, month, day) {
    return (Number(year) - 3) + "-" + Number(month) + "-" + Number(day);
}

function rewritePage(body) {
    // Let the original page render normally instead of entering nonVipMask().
    body = body.replace(
        /const\s+VIP\s*=\s*parseInt\(\s*['"]0['"]\s*\)\s*;/i,
        "const VIP = parseInt('1');"
    );

    // Keep the visible date range consistent with the request rewrite below.
    var endDate = body.match(
        /id\s*=\s*["']end_date["'][^>]*value\s*=\s*["'](\d{4})-(\d{1,2})-(\d{1,2})["']/i
    );
    if (!endDate) return body;

    var startDate = threeYearsBefore(endDate[1], endDate[2], endDate[3]);
    return body.replace(
        /(id\s*=\s*["']start_date["'][^>]*value\s*=\s*["'])[^"']*(["'])/i,
        function (_, prefix, suffix) {
            return prefix + startDate + suffix;
        }
    );
}

function rewriteFitnessApiUrl(input) {
    var decoded = input;
    try {
        decoded = decodeURIComponent(input);
    } catch (e) {
        // Keep the original URL if it contains an invalid escape sequence.
    }

    if (decoded.indexOf("_=User/Training/best_fitness") < 0) {
        return input;
    }

    var endDate = input.match(
        /[?&]end_date=(\d{4})-(\d{1,2})-(\d{1,2})/i
    );
    var startDate = input.match(
        /[?&]start_date=(\d{4})-(\d{1,2})-(\d{1,2})/i
    );
    if (!endDate || !startDate) return input;

    var minimumStart = threeYearsBefore(endDate[1], endDate[2], endDate[3]);
    if (
        dateKey(startDate[1], startDate[2], startDate[3]) <=
        dateKey(Number(endDate[1]) - 3, endDate[2], endDate[3])
    ) {
        return input;
    }

    return input.replace(
        /([?&]start_date=)\d{4}-\d{1,2}-\d{1,2}/i,
        "$1" + minimumStart
    );
}

if (response && typeof response.body === "string") {
    if (
        /^https:\/\/www\.rq\.run\/User\/Training\/best_fitness(?:\?.*)?$/i.test(url)
    ) {
        $done({ body: rewritePage(response.body) });
    } else {
        $done({});
    }
} else if (/^https:\/\/www\.rq\.run\/dc\/api(?:\?.*)?$/i.test(url)) {
    var rewrittenUrl = rewriteFitnessApiUrl(url);
    $done(rewrittenUrl === url ? {} : { url: rewrittenUrl });
} else {
    $done({});
}
