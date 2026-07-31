const { Redis } =  require('ioredis')

const createConnection = () => new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
  retryStrategy: (times) => Math.min(times * 500, 2000)
})


module.exports = { createConnection }

