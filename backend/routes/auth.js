const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { username, password } = req.body;

        // Find user by username or email
        const userResult = await query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: {
                    message: 'Invalid credentials',
                    status: 401
                }
            });
        }

        const user = userResult.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: {
                    message: 'Invalid credentials',
                    status: 401
                }
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return user info and token (exclude password)
        const { password_hash, ...userInfo } = user;
        
        res.json({
            message: 'Login successful',
            user: userInfo,
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Register endpoint (for admin use)
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['PM', 'PMI', 'Director', 'Team Member', 'Admin']).withMessage('Valid role is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { username, email, password, firstName, lastName, role, department } = req.body;

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: {
                    message: 'Username or email already exists',
                    status: 409
                }
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUserResult = await query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, department)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, username, email, first_name, last_name, role, department, created_at`,
            [username, email, passwordHash, firstName, lastName, role, department]
        );

        const newUser = newUserResult.rows[0];

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userResult = await query(
            'SELECT id, username, email, first_name, last_name, role, department, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    status: 404
                }
            });
        }

        res.json({
            user: userResult.rows[0]
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Generate new token
        const token = jwt.sign(
            { 
                userId: req.user.id,
                username: req.user.username,
                role: req.user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Token refreshed successfully',
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        message: 'Logout successful'
    });
});

module.exports = router;

