import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

import { HttpError } from '../helpers/HttpError';
import { UserSignUpDTO, UserSignInDTO, UserResponseDTO } from '../dto/user.dto';
import activityGroupService from './activityGroup.service';
import activityService from './activity.service';
import sessionService from './session.service';
import User from '../model/user.model';
import ActivityGroup from '../model/activityGroup.model';
import Activity from '../model/activity.model';
import Session from '../model/session.model';
import SessionPart from '../model/sessionPart.model';

interface AuthorizeResponse {
  access: string;
  refresh: string;
}

const userService = {
  signUp,
  signIn,
  createTokens,
  createToken,
  createAccessToken,
  createRefreshToken,
  checkToken,
  decodeAccessToken,
  refreshAccessToken,
  getProfileInfo,
  updateDailyGoal,
  updateShowTimerInTitle,
  exportUserData,
  importFile,
};

async function signUp(
  userSignUpDTO: UserSignUpDTO
): Promise<AuthorizeResponse> {
  const users = await User.find({});
  users.forEach((user) => {
    if (user.username === userSignUpDTO.username) {
      throw new HttpError(400, 'Username must be unique');
    }

    if (user.email === userSignUpDTO.email) {
      throw new HttpError(400, 'Email must be unique');
    }
  });

  if (userSignUpDTO.password.length < 4) {
    throw new HttpError(400, 'password minimum length is 4 characters');
  }
  if (userSignUpDTO.password.length > 20) {
    throw new HttpError(400, 'password maximum length is 20 characters');
  }
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  const isValidFormat = passwordRegex.test(userSignUpDTO.password);
  if (!isValidFormat) {
    throw new HttpError(
      400,
      'password - must have one uppercase, one lowercase letters, one number and one special symbol (!@#$%^&*)'
    );
  }

  const salt = genSaltSync(10);
  const hashedPassword = hashSync(userSignUpDTO.password, salt);

  const newUser = new User({
    ...userSignUpDTO,
    dailyGoal: 10800, // 3 hours
    password: hashedPassword,
    createdDate: Date.now(),
  });

  const validationError = newUser.validateSync();
  if (validationError) {
    const fields = ['email', 'username'] as const;

    for (const field of fields) {
      const err = validationError.errors[field];
      if (err) {
        throw new HttpError(400, err.message);
      }
    }
  }

  const newUserWithId = await newUser.save();

  return userService.createTokens(newUserWithId.id);
}

async function signIn(
  userSignInDTO: UserSignInDTO
): Promise<AuthorizeResponse> {
  const user = await User.find({ username: userSignInDTO.username });
  if (!user[0]) {
    throw new HttpError(400, 'User with this username doesnt exists');
  }

  if (!compareSync(userSignInDTO.password, user[0].password)) {
    throw new HttpError(400, 'Password incorrect');
  }

  return userService.createTokens(user[0].id);
}

function createTokens(userId: string): AuthorizeResponse {
  return {
    access: userService.createAccessToken(userId),
    refresh: userService.createRefreshToken(userId),
  };
}

function createToken(
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
    expiresIn:
      tokenType === 'access'
        ? process.env.ACCESS_TOKEN_DURATION ?? '1800s'
        : process.env.REFRESH_TOKEN_DURATION ?? '40d',
  });
  return token;
}

function checkToken(jwt: string, checkingTokenType: 'access' | 'refresh') {
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
}

function createAccessToken(userId: string): string {
  let accessToken = userService.createToken(
    userId,
    'access',
    process.env.ACCESS_TOKEN_SECRET
      ? process.env.ACCESS_TOKEN_SECRET
      : 'default-access-secret'
  );

  return accessToken;
}

function createRefreshToken(userId: string): string {
  let refreshToken = userService.createToken(
    userId,
    'refresh',
    process.env.REFRESH_TOKEN_SECRET
      ? process.env.REFRESH_TOKEN_SECRET
      : 'default-refresh-secret'
  );

  return refreshToken;
}

function decodeAccessToken(jwt: string): JwtPayload | null {
  userService.checkToken(jwt, 'access');

  const payload: JwtPayload | null = jsonwebtoken.decode(jwt, {
    json: true,
  });

  return payload;
}

function refreshAccessToken(refreshToken: string): string | undefined {
  userService.checkToken(refreshToken, 'refresh');

  const refreshPayload: JwtPayload | null = jsonwebtoken.decode(refreshToken, {
    json: true,
  });
  if (refreshPayload) {
    return userService.createAccessToken(refreshPayload.userId);
  }
}

async function getProfileInfo(userId: string): Promise<UserResponseDTO> {
  const profileInfo = await User.findById(userId).select(
    'username email dailyGoal showTimerInTitle'
  ); // firstName lastName
  return profileInfo as UserResponseDTO;
}

async function updateDailyGoal(newDailyGoal: number, userId: string) {
  try {
    const user = await User.findById(userId);

    user!.dailyGoal = newDailyGoal;
    const validationError = user!.validateSync();
    if (validationError) {
      throw new HttpError(400, validationError.message);
    }

    user!.save();

    const message = {
      message: 'Updated successfully',
    };
    return message;
  } catch (e) {
    if (e instanceof Error || e instanceof HttpError) {
      throw e;
    }
  }
}

async function updateShowTimerInTitle(
  showTimerInTitle: boolean,
  userId: string
) {
  try {
    const user = await User.findById(userId);
    user!.showTimerInTitle = showTimerInTitle;
    const validationError = user!.validateSync();
    if (validationError) {
      throw new HttpError(400, validationError.message);
    }
    user!.save();

    const message = {
      message: 'Updated successfully',
    };
    return message;
  } catch (e) {
    if (e instanceof Error || e instanceof HttpError) {
      throw e;
    }
  }
}

async function exportUserData(userId: string): Promise<Buffer> {
  let fileContent = '';

  const getSessionsInfoInBrackets = (info: {
    sessionsAmount: number;
    spentTimeSeconds: number;
  }) => {
    return ` (${info.sessionsAmount} sessions, ${Math.floor(
      info.spentTimeSeconds / 60
    )} minutes, ${Math.floor(info.spentTimeSeconds / 3600)} hours)`;
  };

  const activityGroups = await activityGroupService.getDetailedActivityGroups({
    userId,
    onlyCompleted: true,
  });
  for (const group of activityGroups) {
    fileContent = fileContent.concat(
      '# ',
      group.name,
      getSessionsInfoInBrackets({
        sessionsAmount: group.sessionsAmount,
        spentTimeSeconds: group.spentTimeSeconds,
      }),
      '\n'
    );

    const activities = await activityService.getActivitiesForActivityGroup({
      activityGroupId: group._id.toString(),
      userId,
      detailed: true,
      onlyCompleted: true,
    });
    let activitiesContent = '';
    activities.forEach((activity, index) => {
      activitiesContent = activitiesContent.concat(
        `${index + 1}. `,
        activity.name,
        getSessionsInfoInBrackets({
          sessionsAmount: activity.sessionsAmount,
          spentTimeSeconds: activity.spentTimeSeconds,
        }),
        '\n'
      );
    });

    fileContent = fileContent.concat(activitiesContent);
  }

  const sessionsWithoutActivity = await sessionService.getSessions({
    filter: { activity: undefined, completed: true },
    userId,
  });
  const sessionsWithoutActivityAmount: number =
    sessionsWithoutActivity.length ?? 0;
  let sessionsWithoutActivitySpentTimeSeconds: number = 0;
  sessionsWithoutActivity.forEach((s) => {
    sessionsWithoutActivitySpentTimeSeconds += s.spentTimeSeconds;
  });

  const withoutActivityLine: string = `# Without activity ${getSessionsInfoInBrackets(
    {
      sessionsAmount: sessionsWithoutActivityAmount,
      spentTimeSeconds: sessionsWithoutActivitySpentTimeSeconds,
    }
  )}`;
  fileContent = fileContent.concat(withoutActivityLine);

  const buffer = Buffer.from(fileContent, 'utf-8');
  return buffer;
}

async function importFile(
  fileContent: string,
  sessionDuration: number,
  userId: string
): Promise<string> {
  const fileLines = fileContent.split('\n');

  let activeActivityGroup;
  let activeDate = new Date();

  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].length == 0) {
      continue;
    }

    // обрабатываем строки с группами активности
    if (fileLines[i].startsWith('# ')) {
      const groupLine = fileLines[i].substring(2).trim();

      const lastSpaceIndex = groupLine.lastIndexOf(' ');
      const name = groupLine.slice(0, lastSpaceIndex).trim();
      const dateString = groupLine.slice(lastSpaceIndex + 1).trim();

      // дополнительная проверка корректности даты
      activeDate = new Date(dateString);
      if (isNaN(activeDate.getTime())) {
        throw new Error(`Invalid date format in group line: "${fileLines[i]}"`);
      }

      activeActivityGroup = await new ActivityGroup({
        name,
        user: userId,
      }).save();

      continue;
    }

    // обрабатываем строки с активностями
    const cleanedActivityLine = fileLines[i].replace(/^\d+\.\s*/, '');

    const lastSpaceIndex = cleanedActivityLine.lastIndexOf(' ');
    const activityName = cleanedActivityLine.slice(0, lastSpaceIndex);
    const activitySessionCount = parseInt(
      cleanedActivityLine.slice(lastSpaceIndex + 1),
      10
    );

    const activity = await new Activity({
      name: activityName,
      activityGroup: activeActivityGroup,
      user: userId,
    }).save();

    const sessions = [];
    const sessionParts = [];
    for (let j = 0; j < activitySessionCount; j++) {
      const sessionId = new mongoose.Types.ObjectId(); // создаём id вручную

      sessions.push({
        _id: sessionId,
        totalTimeSeconds: sessionDuration,
        spentTimeSeconds: sessionDuration,
        activity: activity.id,
        completed: true,
        createdDate: activeDate,
        updatedDate: activeDate,
        user: userId,
      });

      sessionParts.push({
        spentTimeSeconds: sessionDuration,
        session: sessionId,
        user: userId,
        createdDate: activeDate,
      });
    }

    // bulk insert
    await Session.insertMany(sessions);
    await SessionPart.insertMany(sessionParts);
  }

  return 'Импорт успешен';
}

export default userService;
