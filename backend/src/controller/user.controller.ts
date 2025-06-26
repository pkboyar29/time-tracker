import { Router, Request, Response } from 'express';
import userService from '../service/user.service';
import { upload } from '../helpers/multer';

const router = Router();

router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const data = await userService.signUp(req.body);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message === 'Username must be unique' ||
        e.message === 'Email must be unique'
      ) {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const data = await userService.signIn(req.body);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message === 'User with this username doesnt exists' ||
        e.message === 'Password incorrect'
      ) {
        res.status(401).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const accessToken = userService.refreshAccessToken(req.body.refreshToken);
    res.status(200).json({ access: accessToken });
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const data = await userService.getProfileInfo(res.locals.userId);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
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
    if (e instanceof Error) {
      if (
        e.message == 'Daily goal should be set between 1 minute and 24 hours'
      ) {
        res.status(400).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
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
    console.log(e);
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
