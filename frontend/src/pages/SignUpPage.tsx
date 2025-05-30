import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from '../axios';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAppDispatch } from '../redux/store';
import { fetchProfileInfo } from '../redux/slices/userSlice';

import Modal from '../components/modals/Modal';
import Input from '../components/Input';
import Button from '../components/Button';

interface SignUpFields {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

const SignUpPage: FC = () => {
  const [modal, setModal] = useState<boolean>(false);

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

  const onlyLettersRegex = /^[A-Za-zА-Яа-яЁё]+$/;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]+$/;
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const onSubmit = async (signUpData: SignUpFields) => {
    try {
      const { data } = await axios.post('/users/sign-up', signUpData);
      const { access, refresh } = data;
      Cookies.set('access', access);
      Cookies.set('refresh', refresh, { expires: 5 });

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
      case 'Username must be unique':
        setError('username', {
          type: 'custom',
          message: errorMessage,
        });
        break;
      case 'Email must be unique':
        setError('email', {
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
          title="Successful registration!"
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

      <div className="text-xl text-red-500">Sign up</div>

      <form
        className="flex flex-col items-center gap-5 mt-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          fieldName="firstName"
          placeHolder="First Name"
          register={register}
          validationRules={{
            required: 'Field is required',
            minLength: {
              value: 4,
              message: 'Minimum symbols: 4',
            },
            maxLength: {
              value: 20,
              message: 'Maximum symbols: 20',
            },
            pattern: {
              value: onlyLettersRegex,
              message: 'Only letters allowed',
            },
          }}
          inputProps={{
            maxLength: 20,
          }}
          errorMessage={
            typeof errors.firstName?.message === 'string'
              ? errors.firstName.message
              : ''
          }
        />
        <Input
          fieldName="lastName"
          placeHolder="Last Name"
          register={register}
          validationRules={{
            required: 'Field is required',
            minLength: {
              value: 4,
              message: 'Minimum symbols: 4',
            },
            maxLength: {
              value: 20,
              message: 'Maximum symbols: 20',
            },
            pattern: {
              value: onlyLettersRegex,
              message: 'Only letters allowed',
            },
          }}
          inputProps={{
            maxLength: 20,
          }}
          errorMessage={
            typeof errors.lastName?.message === 'string'
              ? errors.lastName.message
              : ''
          }
        />
        <Input
          fieldName="email"
          placeHolder="Email"
          register={register}
          validationRules={{
            required: 'Field is required',
            minLength: {
              value: 6,
              message: 'Minimum symbols: 6',
            },
            maxLength: {
              value: 40,
              message: 'Maximum symbols: 40',
            },
            pattern: {
              value: emailRegex,
              message: 'Ivalid email format',
            },
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
          fieldName="username"
          placeHolder="Username"
          register={register}
          validationRules={{
            required: 'Field is required',
            minLength: {
              value: 4,
              message: 'Minimum symbols: 4',
            },
            maxLength: {
              value: 20,
              message: 'Maximum symbols: 20',
            },
            pattern: {
              value: usernameRegex,
              message:
                'Only latin letters and numbers. Should start from latin letter.',
            },
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
            minLength: {
              value: 4,
              message: 'Minimum symbols: 4',
            },
            maxLength: {
              value: 20,
              message: 'Maximum symbols: 20',
            },
            pattern: {
              value: passwordRegex,
              message:
                'Must have one uppercase, one lowercase letters, one number and one special symbol (!@#$%^&*)',
            },
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
          Sign up
        </Button>
        <a
          className="text-base text-center transition-all delay-100 cursor-pointer hover:text-red-500"
          onClick={() => navigate('/sign-in')}
        >
          Already sign up?
        </a>
      </form>
    </div>
  );
};

export default SignUpPage;
