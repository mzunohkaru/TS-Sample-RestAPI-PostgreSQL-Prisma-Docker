import { z } from "zod";

const RequestHeaderSchema = z.object({
  "content-type": z.literal("application/json"),
  authorization: z
    .string()
    .min(1)
    .refine((val) => val.includes("bearer"), {
      message:
        "authorizationヘッダーには'Bearer'が含まれている必要があります。",
    }),
});

type RequestHeaderSchema = z.infer<typeof RequestHeaderSchema>;

export { RequestHeaderSchema };
