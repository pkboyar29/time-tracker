import { Router, Request, Response } from 'express';
import userService from '../service/user.service';

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
      res.status(500).send(e.message);
    }
  }
});

export default router;
