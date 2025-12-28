import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <h1 className="font-bold tracking-tight select-none text-primary text-9xl">
        404
      </h1>

      <h2 className="mt-2 text-3xl font-semibold dark:text-textDark">
        {t('notFoundPage.title')}
      </h2>

      <p className="max-w-md mt-4 text-gray-500 dark:text-gray-400">
        {t('notFoundPage.descr')}
      </p>

      <Link
        to="/"
        className="inline-block px-6 py-3 mt-8 font-medium text-white transition-all duration-200 bg-primary rounded-xl hover:bg-primaryHover active:scale-95"
      >
        {t('notFoundPage.goHome')}
      </Link>
    </div>
  );
};

export default NotFoundPage;
