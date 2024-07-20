import { secret_key } from '../config/env/index.js'
import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')
  if (!token)
    return res
      .status(403)
      .json({ error: 'Erişim izni yok', message: 'Lütfen giriş yapın' })
  try {
    const decoded = jwt.verify(token, secret_key)
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(403).json({ error: 'Token geçersiz', message: error.message })
  }
}

export default verifyToken;
