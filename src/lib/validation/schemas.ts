/**
 * Zod validation schemas for API input sanitization.
 * Prevents injection, DoS via unbounded parameters, and malformed input.
 */
import { z } from "zod";

/** UUID v4 format — validates CKAN resource IDs */
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Schema for /api/ckan/search query parameters */
export const ckanSearchSchema = z.object({
  resource_id: z.string().regex(uuidPattern, "Must be a valid UUID"),
  q: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).max(100000).optional(),
  filters: z
    .string()
    .max(2000)
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      let parsed: unknown;
      try {
        parsed = JSON.parse(val);
      } catch {
        throw new Error("Invalid JSON in filters");
      }
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        throw new Error("filters must be a JSON object");
      }
      return parsed as Record<string, unknown>;
    }),
  fields: z
    .string()
    .max(1000)
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    ),
  sort: z
    .string()
    .max(500)
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    ),
});

/** Schema for city code path parameters */
export const cityCodeSchema = z.coerce.number().int().min(0).max(99999);
