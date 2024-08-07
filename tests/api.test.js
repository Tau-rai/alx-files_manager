// test/api.test.js
const request = require('supertest');
const app = require('../server');

describe('aPI Endpoints', () => {
  it('gET /status should return status 200', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('gET /stats should return stats', async () => {
    const response = await request(app).get('/stats');
    expect(response.status).toBe(200);
  });

  it('pOST /users should create a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('email', 'test@example.com');
  });

  it('gET /connect should authenticate user', async () => {
    const response = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('email:password').toString('base64')}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('gET /disconnect should sign out user', async () => {
    const response = await request(app)
      .get('/disconnect')
      .set('X-Token', 'valid-token');
    expect(response.status).toBe(204);
  });

  it('gET /users/me should return user info', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('X-Token', 'valid-token');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
  });

  it('pOST /files should start background processing', async () => {
    const response = await request(app)
      .post('/files')
      .attach('file', 'path/to/file.jpg');
    expect(response.status).toBe(202);
  });

  it('gET /files/:id should return file info', async () => {
    const response = await request(app).get('/files/1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', '1');
  });

  it('gET /files should return paginated files', async () => {
    const response = await request(app).get('/files?page=1&limit=10');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.files)).toBe(true);
  });

  it('pUT /files/:id/publish should publish the file', async () => {
    const response = await request(app)
      .put('/files/1/publish')
      .set('X-Token', 'valid-token');
    expect(response.status).toBe(200);
  });

  it('pUT /files/:id/unpublish should unpublish the file', async () => {
    const response = await request(app)
      .put('/files/1/unpublish')
      .set('X-Token', 'valid-token');
    expect(response.status).toBe(200);
  });

  it('gET /files/:id/data should return file data', async () => {
    const response = await request(app).get('/files/1/data?size=500');
    expect(response.status).toBe(200);
  });
});
