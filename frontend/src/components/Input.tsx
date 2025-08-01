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
  bg?: 'white' | 'red';
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
  bg = 'white',
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
    <div className="flex flex-col items-center w-full">
      <div className="relative flex w-full">
        {!isTextArea ? (
          <input
            className={`w-full px-4 py-2 border border-solid rounded-lg focus:shadow-lg ${
              errorMessage && 'border-red-500'
            } ${
              bg === 'white'
                ? 'bg-transparent border-black'
                : 'bg-red-500 placeholder-white text-white'
            }`}
            placeholder={placeHolder}
            {...register(fieldName, validationRules)}
            {...inputProps}
            type={toggledType}
          />
        ) : (
          <textarea
            className={`w-full h-20 px-4 py-2 border border-solid rounded-lg focus:shadow-lg ${
              errorMessage && 'border-red-500'
            } ${
              bg === 'white'
                ? 'bg-white border-black'
                : 'bg-red-500 placeholder-white text-white'
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
              <Visibility style={{ fontSize: '19px' }} />
            ) : (
              <VisibilityOff style={{ fontSize: '19px' }} />
            )}
          </button>
        )}
      </div>
      {errorMessage && (
        <div className="pt-2 text-base text-red-500">{errorMessage}</div>
      )}
    </div>
  );
};

export default Input;
