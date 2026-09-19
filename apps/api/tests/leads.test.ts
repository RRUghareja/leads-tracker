import request from 'supertest';
import { ErrorCode, LeadStatus } from '../src/constants/enums';
import { MESSAGES } from '../src/constants/messages';
import { createTestContext, type TestContext } from './helpers';

const validLead = { name: 'Asha Patel', email: 'asha@example.com', phone: '+91 98765 43210' };

describe('Leads API', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  const createLead = (body: object = validLead) => request(ctx.app).post('/api/leads').send(body);

  describe('POST /api/leads', () => {
    it('creates a lead with status "new" and returns 201 with a Location header', async () => {
      const res = await createLead();

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/api/leads/${res.body.data.id}`);
      expect(res.body).toMatchObject({
        success: true,
        message: MESSAGES.SUCCESS.LEAD_CREATED,
        meta: null,
        error: null,
      });
      expect(res.body.data).toMatchObject({ ...validLead, status: LeadStatus.NEW });
      expect(new Date(res.body.data.createdAt).getTime()).not.toBeNaN();
    });

    it('trims and lower-cases input, and stores a blank phone as null', async () => {
      const res = await createLead({ name: '  Ravi  ', email: '  Ravi@Example.COM ', phone: '  ' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ name: 'Ravi', email: 'ravi@example.com', phone: null });
    });

    it('returns 400 listing every invalid field', async () => {
      const res = await createLead({ email: 'not-an-email', status: 'hot', phone: 'call me' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(res.body.message).toBe(MESSAGES.ERROR.VALIDATION_FAILED);

      const fields = res.body.error.details.map((issue: { field: string }) => issue.field);
      expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'status', 'phone']));
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await createLead({});

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', message: 'Name is required' }),
          expect.objectContaining({ field: 'email', message: 'Email is required' }),
        ]),
      );
    });

    it('returns 409 for a duplicate email, ignoring case', async () => {
      await createLead();
      const res = await createLead({
        ...validLead,
        name: 'Someone Else',
        email: 'ASHA@example.com',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('returns the lead', async () => {
      const { body } = await createLead();

      const res = await request(ctx.app).get(`/api/leads/${body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(body.data);
      expect(res.body.meta).toBeNull();
    });

    it('returns 404 for a lead that does not exist', async () => {
      const res = await request(ctx.app).get('/api/leads/999');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(MESSAGES.ERROR.LEAD_NOT_FOUND);
      expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it.each(['abc', '0', '-3', '1.5'])('returns 400 for the invalid id "%s"', async (id) => {
      const res = await request(ctx.app).get(`/api/leads/${id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      await createLead({ name: 'Asha Patel', email: 'asha@acme.com', status: 'new' });
      await createLead({ name: 'Ravi Kumar', email: 'ravi@globex.com', status: 'contacted' });
      await createLead({ name: 'Meera Shah', email: 'meera@acme.com', status: 'contacted' });
    });

    const names = (res: request.Response) => res.body.data.map((l: { name: string }) => l.name);

    it('returns leads newest first with pagination meta', async () => {
      const res = await request(ctx.app).get('/api/leads');

      expect(res.status).toBe(200);
      expect(names(res)).toEqual(['Meera Shah', 'Ravi Kumar', 'Asha Patel']);
      expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
    });

    it('searches by name or email, case-insensitively', async () => {
      const byName = await request(ctx.app).get('/api/leads?search=ravi');
      const byEmail = await request(ctx.app).get('/api/leads?search=ACME');

      expect(names(byName)).toEqual(['Ravi Kumar']);
      expect(names(byEmail)).toEqual(['Meera Shah', 'Asha Patel']);
    });

    it('treats % and _ in the search as literal characters', async () => {
      const res = await request(ctx.app).get('/api/leads?search=%25');

      expect(res.body.data).toEqual([]);
    });

    it('filters by status and combines it with search', async () => {
      const byStatus = await request(ctx.app).get('/api/leads?status=contacted');
      const combined = await request(ctx.app).get('/api/leads?status=contacted&search=acme');

      expect(names(byStatus)).toEqual(['Meera Shah', 'Ravi Kumar']);
      expect(names(combined)).toEqual(['Meera Shah']);
    });

    it('ignores empty search and status values sent by a form', async () => {
      const res = await request(ctx.app).get('/api/leads?search=&status=');

      expect(res.body.meta.total).toBe(3);
    });

    it('paginates', async () => {
      const page2 = await request(ctx.app).get('/api/leads?limit=2&page=2');

      expect(names(page2)).toEqual(['Asha Patel']);
      expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('returns an empty page (not an error) beyond the last page', async () => {
      const res = await request(ctx.app).get('/api/leads?page=9');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it.each(['status=hot', 'page=0', 'limit=1000', 'page=abc'])(
      'returns 400 for the invalid query "%s"',
      async (query) => {
        const res = await request(ctx.app).get(`/api/leads?${query}`);

        expect(res.status).toBe(400);
      },
    );
  });

  describe('PATCH /api/leads/:id', () => {
    it('updates only the supplied fields', async () => {
      const { body } = await createLead();

      const res = await request(ctx.app)
        .patch(`/api/leads/${body.data.id}`)
        .send({ status: 'qualified' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ...validLead, status: 'qualified' });
    });

    it('clears the phone number when null is sent', async () => {
      const { body } = await createLead();

      const res = await request(ctx.app).patch(`/api/leads/${body.data.id}`).send({ phone: null });

      expect(res.body.data.phone).toBeNull();
    });

    it('lets a lead keep its own email', async () => {
      const { body } = await createLead();

      const res = await request(ctx.app)
        .patch(`/api/leads/${body.data.id}`)
        .send({ email: validLead.email, name: 'Asha P.' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Asha P.');
    });

    it('returns 409 when the email belongs to another lead', async () => {
      await createLead();
      const other = await createLead({ name: 'Other', email: 'other@example.com' });

      const res = await request(ctx.app)
        .patch(`/api/leads/${other.body.data.id}`)
        .send({ email: validLead.email });

      expect(res.status).toBe(409);
    });

    it('returns 400 for an empty body or invalid values', async () => {
      const { body } = await createLead();
      const url = `/api/leads/${body.data.id}`;

      expect((await request(ctx.app).patch(url).send({})).status).toBe(400);
      expect((await request(ctx.app).patch(url).send({ email: 'nope' })).status).toBe(400);
      expect((await request(ctx.app).patch(url).send({ status: 'hot' })).status).toBe(400);
    });

    it('returns 404 for a lead that does not exist', async () => {
      const res = await request(ctx.app).patch('/api/leads/999').send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('deletes the lead and its notes', async () => {
      const { body } = await createLead();
      const id = body.data.id;
      await request(ctx.app).post(`/api/leads/${id}/notes`).send({ content: 'Called once' });

      const res = await request(ctx.app).delete(`/api/leads/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: MESSAGES.SUCCESS.LEAD_DELETED,
        data: null,
      });
      expect((await request(ctx.app).get(`/api/leads/${id}`)).status).toBe(404);
      expect(ctx.db.get('SELECT COUNT(*) AS n FROM notes')?.n).toBe(0);
    });

    it('returns 404 for a lead that does not exist', async () => {
      const res = await request(ctx.app).delete('/api/leads/999');

      expect(res.status).toBe(404);
    });
  });
});
