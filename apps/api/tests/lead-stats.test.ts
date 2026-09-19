import request from 'supertest';
import { ErrorCode, LeadStatus } from '../src/constants/enums';
import { MESSAGES } from '../src/constants/messages';
import { createTestContext, type TestContext } from './helpers';

describe('GET /api/leads/stats', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  const createLead = (name: string, email: string, status?: LeadStatus) =>
    request(ctx.app).post('/api/leads').send({ name, email, status });
  const stats = (query = '') => request(ctx.app).get(`/api/leads/stats${query}`);

  it('returns zero for every status when there are no leads', async () => {
    const res = await stats();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(MESSAGES.SUCCESS.LEAD_STATS);
    expect(res.body.data).toEqual({
      total: 0,
      byStatus: { new: 0, contacted: 0, qualified: 0, lost: 0 },
    });
  });

  it('counts leads in each status and in total', async () => {
    await createLead('Asha', 'asha@acme.com', LeadStatus.NEW);
    await createLead('Ravi', 'ravi@globex.com', LeadStatus.CONTACTED);
    await createLead('Meera', 'meera@acme.com', LeadStatus.CONTACTED);
    await createLead('John', 'john@umbrella.com', LeadStatus.LOST);

    const res = await stats();

    expect(res.body.data).toEqual({
      total: 4,
      byStatus: { new: 1, contacted: 2, qualified: 0, lost: 1 },
    });
    expect(res.body.meta).toBeNull();
  });

  it('can be narrowed by the same search text the list uses', async () => {
    await createLead('Asha', 'asha@acme.com', LeadStatus.NEW);
    await createLead('Ravi', 'ravi@globex.com', LeadStatus.CONTACTED);
    await createLead('Meera', 'meera@acme.com', LeadStatus.CONTACTED);

    const res = await stats('?search=acme');

    expect(res.body.data).toEqual({
      total: 2,
      byStatus: { new: 1, contacted: 1, qualified: 0, lost: 0 },
    });
  });

  it('ignores a blank search and a status filter, since it always shows every status', async () => {
    await createLead('Asha', 'asha@acme.com', LeadStatus.NEW);
    await createLead('Ravi', 'ravi@globex.com', LeadStatus.LOST);

    expect((await stats('?search=')).body.data.total).toBe(2);
    expect((await stats('?status=lost')).body.data.total).toBe(2);
  });

  it('follows changes: a lead that changes status moves between the counts', async () => {
    const lead = await createLead('Asha', 'asha@acme.com', LeadStatus.NEW);
    await request(ctx.app).patch(`/api/leads/${lead.body.data.id}`).send({ status: 'qualified' });

    expect((await stats()).body.data.byStatus).toEqual({
      new: 0,
      contacted: 0,
      qualified: 1,
      lost: 0,
    });
  });

  it('is not mistaken for a lead id, and does not swallow real ids', async () => {
    const lead = await createLead('Asha', 'asha@acme.com');

    expect((await stats()).status).toBe(200);
    expect((await request(ctx.app).get(`/api/leads/${lead.body.data.id}`)).status).toBe(200);
    expect((await request(ctx.app).get('/api/leads/abc')).body.error.code).toBe(
      ErrorCode.VALIDATION_ERROR,
    );
  });
});
