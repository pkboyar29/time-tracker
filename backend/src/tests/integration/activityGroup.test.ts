import { setupIntegrationHooks } from './setupIntegrationHooks';
import { authorizedRequest } from './authorizedRequest';

describe('Activity group controller endpoints', () => {
  const { getAccessToken } = setupIntegrationHooks();

  test('create activity group endpoint returns ok', async () => {
    await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' })
      .expect(200);
  });

  test('update activity group endpoint returns ok', async () => {
    const response = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .put(`/activity-groups/${response.body._id}`)
      .send({
        name: 'other name',
      })
      .expect(200);
  });

  test('delete activity group endpoint returns ok', async () => {
    const response = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .delete(`/activity-groups/${response.body._id}`)
      .expect(200);
  });

  test('get activity groups endpoint returns ok', async () => {
    await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'other name' });

    await authorizedRequest(getAccessToken())
      .get('/activity-groups/')
      .expect(200)
      .then((response) => {
        expect(response.body.length).toBe(2);
      });
  });

  test('get activity group endpoint returns ok', async () => {
    const createGroupResponse = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .get(`/activity-groups/${createGroupResponse.body._id}`)
      .expect(200)
      .then((response) => {
        expect(response.body._id).toBe(createGroupResponse.body._id);
      });
  });
});
