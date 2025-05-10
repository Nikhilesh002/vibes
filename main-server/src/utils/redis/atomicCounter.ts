import Redis from "ioredis";

export async function atomicIncrement(
  redis: Redis,
  key: string,
  maxAllowed: number
): Promise<boolean> {
  const luaScript = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    if current < tonumber(ARGV[1]) then
      redis.call("INCR", KEYS[1])
      return 1
    else
      return 0
    end
  `;
  // Evaluate the script, passing one key (the counter key) and one argument (the maxAllowed value)
  const result = await redis.eval(luaScript, 1, key, maxAllowed);
  return result === 1;
}

export async function atomicDecrement(
  redis: Redis,
  key: string
): Promise<boolean> {
  const luaScript = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    if current > 0 then
      redis.call("DECR", KEYS[1])
      return 1
    else
      return 0
    end
  `;

  const result = await redis.eval(luaScript, 1, key);
  return result === 1;
}
