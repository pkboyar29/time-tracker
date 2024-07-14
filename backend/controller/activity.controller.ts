import { Router, Request, Response } from 'express'
import activityService from '../service/activity.service'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
   const data = await activityService.getActivities()
   res.json(data)
})

router.post('/', async (req: Request, res: Response) => {
   const data = await activityService.createActivity(req.body)
   res.json(data)
})

router.put('/:id', async (req: Request, res: Response) => {
   const data = await activityService.updateActivity(req.params.id, req.body)
   res.json(data)
})

router.delete('/:id', async (req: Request, res: Response) => {
   const data = await activityService.deleteActivity(req.params.id)
   res.json(data)
})

export default router