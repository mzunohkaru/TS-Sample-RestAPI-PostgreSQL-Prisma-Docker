import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1).max(10),
  email: z.string().email(),
  password: z.string().min(4).max(20),
});

type CreateUserSchema = z.infer<typeof CreateUserSchema>;

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(10),
  email: z.string().email(),
});

type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(20),
});

type LoginUserSchema = z.infer<typeof LoginUserSchema>;

export { CreateUserSchema, UpdateUserSchema, LoginUserSchema };
