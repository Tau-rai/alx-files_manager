// Tests for the Redis client
const redisClient = require('../utils/redis');

describe('redis Client', () => {
  it('should be alive', async () => {
    expect(await redisClient.isAlive()).toBe(true);
  });
  it('should not get any value', async () => {
    expect(await redisClient.get('key')).toBeNull();
  });
});
describe('redis Client', () => {
  it('should set a value', async () => {
    expect(await redisClient.set('key', 'value')).toBe('OK');
  });
  it('should get a value', async () => {
    expect(await redisClient.get('key')).toBe('value');
  });
});
