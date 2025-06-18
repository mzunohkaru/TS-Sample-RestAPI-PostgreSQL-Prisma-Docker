import { z } from "zod";

// Title validation schema
const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(255, "Title must not exceed 255 characters")
  .transform((title) => title.trim());

// Content validation schema
const contentSchema = z
  .string()
  .max(10000, "Content must not exceed 10,000 characters")
  .optional()
  .transform((content) => content?.trim());

export const CreatePostSchema = z.object({
  title: titleSchema,
  content: contentSchema,
});

export const UpdatePostSchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema,
});

// Query parameter schemas
export const GetPostsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  userId: z.string().uuid().optional(),
});

export const GetPostParamsSchema = z.object({
  id: z.coerce.number().int().positive("Invalid post ID"),
});

// Type exports
export type CreatePostType = z.infer<typeof CreatePostSchema>;
export type UpdatePostType = z.infer<typeof UpdatePostSchema>;
export type GetPostsQueryType = z.infer<typeof GetPostsQuerySchema>;
export type GetPostParamsType = z.infer<typeof GetPostParamsSchema>;
