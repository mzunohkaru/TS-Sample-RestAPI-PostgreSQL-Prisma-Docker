import { z } from "zod";

const RequestHeader = z.object({
  "content-type": z.string(),
  "x-api-key": z.string().min(1),
});

type RequestHeader = z.infer<typeof RequestHeader>;

export { RequestHeader };
