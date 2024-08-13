import { UserSignUpDTO, UserSignInDTO } from '../dto/user.dto';
import User from '../model/user.model';
import { genSaltSync, hashSync, compareSync } from 'bcrypt';

export default {
  async signUp(userSignUpDTO: UserSignUpDTO) {
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

    await newUser.save();

    return 'asd';
  },
  async signIn(userSignInDTO: UserSignInDTO) {
    const user = await User.find({ username: userSignInDTO.username });
    if (!user[0]) {
      throw new Error('User with this username doesnt exists');
    }

    if (!compareSync(userSignInDTO.password, user[0].password)) {
      console.log('passwords dont match');
      throw new Error('Password incorrect');
    }

    return 'add';
  },
};
