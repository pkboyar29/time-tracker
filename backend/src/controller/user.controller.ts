import { Router, Request, Response } from 'express';
import userService from '../service/user.service';
import { upload } from '../helpers/multer';
import { sendErrorResponse } from '../helpers/sendErrorResponse';
import { convertParamToBoolean } from '../helpers/convertParamToBoolean';

const router = Router();

router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const data = await userService.signUp(req.body);
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const data = await userService.signIn(req.body);
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const accessToken = userService.refreshAccessToken(req.body.refreshToken);
    res.status(200).json({ access: accessToken });
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const data = await userService.getProfileInfo(res.locals.userId);
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.put('/updateDailyGoal', async (req: Request, res: Response) => {
  try {
    const data = await userService.updateDailyGoal(
      req.body.newDailyGoal,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.put('/updateShowTimerInTitle', async (req: Request, res: Response) => {
  try {
    const data = await userService.updateShowTimerInTitle(
      convertParamToBoolean(req.body.showTimerInTitle),
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.get('/export', async (req: Request, res: Response) => {
  try {
    const buffer = await userService.exportUserData(res.locals.userId);

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Disposition', 'attachment; filename="userData.md"');
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(buffer);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.post(
  '/import',
  upload.single('file'),
  async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      return res.status(400).send('You didnt send file!');
    }

    const sessionDurationParam = req.body.sessionDuration;
    const sessionDuration = Number(sessionDurationParam);
    if (!sessionDurationParam) {
      return res.status(400).send('sessionsDuration body param is required!');
    }
    if (Number.isNaN(sessionDuration)) {
      return res
        .status(400)
        .send('sessionsDuration body param should be number!');
    }
    if (sessionDuration > 36000) {
      return res
        .status(400)
        .send(
          'sessionsDuration body param should be maximum 36000 seconds (10 hours)!'
        );
    }
    if (sessionDuration <= 0) {
      return res
        .status(400)
        .send('sessionsDuration body param should be minimum 1 second!');
    }

    const buffer = file.buffer;
    const fileContent = buffer.toString('utf-8');

    const responseMessage = await userService.importFile(
      fileContent,
      sessionDuration,
      res.locals.userId
    );

    res.status(200).send(responseMessage);
  }
);

export default router;
