import request from 'supertest';
import { loadConfig } from '../src/config/env';
import { BASIC_AUTH } from '../src/constants/constants';
import { MESSAGES } from '../src/constants/messages';
import { createTestContext } from './helpers';

describe('Basic auth configuration', () => {
  it('is ON by default, with the built-in demo login', () => {
    const config = loadConfig({});

    expect(config.basicAuth).toEqual({
      user: BASIC_AUTH.DEFAULT_USER,
      password: BASIC_AUTH.DEFAULT_PASSWORD,
    });
    expect(config.usesDemoLogin).toBe(true);
  });

  it('uses a custom login when one is set, and no longer counts as the demo login', () => {
    const config = loadConfig({ BASIC_AUTH_USER: 'rakesh', BASIC_AUTH_PASSWORD: 'long-secret' });

    expect(config.basicAuth).toEqual({ user: 'rakesh', password: 'long-secret' });
    expect(config.usesDemoLogin).toBe(false);
  });

  it.each(['false', 'FALSE', '0', 'off', 'no', ' false '])(
    'is switched off by BASIC_AUTH_ENABLED=%j',
    (value) => {
      const config = loadConfig({ BASIC_AUTH_ENABLED: value });

      expect(config.basicAuth).toBeUndefined();
      expect(config.usesDemoLogin).toBe(false);
    },
  );

  it.each(['true', '1', 'yes', ''])('stays on for BASIC_AUTH_ENABLED=%j', (value) => {
    expect(loadConfig({ BASIC_AUTH_ENABLED: value }).basicAuth).toBeDefined();
  });

  it('treats blank credentials as "not set", so the demo login applies', () => {
    const config = loadConfig({ BASIC_AUTH_USER: '', BASIC_AUTH_PASSWORD: '  ' });

    expect(config.usesDemoLogin).toBe(true);
  });

  it('refuses half a custom login instead of mixing it with the demo one', () => {
    expect(() => loadConfig({ BASIC_AUTH_USER: 'rakesh' })).toThrow(
      MESSAGES.CONFIG.AUTH_PAIR_REQUIRED,
    );
    expect(() => loadConfig({ BASIC_AUTH_PASSWORD: 'secret' })).toThrow(
      MESSAGES.CONFIG.AUTH_PAIR_REQUIRED,
    );
  });

  it('ignores credentials when auth is switched off', () => {
    const config = loadConfig({
      BASIC_AUTH_ENABLED: 'false',
      BASIC_AUTH_USER: 'rakesh',
    });

    expect(config.basicAuth).toBeUndefined();
  });

  describe('with the demo login active', () => {
    // No BASIC_AUTH_* at all, and the flag left at its default (on).
    const demo = { BASIC_AUTH_ENABLED: undefined };

    it('asks for a login on the API, and accepts admin@gmail.com / admin123', async () => {
      const { app } = createTestContext(demo);

      expect((await request(app).get('/api/leads')).status).toBe(401);
      expect(
        (await request(app).get('/api/leads').auth(BASIC_AUTH.DEFAULT_USER, 'wrong')).status,
      ).toBe(401);
      expect(
        (
          await request(app)
            .get('/api/leads')
            .auth(BASIC_AUTH.DEFAULT_USER, BASIC_AUTH.DEFAULT_PASSWORD)
        ).status,
      ).toBe(200);
    });

    it('still leaves the health check public', async () => {
      const { app } = createTestContext(demo);

      expect((await request(app).get('/api/health')).status).toBe(200);
    });
  });
});
