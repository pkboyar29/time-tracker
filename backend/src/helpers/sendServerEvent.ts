import { Response } from 'express';

export const sendServerEvent = (
  res: Response,
  eventName: string,
  data: any,
) => {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`); // двойной перенос строки завершает событие
};
