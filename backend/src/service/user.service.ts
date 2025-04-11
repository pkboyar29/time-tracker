import { UserSignUpDTO, UserSignInDTO, UserResponseDTO } from '../dto/user.dto';
import User from '../model/user.model';
import activityGroupService from './activityGroup.service';
import activityService from './activity.service';
import sessionService from './session.service';
import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';

interface AuthorizeResponse {
  access: string;
  refresh: string;
}

export default {
  async signUp(userSignUpDTO: UserSignUpDTO): Promise<AuthorizeResponse> {
    const users = await User.find({});
    users.forEach((user) => {
      if (user.username === userSignUpDTO.username) {
        throw new Error('Username must be unique');
      }

      if (user.email === userSignUpDTO.email) {
        throw new Error('Email must be unique');
      }
    });

    const salt = genSaltSync(10);
    const hashedPassword = hashSync(userSignUpDTO.password, salt);

    const newUser = new User({
      ...userSignUpDTO,
      dailyGoal: 10800, // 3 hours
      password: hashedPassword,
    });

    const newUserWithId = await newUser.save();

    return this.createTokens(newUserWithId.id);
  },

  async signIn(userSignInDTO: UserSignInDTO): Promise<AuthorizeResponse> {
    const user = await User.find({ username: userSignInDTO.username });
    if (!user[0]) {
      throw new Error('User with this username doesnt exists');
    }

    if (!compareSync(userSignInDTO.password, user[0].password)) {
      throw new Error('Password incorrect');
    }

    return this.createTokens(user[0].id);
  },

  createTokens(userId: string): AuthorizeResponse {
    return {
      access: this.createAccessToken(userId),
      refresh: this.createRefreshToken(userId),
    };
  },

  createToken(
    userId: string,
    tokenType: 'access' | 'refresh',
    secretKey: string
  ): string {
    let token: string = '';

    const payload = {
      userId,
      tokenType,
    };

    token = jsonwebtoken.sign(payload, secretKey, {
      // поменять access на 300s
      expiresIn: tokenType === 'access' ? '5d' : '5d',
    });
    return token;
  },

  createAccessToken(userId: string): string {
    let accessToken = '';

    if (process.env.ACCESS_TOKEN_SECRET) {
      accessToken = this.createToken(
        userId,
        'access',
        process.env.ACCESS_TOKEN_SECRET
      );
    }

    return accessToken;
  },

  createRefreshToken(userId: string): string {
    let refreshToken: string = '';

    if (process.env.REFRESH_TOKEN_SECRET) {
      refreshToken = this.createToken(
        userId,
        'refresh',
        process.env.REFRESH_TOKEN_SECRET
      );
    }

    return refreshToken;
  },

  checkToken(jwt: string, checkingTokenType: 'access' | 'refresh') {
    const payload: JwtPayload | null = jsonwebtoken.decode(jwt, {
      json: true,
    });
    if (payload) {
      if (checkingTokenType === 'access') {
        if (payload.tokenType === 'access') {
          if (process.env.ACCESS_TOKEN_SECRET) {
            jsonwebtoken.verify(jwt, process.env.ACCESS_TOKEN_SECRET);
          }
        } else {
          throw new Error('jwt invalid format');
        }
      } else if (checkingTokenType === 'refresh') {
        if (payload.tokenType === 'refresh') {
          if (process.env.REFRESH_TOKEN_SECRET) {
            jsonwebtoken.verify(jwt, process.env.REFRESH_TOKEN_SECRET);
          }
        } else {
          throw new Error('jwt invalid format');
        }
      }
    } else {
      throw new Error('jwt invalid format');
    }
  },

  decodeAccessToken(jwt: string): JwtPayload | null {
    this.checkToken(jwt, 'access');

    const payload: JwtPayload | null = jsonwebtoken.decode(jwt, {
      json: true,
    });

    return payload;
  },

  refreshAccessToken(refreshToken: string) {
    this.checkToken(refreshToken, 'refresh');

    const refreshPayload: JwtPayload | null = jsonwebtoken.decode(
      refreshToken,
      { json: true }
    );
    if (refreshPayload) {
      return this.createAccessToken(refreshPayload.userId);
    }
  },

  async getProfileInfo(userId: string): Promise<UserResponseDTO> {
    const profileInfo = await User.findById(userId).select(
      'username firstName lastName email dailyGoal'
    );
    return profileInfo as UserResponseDTO;
  },

  async updateDailyGoal(newDailyGoal: number, userId: string) {
    try {
      const user = await User.findById(userId);
      await user?.updateOne({
        dailyGoal: newDailyGoal,
      });

      const message = {
        message: 'Updated successful',
      };
      return message;
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message);
      }
    }
  },

  async exportUserData(userId: string): Promise<Buffer> {
    let fileContent = '';

    const getSessionsInfoInBrackets = (info: {
      sessionsAmount: number;
      spentTimeSeconds: number;
    }) => {
      return ` (${info.sessionsAmount} sessions, ${Math.floor(
        info.spentTimeSeconds / 60
      )} minutes, ${Math.floor(info.spentTimeSeconds / 3600)} hours)`;
    };

    const activityGroups = await activityGroupService.getActivityGroups(
      userId,
      true
    );
    for (const group of activityGroups || []) {
      if (group?.name) {
        fileContent = fileContent.concat(
          '# ',
          group.name,
          getSessionsInfoInBrackets({
            sessionsAmount: group.sessionsAmount,
            spentTimeSeconds: group.spentTimeSeconds,
          }),
          '\n'
        );

        const activities =
          group._id &&
          (await activityService.getActivitiesForActivityGroup(
            group._id.toString(),
            userId,
            true
          ));
        let activitiesContent = '';
        activities?.forEach((activity, index) => {
          if (activity?.name) {
            activitiesContent = activitiesContent.concat(
              `${index + 1}. `,
              activity.name,
              getSessionsInfoInBrackets({
                sessionsAmount: activity.sessionsAmount,
                spentTimeSeconds: activity.spentTimeSeconds,
              }),
              '\n'
            );
          }
        });

        fileContent = fileContent.concat(activitiesContent);
      }
    }

    const sessionsWithoutActivity = await sessionService.getSessions(
      { activity: undefined, completed: true },
      userId
    );
    const sessionsWithoutActivityAmount: number =
      sessionsWithoutActivity?.length ?? 0;
    let sessionsWithoutActivitySpentTimeSeconds: number = 0;
    sessionsWithoutActivity?.forEach((s) => {
      sessionsWithoutActivitySpentTimeSeconds += s.spentTimeSeconds;
    });

    const withoutActivityLine: string = `# Without activity ${getSessionsInfoInBrackets(
      {
        sessionsAmount: sessionsWithoutActivityAmount,
        spentTimeSeconds: sessionsWithoutActivitySpentTimeSeconds,
      }
    )}`;
    fileContent = fileContent.concat(withoutActivityLine);

    // TODO: в activity group считать только закомпличенные сессии
    // TODO: в actviity считать только закомличенные сесии

    const buffer = Buffer.from(fileContent, 'utf-8');

    return buffer;
  },
};
