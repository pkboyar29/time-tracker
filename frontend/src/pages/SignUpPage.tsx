import { FC } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';
import { useAppDispatch } from '../redux/store';
import { fetchProfileInfo } from '../api/userApi';
import { setUser } from '../redux/slices/userSlice';
import { isAuth } from '../helpers/authHelpers';
import { signUp } from '../api/userApi';
import { toast } from 'react-toastify';

import Input from '../components/common/Input';
import Button from '../components/common/Button';

interface SignUpFields {
  email: string;
  password: string;
}

const SignUpPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    mode: 'onBlur',
  });

  if (isAuth()) {
    return <Navigate to="/timer" />;
  }

  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{4,}$/;
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const onSubmit = async (signUpData: SignUpFields) => {
    try {
      const { access, refresh } = await signUp(signUpData);
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
      case 'Email must be unique':
        setError('email', {
          type: 'custom',
          message: errorMessage,
        });
        break;
      default:
        toast('A server error occurred while signing up', {
          type: 'error',
        });
        break;
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-backgroundLight dark:bg-backgroundDark">
      <div className="w-full max-w-md px-5 py-10 mx-3 border shadow-xl md:px-10 rounded-2xl bg-white/5 dark:bg-black/40 backdrop-blur-md border-white/10">
        <h1 className="mb-8 text-2xl font-semibold text-center md:text-3xl text-primary dark:text-textDark">
          Session Tracker. Sign up
        </h1>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            fieldName="email"
            placeHolder="Email"
            register={register}
            validationRules={{
              required: 'Field is required',
              minLength: { value: 6, message: 'Minimum symbols: 6' },
              maxLength: { value: 40, message: 'Maximum symbols: 40' },
              pattern: { value: emailRegex, message: 'Invalid email format' },
            }}
            inputProps={{ maxLength: 40 }}
            errorMessage={
              typeof errors.email?.message === 'string'
                ? errors.email.message
                : ''
            }
            enlarged={true}
          />

          <Input
            fieldName="password"
            placeHolder="Password"
            register={register}
            validationRules={{
              required: 'Field is required',
              minLength: { value: 4, message: 'Minimum symbols: 4' },
              maxLength: { value: 20, message: 'Maximum symbols: 20' },
              pattern: {
                value: passwordRegex,
                message:
                  'Must include uppercase, lowercase, number and special symbol',
              },
            }}
            inputProps={{ maxLength: 20 }}
            errorMessage={
              typeof errors.password?.message === 'string'
                ? errors.password.message
                : ''
            }
            inputType="password"
            enlarged={true}
          />

          <Button className="text-[18px] py-3" type="submit">
            Sign up
          </Button>

          <div className="mt-2 text-center">
            <a
              className="text-base transition cursor-pointer dark:text-textDark hover:text-primary dark:hover:text-primary"
              onClick={() => navigate('/sign-in')}
            >
              Already have an account?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
