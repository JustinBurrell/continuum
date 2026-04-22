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

module.exports = client
