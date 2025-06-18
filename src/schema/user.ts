import { z } from "zod";

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
  );

// Email validation schema
const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase()
  .transform((email) => email.trim());

// Name validation schema
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must not exceed 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  )
  .transform((name) => name.trim());

export const CreateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const UpdateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
});

export const LoginUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

// Auth token schemas
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const VerifyTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// Query parameter schemas
export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GetUserParamsSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

// Type exports
export type CreateUserType = z.infer<typeof CreateUserSchema>;
export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
export type LoginUserType = z.infer<typeof LoginUserSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type VerifyTokenType = z.infer<typeof VerifyTokenSchema>;
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type GetUserParamsType = z.infer<typeof GetUserParamsSchema>;
