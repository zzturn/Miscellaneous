addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    let target = url.searchParams.get('target')

    if (!target) {
        return new Response('Hello, this is Cloudflare Proxy Service. To proxy your requests, please use the "target" URL parameter.')
    } else {
        target = decodeURIComponent(target)
        const newRequest = new Request(target, {
            headers: request.headers,
            method: request.method,
            body: request.body
        })
        return await fetch(newRequest)
    }
}