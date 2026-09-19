import request from 'supertest';
import { MESSAGES } from '../src/constants/messages';
import { createTestContext, type TestContext } from './helpers';

describe('Notes API', () => {
  let ctx: TestContext;
  let leadId: number;

  beforeEach(async () => {
    ctx = createTestContext();
    const res = await request(ctx.app)
      .post('/api/leads')
      .send({ name: 'Asha Patel', email: 'asha@example.com' });
    leadId = res.body.data.id;
  });

  const addNote = (content: unknown, id: number | string = leadId) =>
    request(ctx.app).post(`/api/leads/${id}/notes`).send({ content });

  describe('POST /api/leads/:id/notes', () => {
    it('adds a note and returns 201', async () => {
      const res = await addNote('  Asked for a demo  ');

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ leadId, content: 'Asked for a demo' });
      expect(typeof res.body.data.id).toBe('number');
      expect(new Date(res.body.data.createdAt).getTime()).not.toBeNaN();
    });

    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['missing', undefined],
    ])('returns 400 when the content is %s', async (_label, content) => {
      const res = await addNote(content);

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([
        expect.objectContaining({ location: 'body', field: 'content' }),
      ]);
    });

    it('returns 400 when the content is too long', async () => {
      expect((await addNote('x'.repeat(2001))).status).toBe(400);
    });

    it('returns 404 when the lead does not exist', async () => {
      const res = await addNote('Hello', 999);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(MESSAGES.ERROR.LEAD_NOT_FOUND);
    });

    it('returns 400 for an invalid lead id', async () => {
      expect((await addNote('Hello', 'abc')).status).toBe(400);
    });
  });

  describe('GET /api/leads/:id/notes', () => {
    it('returns an empty list for a lead without notes', async () => {
      const res = await request(ctx.app).get(`/api/leads/${leadId}/notes`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns multiple notes, newest first', async () => {
      await addNote('First');
      await addNote('Second');
      await addNote('Third');

      const res = await request(ctx.app).get(`/api/leads/${leadId}/notes`);

      expect(res.body.data.map((n: { content: string }) => n.content)).toEqual([
        'Third',
        'Second',
        'First',
      ]);
    });

    it('only returns notes that belong to the requested lead', async () => {
      const other = await request(ctx.app)
        .post('/api/leads')
        .send({ name: 'Ravi', email: 'ravi@example.com' });
      await addNote('For Asha');
      await addNote('For Ravi', other.body.data.id);

      const res = await request(ctx.app).get(`/api/leads/${leadId}/notes`);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].content).toBe('For Asha');
    });

    it('returns 404 when the lead does not exist', async () => {
      const res = await request(ctx.app).get('/api/leads/999/notes');

      expect(res.status).toBe(404);
    });
  });
});
