import express, { Express } from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import * as helloWorldRouter from './controller/helloworld.controller'
import * as sessionRouter from './controller/session.controller'

const app: Express = express()
dotenv.config()

const MONGO_URL = process.env.MONGO_URL || ''
const PORT = process.env.PORT || 7000

mongoose.connect(MONGO_URL).then(() => {
   console.log('connection is successful')
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.use('/hello-world', helloWorldRouter.default)
app.use('/sessions', sessionRouter.default)

function startServer() {
   app.listen(PORT, () => {
      console.log(`[server]: Server is running at http://localhost:${PORT}`)
   })
}

startServer()