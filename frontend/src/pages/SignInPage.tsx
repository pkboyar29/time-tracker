import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from '../axios';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';

interface SignInFields {
  username: string;
  password: string;
}

const SignInPage: FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    mode: 'onBlur',
  });

  const onSubmit = async (signInData: SignInFields) => {
    try {
      const { data } = await axios.post('/users/sign-in', signInData);
      const { access, refresh } = data;
      Cookies.set('access', access);
      Cookies.set('refresh', refresh);

      navigate('/timer');
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.response) {
          switch (e.response.data) {
            case 'User with this username doesnt exists':
              setError('username', {
                type: 'custom',
                message: e.response.data,
              });
              break;
            case 'Password incorrect':
              setError('password', {
                type: 'custom',
                message: e.response.data,
              });
              break;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center mt-32">
      <div className="text-xl text-red-500">Sign in</div>

      <form
        className="flex flex-col gap-5 mt-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          fieldName="username"
          placeHolder="Username"
          register={register}
          validationRules={{
            required: 'Field is required',
          }}
          inputProps={{
            maxLength: 20,
          }}
          errorMessage={
            typeof errors.username?.message === 'string'
              ? errors.username.message
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
        <Button type="submit">Sign in</Button>
        <a
          className="text-base text-center transition-all delay-100 cursor-pointer hover:text-red-500"
          onClick={() => navigate('/sign-up')}
        >
          Don't have account?
        </a>
      </form>
    </div>
  );
};

export default SignInPage;
