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
  isTextArea?: boolean;
  enlarged?: boolean;
}

const Input: FC<InputProps> = ({
  fieldName,
  placeHolder,
  register,
  validationRules,
  inputProps,
  errorMessage,
  inputType = 'text',
  isTextArea = false,
  enlarged = false,
}) => {
  const [toggledType, setToggledType] = useState<'text' | 'password'>(
    inputType,
  );

  return (
    <div className="flex flex-col w-full">
      <div className="relative">
        {!isTextArea ? (
          <input
            className={`
            w-full px-4 
            ${enlarged ? 'py-3 text-[17px]' : 'py-2'} 
            rounded-xl border border-gray-500 
            dark:text-textDark bg-[#FAFAFA] dark:bg-white/10 
            focus:ring-2 focus:ring-primary focus:border-primary
            transition
            ${errorMessage && 'border-primary'}
          `}
            placeholder={placeHolder}
            {...register(fieldName, validationRules)}
            {...inputProps}
            type={toggledType}
          />
        ) : (
          <textarea
            className={`w-full h-24 px-4 ${
              enlarged ? 'py-3 text-[17px]' : 'py-2'
            } rounded-xl border border-gray-500 
            dark:text-textDark bg-[#FAFAFA] dark:bg-white/10 
            focus:ring-2 focus:ring-primary focus:border-primary
            transition
            ${errorMessage && 'border-primary'}`}
            placeholder={placeHolder}
            {...register(fieldName, validationRules)}
          />
        )}

        {inputType === 'password' && (
          <button
            type="button"
            className="absolute -translate-y-1/2 right-3 top-1/2"
            onClick={() =>
              setToggledType(toggledType === 'text' ? 'password' : 'text')
            }
          >
            {toggledType === 'password' ? (
              <Visibility className="dark:fill-textDark" fontSize="small" />
            ) : (
              <VisibilityOff className="dark:fill-textDark" fontSize="small" />
            )}
          </button>
        )}
      </div>

      <div className="min-h-[20px] mt-1 text-sm text-primary">
        {errorMessage}
      </div>
    </div>
  );
};

export default Input;
