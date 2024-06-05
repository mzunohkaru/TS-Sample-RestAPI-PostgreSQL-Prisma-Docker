import { z } from "zod";

const RequestAuthHeaderSchema = z.object({
  "content-type": z.literal("application/json"),
  authorization: z
    .string()
    .min(1)
    .refine((val) => val.includes("bearer"), {
      message:
        "authorizationヘッダーには'Bearer'が含まれている必要があります。",
    }),
});

type RequestAuthHeaderSchema = z.infer<typeof RequestAuthHeaderSchema>;

export { RequestAuthHeaderSchema };
