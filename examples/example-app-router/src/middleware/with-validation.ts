import type { NextRequest } from "next/server";
import { z } from "zod";

const validation =
  <T extends z.ZodSchema>(type: "body" | "query", schema: T) =>
  async (request: NextRequest & { validData: z.infer<T> }) => {
    if (type === "body" && request.body == null) {
      return new Response("Request must have a JSON body", {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const dataToValidate =
      type === "body" ? await request.json() : new URLSearchParams(request.url);

    const parsed = await schema.safeParseAsync(dataToValidate);
    if (!parsed.success) {
      return new Response(JSON.stringify(parsed.error.format()), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    request.validData = parsed.data;
  };

export { validation };
