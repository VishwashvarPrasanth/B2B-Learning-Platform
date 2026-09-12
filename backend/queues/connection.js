const { Redis } = require('ioredis')

const createConnection = () => {
  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: {},
    retryStrategy: (times) => {
      if (times > 3) return null  // stop retrying after 3 attempts
      return Math.min(times * 500, 2000)
    },
    enableOfflineQueue: false
  })

  // suppress error logs — redis is optional feature
  redis.on('error', () => {})

  return redis
}

module.exports = { createConnection }