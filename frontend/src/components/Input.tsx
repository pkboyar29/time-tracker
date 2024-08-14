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
}

const Input: FC<InputProps> = ({
  fieldName,
  placeHolder,
  register,
  validationRules,
  inputProps,
  errorMessage,
  inputType = 'text',
}) => {
  const [toggledType, setToggledType] = useState<'text' | 'password'>(
    inputType
  );

  const toggleType = () => {
    if (toggledType === 'text') {
      setToggledType('password');
    } else {
      setToggledType('text');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex">
        <input
          className={`px-2 py-1 border border-black border-solid rounded-lg focus:shadow-lg ${
            errorMessage && 'border-red-500'
          }`}
          placeholder={placeHolder}
          {...register(fieldName, validationRules)}
          {...inputProps}
          type={toggledType}
        />
        {inputType === 'password' && (
          <button
            type="button"
            className="absolute z-50 top-[3.75px] right-2"
            onClick={toggleType}
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
