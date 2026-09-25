import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Create new account with Email & Password
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate existing user with Email & Password
 */
router.post('/login', login);

export default router;
