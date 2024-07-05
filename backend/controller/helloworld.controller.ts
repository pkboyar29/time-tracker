import { Router, Request, Response } from 'express'
import helloworldService from '../service/helloworld.service'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
   const data = await helloworldService.helloWorld()
   res.json(data)
})

export default router