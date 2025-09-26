import { setupIntegrationHooks } from './setupIntegrationHooks';
import { authorizedRequest } from './authorizedRequest';

import analyticsService from '../../service/analytics.service';

describe('Activity controller endpoints', () => {
  const { getAccessToken } = setupIntegrationHooks();

  test('create activity endpoint returns ok', async () => {
    const {
      body: { _id },
    } = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'name', activityGroupId: _id })
      .expect(200);
  });

  test('update activity endpoint returns ok', async () => {
    jest
      .spyOn(analyticsService, 'invalidateAnalyticsCache')
      .mockResolvedValue(undefined);

    const {
      body: { _id },
    } = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    const createActivityResponse = await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'name', activityGroupId: _id });

    await authorizedRequest(getAccessToken())
      .put(`/activities/${createActivityResponse.body._id}`)
      .send({ name: 'other name' })
      .expect(200);
  });

  test('delete activity endpoint returns ok', async () => {
    jest
      .spyOn(analyticsService, 'invalidateAnalyticsCache')
      .mockResolvedValue(undefined);

    const {
      body: { _id },
    } = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    const createActivityResponse = await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'name', activityGroupId: _id });

    await authorizedRequest(getAccessToken())
      .delete(`/activities/${createActivityResponse.body._id}`)
      .expect(200);
  });

  test('get activities endpoint returns ok', async () => {
    const {
      body: { _id },
    } = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'activity name 1', activityGroupId: _id });

    await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'activity name 2', activityGroupId: _id });

    await authorizedRequest(getAccessToken())
      .get('/activities/')
      .expect(200)
      .then((response) => {
        expect(response.body.remainingActivities.length).toBe(2);
      });
  });

  test('get activity endpoint returns ok', async () => {
    const {
      body: { _id },
    } = await authorizedRequest(getAccessToken())
      .post('/activity-groups/')
      .send({ name: 'name' });

    const createActivityResponse = await authorizedRequest(getAccessToken())
      .post('/activities/')
      .send({ name: 'activity name 1', activityGroupId: _id });

    await authorizedRequest(getAccessToken())
      .get(`/activities/${createActivityResponse.body._id}`)
      .expect(200)
      .then((response) => {
        expect(response.body._id).toBe(createActivityResponse.body._id);
      });
  });
});
