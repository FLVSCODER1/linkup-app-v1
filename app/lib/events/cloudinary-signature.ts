import { createHash } from "node:crypto";

export function signCloudinaryParameters(
  parameters: Record<string, string | number | boolean>,
  apiSecret: string
): string {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}
