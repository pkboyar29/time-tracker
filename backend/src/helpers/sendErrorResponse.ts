import { Response } from 'express';
import { HttpError } from './HttpError';

export const sendErrorResponse = (error: any, response: Response) => {
  if (error instanceof HttpError) {
    response.status(error.status).send(error.message);
  } else if (error instanceof Error) {
    response.status(500).send(error.message);
  }
};
