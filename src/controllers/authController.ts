import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt.ts'
import { db } from '../db/connection.ts'
import { users } from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { comparePassword } from '../utils/passwords.ts'

// -- Authentication Controller
// Handles user registration and login logic

// -- Registration Controller
// Validates input, hashes password, creates user, and returns JWT token
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body

    // Hash password with configurable rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,  // Store hash, not plain text!
        firstName,
        lastName,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })

    // Generate JWT for auto-login
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    })

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      token,  // User is logged in immediately
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

// -- Login Controller
// Validates credentials and returns JWT token on success
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Step 1: Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email))

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Step 2: Verify password
    //const isValidPassword = await bcrypt.compare(password, user.password) <-- Alternative direct bcrypt usage
    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Step 3: Generate JWT token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    // Step 4: Return user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
}