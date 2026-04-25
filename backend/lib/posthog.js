const { PostHog } = require('posthog-node')

const client = new PostHog(process.env.POSTHOG_KEY || 'noop', {
  host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  flushAt: 20,
  flushInterval: 10000,
  disabled: !process.env.POSTHOG_KEY || process.env.NODE_ENV === 'test',
})

process.on('beforeExit', async () => {
  await client.shutdown()
})

// Render injects RENDER_GIT_COMMIT automatically in production.
// Falls back to APP_VERSION if set manually, then 'unknown' locally.
const appVersion = process.env.RENDER_GIT_COMMIT ?? process.env.APP_VERSION ?? 'unknown'

// Wrapper that silences all events for demo and seed accounts.
// Usage: posthog.capture(req.user, 'event_name', { ...props })
function capture(user, event, properties = {}) {
  if (!user || user.isDemo || user.isSeedUser) return
  client.capture({
    distinctId: user._id.toString(),
    event,
    properties: { ...properties, appVersion },
  })
}

module.exports = { capture, client, appVersion }
