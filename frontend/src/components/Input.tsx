import { FC, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';

import { Visibility, VisibilityOff } from '@mui/icons-material';

interface InputProps {
  fieldName: string;
  placeHolder: string;
  register: UseFormRegister<any>;
  validationRules?: Record<string, any>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  errorMessage: string;
  inputType?: 'text' | 'password';
  bg?: boolean;
  isTextArea?: boolean;
}

const Input: FC<InputProps> = ({
  fieldName,
  placeHolder,
  register,
  validationRules,
  inputProps,
  errorMessage,
  inputType = 'text',
  bg = false,
  isTextArea = false,
}) => {
  const [toggledType, setToggledType] = useState<'text' | 'password'>(
    inputType
  );

  const handleToggleTypeClick = () => {
    if (toggledType === 'text') {
      setToggledType('password');
    } else {
      setToggledType('text');
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-2">
      <div className="relative flex w-full">
        {!isTextArea ? (
          <input
            className={`w-full px-4 py-2 border border-solid rounded-lg focus:shadow-lg ${
              errorMessage && 'border-primary'
            } ${
              bg
                ? 'bg-backgroundLight dark:bg-surfaceDarkHover border-transparent dark:placeholder-textDark dark:text-textDark'
                : 'dark:text-textDark bg-transparent border-black dark:border-gray-500'
            }`}
            placeholder={placeHolder}
            {...register(fieldName, validationRules)}
            {...inputProps}
            type={toggledType}
          />
        ) : (
          <textarea
            className={`w-full h-20 px-4 py-2 border border-solid rounded-lg focus:shadow-lg ${
              errorMessage && 'border-primary'
            } ${
              bg
                ? 'bg-backgroundLight dark:bg-surfaceDarkHover border-transparent dark:placeholder-textDark dark:text-textDark'
                : 'dark:text-textDark bg-transparent border-black dark:border-gray-500'
            }`}
            placeholder={placeHolder}
            {...register(fieldName, validationRules)}
          />
        )}

        {inputType === 'password' && (
          <button
            type="button"
            className="absolute z-50 -translate-y-1/2 top-1/2 right-2"
            onClick={handleToggleTypeClick}
          >
            {toggledType === 'password' ? (
              <Visibility
                className="dark:fill-textDark"
                style={{ fontSize: '19px' }}
              />
            ) : (
              <VisibilityOff
                className="dark:fill-textDark"
                style={{ fontSize: '19px' }}
              />
            )}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="text-base text-primary">{errorMessage}</div>
      )}
    </div>
  );
};

export default Input;
