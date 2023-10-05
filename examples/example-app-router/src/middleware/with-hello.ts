import type { NextRequest } from "next/server";

const hello = (request: NextRequest & { hello: string }) => {
  request.hello = "hello";
};

export { hello };
