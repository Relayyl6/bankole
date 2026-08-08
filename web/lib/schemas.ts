import { z } from "zod";

export enum Role {
  SENDER = "sender",
  AGENT = "agent",
}

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("A valid email address is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum([Role.SENDER, Role.AGENT], { message: "Role must be sender or agent." }),
  country: z.string().length(2, "Country must be an ISO 3166-1 alpha-2 code (e.g. GB, NG).").toUpperCase(),
  phoneNumber: z.string().optional(),
  // Agent specific fields
  companyName: z.string().optional(),
  yearsExperience: z.coerce.number().optional(),
  specialties: z.array(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("A valid email address is required."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

const optionalUrl = z
  .string()
  .optional()
  .refine(
    (val) => !val || val.trim() === "" || /^https?:\/\/.+/i.test(val.trim()),
    { message: "Must be a valid URL starting with http:// or https://" }
  );

const optionalAvatarUrl = z
  .string()
  .optional()
  .refine(
    (val) => !val || val.trim() === "" || /^https?:\/\/.+/i.test(val.trim()) || /^data:image\/.+/i.test(val.trim()),
    { message: "Must be a valid URL (http/https) or uploaded image" }
  );

const optionalCountry = z
  .string()
  .optional()
  .refine(
    (val) => !val || val.trim() === "" || val.trim().length === 2,
    { message: "Country must be a 2-letter ISO code (e.g. NG, GB, US)" }
  );

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").optional().or(z.literal("")),
  country: optionalCountry,
  bio: z.string().optional().or(z.literal("")),
  specialties: z.union([z.array(z.string()), z.string()]).optional(),
  yearsExperience: z.coerce.number().min(0, "Years of experience must be 0 or more").optional().nullable(),
  avatarUrl: optionalAvatarUrl,
  phoneNumber: z.string().optional().or(z.literal("")),
  currencyPreference: z.string().optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  portfolioUrl: optionalUrl,
  availabilityStatus: z.string().optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
