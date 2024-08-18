import { UserSignUpDTO, UserSignInDTO } from '../dto/user.dto';
import User from '../model/user.model';
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

  createAccessToken(userId: string): string {
    let accessToken: string = '';
    const accessPayload = {
      userId,
      tokenType: 'access',
    };
    if (process.env.ACCESS_TOKEN_SECRET) {
      accessToken = jsonwebtoken.sign(
        accessPayload,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: '30s', // pass 300 - 300 seconds, 5 min
        }
      );
    }

    return accessToken;
  },

  createRefreshToken(userId: string): string {
    let refreshToken: string = '';
    const refreshPayload = {
      userId,
      tokenType: 'refresh',
    };
    if (process.env.REFRESH_TOKEN_SECRET) {
      refreshToken = jsonwebtoken.sign(
        refreshPayload,
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: '5h', // pass days instead of hours
        }
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
};
