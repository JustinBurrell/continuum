export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/ph/, '')
  const host = path.startsWith('/static/')
    ? 'us-assets.i.posthog.com'
    : 'us.i.posthog.com'

  return fetch(`https://${host}${path}${url.search}`, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  })
}
