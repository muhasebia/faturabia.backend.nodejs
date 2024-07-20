import express from 'express'
import authRouter from './authRoute.js'
import customerRouter from './customerRoute.js'
import productRouter from './productRoute.js'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/customer', customerRouter)
router.use('/product', productRouter)

export default router;
