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
import { useTranslation } from 'react-i18next';

import Input from '../components/common/Input';
import Button from '../components/common/Button';

interface SignInFields {
  email: string;
  password: string;
}

const SignInPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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
          message: t('signin.userNotFound'),
        });
        break;
      case 'Password incorrect':
        setError('password', {
          type: 'custom',
          message: t('signin.incorrectPassword'),
        });
        break;
      default:
        toast(t('serverErrors.signin'), {
          type: 'error',
        });
        break;
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-backgroundLight dark:bg-backgroundDark">
      <div className="w-full max-w-md px-5 py-10 mx-3 border shadow-xl md:px-10 rounded-2xl bg-white/5 dark:bg-black/40 backdrop-blur-md border-white/10">
        <h1 className="mb-8 text-2xl font-semibold text-center md:text-3xl text-primary dark:text-textDark">
          {t('signin.title')}
        </h1>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            fieldName="email"
            placeHolder={t('signin.emailPlaceholder')}
            register={register}
            validationRules={{
              required: t('signin.requiredError'),
            }}
            inputProps={{
              maxLength: 40,
            }}
            errorMessage={
              typeof errors.email?.message === 'string'
                ? errors.email.message
                : ''
            }
            enlarged={true}
          />

          <Input
            fieldName="password"
            placeHolder={t('signin.passwordPlaceholder')}
            register={register}
            validationRules={{
              required: t('signin.requiredError'),
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
            enlarged={true}
          />

          <Button className="text-[18px] py-3" type="submit">
            {t('signin.button')}
          </Button>

          <div className="mt-2 text-center">
            <a
              className="text-base transition cursor-pointer dark:text-textDark hover:text-primary dark:hover:text-primary"
              onClick={() => navigate('/sign-up')}
            >
              {t('signin.noAccount')}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
