const config = {
  discord: {
    token: process.env.DISCORD_TOKEN
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 256,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.8
  },
  database: {
    url: process.env.DATABASE_URL
  },
  context: {
    historyLimit: parseInt(process.env.HISTORY_LIMIT) || 15,
    replyChainDepth: parseInt(process.env.REPLY_CHAIN_DEPTH) || 5,
    maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS) || 3000
  },
  cache: {
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100,
    ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES) || 5
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 15,
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW) || 60
  }
};

export default config;
