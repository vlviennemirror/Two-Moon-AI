const config = {
  discord: {
    token: process.env.DISCORD_TOKEN
  },
  server: {
    allowedId: process.env.ALLOWED_SERVER_ID || '1452886738497310720',
    lurkerChannel: process.env.LURKER_CHANNEL_ID || '1452886738497310824'
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    modelFast: 'llama-3.1-8b-instant',
    modelSmart: 'llama-3.3-70b-versatile',
    maxTokens: 150,
    temperature: 0.9
  },
  database: {
    url: process.env.DATABASE_URL
  },
  context: {
    historyLimit: 15,
    replyChainDepth: 5
  },
  cache: {
    maxSize: 100,
    ttlMinutes: 5
  },
  rateLimit: {
    maxRequests: 20,
    windowSeconds: 60
  },
  lurker: {
    minScore: 85,
    cooldownMinutes: 10
  }
};

export default config;
