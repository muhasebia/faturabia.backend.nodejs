import express from 'express'
import authRouter from './authRoute.js'
import customerRouter from './customerRoute.js'
import productRouter from './productRoute.js'
import invoiceRouter from './invoiceRoute.js'
import reportsRouter from './reports.js'
import dashboardRouter from './dashboardRoute.js'


const router = express.Router()

router.use('/auth', authRouter)
router.use('/customer', customerRouter)
router.use('/product', productRouter)
router.use('/invoices', invoiceRouter)
router.use('/reports', reportsRouter)
router.use('/dashboard', dashboardRouter)
router.get('/', (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏',
        version: '1.0.3'
    })
}
)


export default router;
