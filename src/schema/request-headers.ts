import { z } from "zod";

const RequestAuthHeaderSchema = z.object({
  "content-type": z.literal("application/json"),
  authorization: z
    .string()
    .min(1)
    .refine((val) => val.includes("Bearer"), {
      message:
        "authorizationヘッダーには'Bearer'が含まれている必要があります。",
    }),
});

type RequestAuthHeaderType = z.infer<typeof RequestAuthHeaderSchema>;

export { RequestAuthHeaderSchema, RequestAuthHeaderType };
