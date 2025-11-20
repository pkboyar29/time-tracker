import { FC } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';
import { useAppDispatch } from '../redux/store';
import { fetchProfileInfo } from '../api/userApi';
import { setUser } from '../redux/slices/userSlice';
import { isAuth } from '../helpers/authHelpers';
import { signIn } from '../api/userApi';
import { toast } from 'react-toastify';

import Input from '../components/common/Input';
import Button from '../components/common/Button';

interface SignInFields {
  email: string;
  password: string;
}

const SignInPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    mode: 'onBlur',
  });

  if (isAuth()) {
    return <Navigate to="/timer" />;
  }

  const onSubmit = async (signInData: SignInFields) => {
    try {
      const { access, refresh } = await signIn(signInData);
      Cookies.set('access', access);
      Cookies.set('refresh', refresh, { expires: 5 });

      const userInfo = await fetchProfileInfo();
      dispatch(setUser(userInfo));
    } catch (e) {
      handleErrorResponse(e);
    }
  };

  const handleErrorResponse = (error: any) => {
    const errorMessage = error.response?.data;
    switch (errorMessage) {
      case 'User with this email doesnt exists':
        setError('email', {
          type: 'custom',
          message: errorMessage,
        });
        break;
      case 'Password incorrect':
        setError('password', {
          type: 'custom',
          message: errorMessage,
        });
        break;
      default:
        toast('A server error occurred while signing in', {
          type: 'error',
        });
        break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full mt-32">
      <div className="text-2xl text-primary dark:text-textDark">Sign in</div>

      <form
        className="flex flex-col items-center gap-5 mt-3 w-[225px]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          fieldName="email"
          placeHolder="Email"
          register={register}
          validationRules={{
            required: 'Field is required',
          }}
          inputProps={{
            maxLength: 40,
          }}
          errorMessage={
            typeof errors.email?.message === 'string'
              ? errors.email.message
              : ''
          }
        />

        <Input
          fieldName="password"
          placeHolder="Password"
          register={register}
          validationRules={{
            required: 'Field is required',
          }}
          inputProps={{
            maxLength: 20,
          }}
          errorMessage={
            typeof errors.password?.message === 'string'
              ? errors.password.message
              : ''
          }
          inputType="password"
        />

        <Button className="text-[16px]" type="submit">
          Sign in
        </Button>

        <a
          className="text-base text-center transition duration-300 cursor-pointer dark:text-textDark hover:text-primary dark:hover:text-primary"
          onClick={() => navigate('/sign-up')}
        >
          Don't have account?
        </a>
      </form>
    </div>
  );
};

export default SignInPage;
