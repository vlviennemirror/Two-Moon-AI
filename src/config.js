const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.BOT_PREFIX || '!'
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 1024,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7
  },
  database: {
    url: process.env.DATABASE_URL
  },
  context: {
    historyLimit: parseInt(process.env.HISTORY_LIMIT) || 20,
    replyChainDepth: parseInt(process.env.REPLY_CHAIN_DEPTH) || 5,
    maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS) || 4000
  },
  cache: {
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100,
    ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES) || 5
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 10,
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW) || 60
  }
};

export default config;
