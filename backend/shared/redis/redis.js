import Redis from "ioredis";

function parseRedisUrl(inputUrl) {
  if (!inputUrl) return "redis://localhost:6379";
  let cleanUrl = String(inputUrl).trim();

  // If user pasted CLI command like "redis-cli --tls -u rediss://..." or "redis://redis-cli..."
  cleanUrl = cleanUrl.replace(/^redis:\/\//i, ""); // remove duplicated outer prefix if present
  const match = cleanUrl.match(/(redis[s]?:\/\/[^\s"']+)/i);
  if (match) {
    return match[1];
  }

  cleanUrl = cleanUrl.replace(/^redis-cli\s+(--tls\s+)?-u\s+/i, "");
  return cleanUrl.startsWith("redis") ? cleanUrl : `rediss://${cleanUrl}`;
}

const redisUrl = parseRedisUrl(process.env.REDIS_URL);

let redis;
try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000);
      return delay;
    },
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("⚠️ Redis connection issue:", err.message);
  });
} catch (e) {
  console.error("⚠️ Redis init error:", e.message);
  // Dummy fallback
  redis = new Redis({ lazyConnect: true, maxRetriesPerRequest: null });
}

export default redis;