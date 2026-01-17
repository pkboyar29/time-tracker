import { Router, Request, Response } from 'express';
import userService from '../service/user.service';
import { memoryUpload } from '../helpers/multer';
import { sendErrorResponse } from '../helpers/sendErrorResponse';
import { convertParamToBoolean } from '../helpers/convertParamToBoolean';
import { isValidTimeZone } from '../helpers/isValidTimeZone';

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
    const { tz } = req.query;
    if (!tz) {
      res.status(400).send('tz query param is required');
      return;
    }
    if (!isValidTimeZone(tz as string)) {
      res.status(400).send('timezone format is invalid');
      return;
    }

    const data = await userService.getProfileInfo(
      res.locals.userId,
      tz as string
    );
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
  memoryUpload.single('file'),
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

// TODO: обрабатывать ошибку, когда отправляем несколько файлов
router.post(
  '/audio/uploadAudio',
  memoryUpload.single('audio'),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send('You didnt send file!');
    }

    // application/octet-stream - m4r
    // audio/ogg - ogg
    // audio/mpeg - mp3
    if (
      !['application/octet-stream', 'audio/ogg', 'audio/mpeg'].includes(
        file.mimetype
      )
    ) {
      return res
        .status(400)
        .send('audio file should be mp3, m4r or ogg format');
    }

    const THREE_MB_BYTES = 3_000_000;
    if (file.size > THREE_MB_BYTES) {
      return res.status(400).send('audio file max size is 3 megabytes');
    }

    const mm = await import('music-metadata');
    const metadata = await mm.parseBuffer(file.buffer);
    if (metadata.format.duration && metadata.format.duration > 45) {
      return res.status(400).send('audio file max duration is 45 seconds');
    }

    try {
      const data = await userService.uploadAudio(
        file.originalname,
        file.buffer,
        res.locals.userId
      );

      res.status(200).json(data);
    } catch (e) {
      sendErrorResponse(e, res);
    }
  }
);

router.get('/audio/:id', async (req: Request, res: Response) => {
  try {
    const { buffer, fileName } = await userService.getAudioFile(
      req.params.id,
      res.locals.userId
    );

    const fileNameArray = fileName.split('.');
    const fileExtension = fileNameArray[fileNameArray.length - 1];
    if (fileExtension === 'mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (fileExtension === 'm4r') {
      res.setHeader('Content-Type', 'audio/mp4');
    } else if (fileExtension === 'ogg') {
      res.setHeader('Content-Type', 'audio/ogg');
    }

    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.status(200).send(buffer);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.put('/audio/:id', async (req: Request, res: Response) => {
  try {
    const responseMessage = await userService.updateAudioCurrent(
      req.params.id,
      res.locals.userId,
      convertParamToBoolean(req.body.current)
    );

    res.status(200).send(responseMessage);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.delete('/audio/:id', async (req: Request, res: Response) => {
  try {
    const responseMessage = await userService.deleteAudio(
      req.params.id,
      res.locals.userId
    );

    res.status(200).send(responseMessage);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

export default router;
