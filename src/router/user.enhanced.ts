import express from "express";

// Enhanced validation middleware
import {
  validateUserCreation,
  validateUserUpdate,
  validateUsersQuery,
  validateUserParams,
  sanitizeInput,
} from "../middleware/validation";

// Monitoring middleware
import {
  requestId,
  requestLogger,
  performanceMonitor,
  requestTimeout,
} from "../middleware/monitoring";

// Controllers
import { createUser, upsertUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";
import { updateUser } from "../controller/user/update";
import { deleteUser } from "../controller/user/delete";

// Authentication and authorization
import { authenticate, requireOwnership } from "../middleware/auth";

// Rate limiting
import { authRateLimit, generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

// Apply global middleware to all user routes
router.use(requestId);
router.use(requestLogger);
router.use(performanceMonitor);
router.use(requestTimeout(30000)); // 30-second timeout
router.use(sanitizeInput);

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 * @middleware authRateLimit, validateUserCreation
 */
router.post("/register", authRateLimit, validateUserCreation, createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination, search, and sorting
 * @access  Public (consider making private in production)
 * @middleware generalRateLimit, validateUsersQuery
 */
router.get("/", generalRateLimit, validateUsersQuery, getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Authentication required)
 * @middleware generalRateLimit, validateUserParams, authenticate
 */
router.get(
  "/:id",
  generalRateLimit,
  validateUserParams,
  authenticate,
  getUserById,
);

/**
 * @route   POST /api/users/:id
 * @desc    Create or update user (Upsert)
 * @access  Private (Authentication + Ownership required)
 * @middleware authenticate, requireOwnership, validateUserParams, validateUserCreation
 */
router.post(
  "/:id",
  authenticate,
  requireOwnership(),
  validateUserParams,
  validateUserCreation,
  upsertUser,
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Authentication + Ownership required)
 * @middleware authenticate, requireOwnership, validateUserParams, validateUserUpdate
 */
router.put(
  "/:id",
  authenticate,
  requireOwnership(),
  validateUserParams,
  validateUserUpdate,
  updateUser,
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Private (Authentication + Ownership required)
 * @middleware authenticate, requireOwnership, validateUserParams
 */
router.delete(
  "/:id",
  authenticate,
  requireOwnership(),
  validateUserParams,
  deleteUser,
);

export default router;
