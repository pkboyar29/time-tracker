import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import userService from '../../service/user.service';

export const setupIntegrationHooks = () => {
  let mongo: MongoMemoryServer;
  let accessToken: string = '';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  beforeEach(async () => {
    const { access } = await userService.signUp({
      email: 'email@email.com',
      password: 'passwordA1!',
    });

    accessToken = access;
  });

  return {
    getAccessToken: () => accessToken,
  };
};
