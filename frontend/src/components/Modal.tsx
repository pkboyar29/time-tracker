import { FC, ReactNode } from 'react'

interface ModalProps {
   children: ReactNode,
   title: string,
   onCloseModal: () => void
}

const Modal: FC<ModalProps> = ({ children, title, onCloseModal }) => {
   const handleOutsideClick = () => {
      onCloseModal()
   }

   const handleInsideClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation()
   }

   return (
      <div onClick={handleOutsideClick} className='w-full h-full top-0 left-0 z-50 fixed bg-gray-rgba flex items-center justify-center'>
         <div onClick={handleInsideClick} className='overflow-hidden bg-white rounded-md px-3 py-5 basis-1/3'>
            <div className='flex items-center justify-between mb-5'>
               <div>{title}</div>
               <button onClick={onCloseModal}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            {children}
         </div>
      </div>
   )
}

export default Modal