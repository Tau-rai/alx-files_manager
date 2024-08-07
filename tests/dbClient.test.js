// Tests for the database client
const dbClient = require('../utils/db');

describe('database Client', () => {
  it('should be alive', async () => {
    expect(await dbClient.isAlive()).toBe(true);
  });

  it('should return the number of users', async () => {
    const numberOfUsers = await dbClient.nbUsers();
    expect(typeof numberOfUsers).toBe('number');
  });

  it('should return the number of files', async () => {
    const numberOfFiles = await dbClient.nbFiles();
    expect(typeof numberOfFiles).toBe('number');
  });
});
