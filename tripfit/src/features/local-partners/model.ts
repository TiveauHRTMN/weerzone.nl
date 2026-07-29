import { z } from "zod";

export const localProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(2_000),
  regions: z.array(z.string().min(1)).min(1),
  languages: z.array(z.string().min(2).max(12)).min(1),
  whatsapp: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  pickupLocations: z.array(z.string().trim().min(1).max(120)).default([]),
  paymentMethods: z.array(z.string().trim().min(1).max(80)).default([]),
  cancellationPolicy: z.string().trim().max(2_000).optional(),
  commissionType: z.enum(["none", "percentage", "fixed_referral", "custom"]),
  commissionValue: z.number().nonnegative().optional(),
  contractPartyNotice: z
    .string()
    .trim()
    .min(1)
    .default(
      "Boeking, betaling, uitvoering en annulering verlopen rechtstreeks via de aanbieder.",
    ),
  verificationStatus: z.enum(["unverified", "verified", "stale", "disabled"]),
  lastVerifiedAt: z.iso.datetime().optional(),
  isPublished: z.boolean(),
}).superRefine((provider, context) => {
  if (provider.commissionType !== "none" && provider.commissionValue === undefined) {
    context.addIssue({
      code: "custom",
      path: ["commissionValue"],
      message: "Commission value is required for commercial agreements",
    });
  }
  if (provider.isPublished && provider.verificationStatus !== "verified") {
    context.addIssue({
      code: "custom",
      path: ["isPublished"],
      message: "Only verified local providers may be published",
    });
  }
});

export type LocalProvider = z.infer<typeof localProviderSchema>;

