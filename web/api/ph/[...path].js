export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/ph/, '')
  const host = (path.startsWith('/static/') || path.startsWith('/array/'))
    ? 'us-assets.i.posthog.com'
    : 'us.i.posthog.com'

  const headers = new Headers(req.headers)
  headers.delete('host')

  const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : req.body

  return fetch(`https://${host}${path}${url.search}`, {
    method: req.method,
    headers,
    body,
  })
}
