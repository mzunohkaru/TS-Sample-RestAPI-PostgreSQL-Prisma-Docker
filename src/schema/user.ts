import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).max(10),
  email: z.string().email(),
});

type updateUserSchema = z.infer<typeof updateUserSchema>;

export { updateUserSchema };
