import { z } from "zod";

export const discoverInputSchema = z.object({
  previousNames: z.array(z.string()).optional().default([]),
  searchName: z.string().optional(),
  skipQueue: z.boolean().optional(),
});

export type DiscoverInput = z.infer<typeof discoverInputSchema>;
