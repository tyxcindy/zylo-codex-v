import { z } from "zod";

import { isSafeExternalUrl, sanitizePlainText } from "@/lib/security";

const sanitizedText = z
  .string()
  .transform((value) => sanitizePlainText(value));

const emailSchema = z
  .string()
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(12, "Passwords must be at least 12 characters.")
  .max(128, "Passwords must be 128 characters or less.")
  .regex(/[a-z]/, "Passwords must include a lowercase letter.")
  .regex(/[A-Z]/, "Passwords must include an uppercase letter.")
  .regex(/\d/, "Passwords must include a number.");

export const importSchema = z.object({
  type: z.enum(["url", "text", "image"]),
  content: sanitizedText
    .pipe(
      z
        .string()
        .min(12, "Add enough detail for Zylo to extract places.")
        .max(5000, "Keep imports under 5,000 characters.")
    ),
  destinationHint: sanitizedText.pipe(z.string().max(80)).optional()
}).superRefine((value, ctx) => {
  if (value.type === "url" && !isSafeExternalUrl(value.content)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only public http(s) URLs are allowed."
    });
  }
});

export const saveStateSchema = z.object({
  isVisited: z.boolean().optional(),
  isInTrip: z.boolean().optional()
});

export const tripSchema = z.object({
  destinationId: z.string().uuid("Select a valid destination."),
  title: sanitizedText.pipe(z.string().min(3).max(80)),
  vibe: sanitizedText.pipe(z.string().min(3).max(140)),
  travelers: z.number().int().min(1).max(12)
});

export const tripGenerateSchema = z.object({
  prompt: sanitizedText.pipe(z.string().min(12).max(600))
});

export const chatSchema = z.object({
  tripId: z.string().uuid().optional(),
  message: sanitizedText.pipe(z.string().min(6).max(1200)),
  imageHint: sanitizedText.pipe(z.string().max(120)).optional()
});

export const authSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.")
});

export const authSignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: sanitizedText.pipe(z.string().min(2).max(80))
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

export const passwordUpdateSchema = z.object({
  password: passwordSchema
});

export function parseWithSchema<T>(
  schema: z.ZodSchema<T>,
  payload: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message)
    };
  }

  return { success: true, data: result.data };
}
