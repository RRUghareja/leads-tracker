import request from 'supertest';
import { ErrorCode, LeadStatus } from '../src/constants/enums';
import { MESSAGES } from '../src/constants/messages';
import { createTestContext, type TestContext } from './helpers';

const validLead = { name: 'Asha Patel', email: 'asha@example.com', phone: '+91 98765 43210' };

describe('Lead cloning and ordering', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  const createLead = (body: object = validLead) => request(ctx.app).post('/api/leads').send(body);
  const listIds = async (): Promise<number[]> =>
    (await request(ctx.app).get('/api/leads')).body.data.map((lead: { id: number }) => lead.id);

  describe('POST /api/leads/:id/clone', () => {
    it('creates a copy at the top of the list with a unique tagged email', async () => {
      const { body } = await createLead();

      const res = await request(ctx.app).post(`/api/leads/${body.data.id}/clone`);

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/api/leads/${res.body.data.id}`);
      expect(res.body.message).toBe(MESSAGES.SUCCESS.LEAD_CLONED);
      expect(res.body.data).toMatchObject({
        name: 'Asha Patel (copy)',
        email: 'asha+copy@example.com',
        phone: validLead.phone,
        status: LeadStatus.NEW,
      });
      expect(res.body.data.id).not.toBe(body.data.id);
      expect((await listIds())[0]).toBe(res.body.data.id);
    });

    it('keeps the email unique when a lead is cloned repeatedly', async () => {
      const { body } = await createLead();
      const url = `/api/leads/${body.data.id}/clone`;

      const first = await request(ctx.app).post(url);
      const second = await request(ctx.app).post(url);

      expect([first.body.data.email, second.body.data.email]).toEqual([
        'asha+copy@example.com',
        'asha+copy2@example.com',
      ]);
    });

    it('does not copy notes', async () => {
      const { body } = await createLead();
      await request(ctx.app).post(`/api/leads/${body.data.id}/notes`).send({ content: 'Hi' });

      const clone = await request(ctx.app).post(`/api/leads/${body.data.id}/clone`);
      const notes = await request(ctx.app).get(`/api/leads/${clone.body.data.id}/notes`);

      expect(notes.body.data).toEqual([]);
    });

    it('returns 404 for a lead that does not exist and 400 for a bad id', async () => {
      expect((await request(ctx.app).post('/api/leads/999/clone')).status).toBe(404);
      expect((await request(ctx.app).post('/api/leads/abc/clone')).status).toBe(400);
    });
  });

  describe('PATCH /api/leads/reorder', () => {
    let a: number;
    let b: number;
    let c: number;
    let d: number;

    beforeEach(async () => {
      const created: number[] = [];
      for (const n of [1, 2, 3, 4]) {
        const res = await createLead({ name: `Lead ${n}`, email: `lead${n}@example.com` });
        created.push(res.body.data.id);
      }
      [a, b, c, d] = created as [number, number, number, number];
      // Newest first, so the list currently reads: d, c, b, a
    });

    const reorder = (ids: unknown) => request(ctx.app).patch('/api/leads/reorder').send({ ids });

    it('saves the new order and returns the leads in that order', async () => {
      const res = await reorder([a, b, c, d]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(MESSAGES.SUCCESS.LEADS_REORDERED);
      expect(res.body.data.map((lead: { id: number }) => lead.id)).toEqual([a, b, c, d]);
      expect(await listIds()).toEqual([a, b, c, d]);
    });

    it('only moves the leads it is given, leaving the others where they were', async () => {
      // The list reads d, c, b, a. Swap just the two in the middle.
      await reorder([b, c]);

      expect(await listIds()).toEqual([d, b, c, a]);
    });

    it('still puts a brand new lead at the top afterwards', async () => {
      await reorder([a, b]);

      const created = await createLead({ name: 'Newest', email: 'newest@example.com' });

      expect((await listIds())[0]).toBe(created.body.data.id);
    });

    it('returns 404 when any lead does not exist, and changes nothing', async () => {
      const before = await listIds();

      const res = await reorder([a, 999]);

      expect(res.status).toBe(404);
      expect(await listIds()).toEqual(before);
    });

    it.each([
      ['fewer than two ids', [1]],
      ['duplicate ids', [1, 1]],
      ['non-numeric ids', [1, 'x']],
      ['ids that are not a list', 'nope'],
      ['too many ids', Array.from({ length: 101 }, (_, i) => i + 1)],
      ['ids missing', undefined],
    ])('returns 400 for %s', async (_label, ids) => {
      const res = await reorder(ids);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });
});
