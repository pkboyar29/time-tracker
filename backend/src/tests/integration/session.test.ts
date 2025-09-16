import { setupIntegrationHooks } from './setupIntegrationHooks';
import { authorizedRequest } from './authorizedRequest';

describe('Session controller endpoints', () => {
  const { getAccessToken } = setupIntegrationHooks();

  test('create session endpoint returns ok', async () => {
    await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1000 })
      .expect(200);
  });

  test('create session endpoint returns not found if the provided activity does not exist', async () => {
    await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1000, activity: 'random-id' })
      .expect(404)
      .then((response) => {
        expect(response.text).toEqual('Activity Not Found');
      });
  });

  test('update session endpoint returns ok', async () => {
    const response = await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1000 });

    await authorizedRequest(getAccessToken())
      .put(`/sessions/${response.body._id}`)
      .send({
        totalTimeSeconds: 1000,
        spentTimeSeconds: 200,
        note: 'some notes',
      })
      .expect(200);
  });

  test('delete session endpoint returns ok', async () => {
    const response = await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1000 });

    await authorizedRequest(getAccessToken())
      .delete(`/sessions/${response.body._id}`)
      .expect(200);
  });

  test('get uncompleted sessions endpoint returns ok with 2 objects', async () => {
    await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1000 });

    await authorizedRequest(getAccessToken())
      .post('/sessions/')
      .send({ totalTimeSeconds: 1500 });

    await authorizedRequest(getAccessToken())
      .get(`/sessions?completed=false`)
      .expect(200)
      .then((response) => {
        expect(response.body.length).toBe(2);
      });
  });
});
