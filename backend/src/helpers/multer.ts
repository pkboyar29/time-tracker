import multer from 'multer';

const memoryStorage = multer.memoryStorage();
export const memoryUpload = multer({ storage: memoryStorage });
