import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt.ts'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'] //check authorization header for Bearer token
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const payload = await verifyToken(token) // Verify token and extract payload
    req.user = payload 
    next()  // Proceed to next middleware or route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}