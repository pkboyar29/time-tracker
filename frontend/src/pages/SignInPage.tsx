import { FC, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from '../axios';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { fetchProfileInfo } from '../redux/slices/userSlice';
import { isAuth } from '../utils/authHelpers';

import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';

interface SignInFields {
  username: string;
  password: string;
}

const SignInPage: FC = () => {
  const [modal, setModal] = useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

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
      const { data } = await axios.post('/users/sign-in', signInData);
      const { access, refresh } = data;
      Cookies.set('access', access);
      Cookies.set('refresh', refresh);

      dispatch(fetchProfileInfo());

      setModal(true);
    } catch (e) {
      if (e instanceof AxiosError) {
        handleErrorResponse(e);
      }
    }
  };

  const handleErrorResponse = (error: AxiosError) => {
    const errorMessage = error.response?.data;
    switch (errorMessage) {
      case 'User with this username doesnt exists':
        setError('username', {
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
    }
  };

  return (
    <div className="flex flex-col items-center mt-32">
      {modal && (
        <Modal
          title="Successful authorization!"
          onCloseModal={() => setModal(false)}
        >
          <Button
            onClick={() => {
              setModal(false);
              navigate('/timer');
            }}
          >
            Ok
          </Button>
        </Modal>
      )}

      <div className="text-xl text-red-500">Sign in</div>

      <form
        className="flex flex-col items-center gap-5 mt-3"
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
        <Button className="w-[175px]" type="submit">
          Sign in
        </Button>
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
