import request from 'supertest';
import { createTestContext, type TestContext } from './helpers';

const pause = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Lead "last updated"', () => {
  let ctx: TestContext;
  let lead: { id: number; createdAt: string; updatedAt: string };

  beforeEach(async () => {
    ctx = createTestContext();
    const res = await request(ctx.app)
      .post('/api/leads')
      .send({ name: 'Asha Patel', email: 'asha@example.com' });
    lead = res.body.data;
  });

  const patch = (body: object) => request(ctx.app).patch(`/api/leads/${lead.id}`).send(body);
  const fetchLead = async () => (await request(ctx.app).get(`/api/leads/${lead.id}`)).body.data;

  it('starts equal to the created time', () => {
    expect(lead.updatedAt).toBe(lead.createdAt);
  });

  it('moves forward when a field changes, while createdAt stays the same', async () => {
    await pause();

    const res = await patch({ status: 'contacted' });

    expect(res.body.data.createdAt).toBe(lead.createdAt);
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(
      new Date(lead.updatedAt).getTime(),
    );
  });

  it('is returned by the list and by a single lead', async () => {
    const list = await request(ctx.app).get('/api/leads');

    expect(list.body.data[0].updatedAt).toBe(lead.updatedAt);
    expect((await fetchLead()).updatedAt).toBe(lead.updatedAt);
  });

  it('does not change when a lead is only dragged to a new position', async () => {
    const other = await request(ctx.app)
      .post('/api/leads')
      .send({ name: 'Ravi Kumar', email: 'ravi@example.com' });
    await pause();

    await request(ctx.app)
      .patch('/api/leads/reorder')
      .send({ ids: [lead.id, other.body.data.id] });

    expect((await fetchLead()).updatedAt).toBe(lead.updatedAt);
  });

  it('does not change when a note is added', async () => {
    await pause();

    await request(ctx.app).post(`/api/leads/${lead.id}/notes`).send({ content: 'Called' });

    expect((await fetchLead()).updatedAt).toBe(lead.updatedAt);
  });

  it('starts fresh for a clone instead of copying the original', async () => {
    await pause();
    await patch({ name: 'Asha P.' });
    const original = await fetchLead();
    await pause();

    const clone = await request(ctx.app).post(`/api/leads/${lead.id}/clone`);

    expect(clone.body.data.updatedAt).toBe(clone.body.data.createdAt);
    expect(clone.body.data.createdAt > original.updatedAt).toBe(true);
  });
});
