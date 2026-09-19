import request from 'supertest';
import { ErrorCode } from '../src/constants/enums';
import { createTestContext } from './helpers';

describe('API foundation', () => {
  it('reports healthy status with a working database', async () => {
    const { app } = createTestContext();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const { app } = createTestContext();

    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('uses one response envelope for success and error responses', async () => {
    const { app } = createTestContext();

    const ok = await request(app).get('/api/health');
    const failed = await request(app).get('/api/nope');

    for (const res of [ok, failed]) {
      expect(Object.keys(res.body).sort()).toEqual(['data', 'error', 'message', 'meta', 'success']);
    }
    expect(ok.body).toMatchObject({ success: true, meta: null, error: null });
    expect(failed.body).toMatchObject({ success: false, data: null, meta: null });
    expect(failed.body.error).toEqual({ code: ErrorCode.NOT_FOUND, details: null });
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const { app } = createTestContext();

    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  describe('basic auth', () => {
    const env = {
      BASIC_AUTH_ENABLED: 'true',
      BASIC_AUTH_USER: 'admin',
      BASIC_AUTH_PASSWORD: 's3cret',
    };

    it('keeps the health check public', async () => {
      const { app } = createTestContext(env);
      expect((await request(app).get('/api/health')).status).toBe(200);
    });

    it('rejects requests without valid credentials', async () => {
      const { app } = createTestContext(env);

      const missing = await request(app).get('/api/anything');
      const wrong = await request(app).get('/api/anything').auth('admin', 'nope');

      expect(missing.status).toBe(401);
      expect(missing.headers['www-authenticate']).toContain('Basic');
      expect(wrong.status).toBe(401);
    });

    it('lets valid credentials through to the router', async () => {
      const { app } = createTestContext(env);

      const res = await request(app).get('/api/anything').auth('admin', 's3cret');

      // Authenticated, so we reach the 404 handler instead of the 401.
      expect(res.status).toBe(404);
    });
  });
});
