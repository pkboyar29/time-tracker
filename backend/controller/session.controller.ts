import { Router, Request, Response } from 'express'
import sessionService from '../service/session.service'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
   const data = await sessionService.getSessions()
   res.json(data)
})

router.post('/', async (req: Request, res: Response) => {
   const data = await sessionService.createSession(req.body)
   res.json(data)
})

router.put('/:id', async (req: Request, res: Response) => {
   const data = await sessionService.updateSession(req.params.id, req.body)
   res.json(data)
})

router.delete('/:id', async (req: Request, res: Response) => {
   const data = await sessionService.deleteSession(req.params.id)
   res.json(data)
})

export default router