import { FC, ReactNode } from 'react'

interface ButtonProps {
   children: ReactNode,
   onClick: () => void
}

const Button: FC<ButtonProps> = ({ children, onClick }: ButtonProps) => {
   return (
      <button onClick={onClick} className='p-3 bg-red-500 text-white rounded-xl'>{children}</button>
   )
}

export default Button