import { z } from "zod";

export const discoverInputSchema = z.object({
  previousNames: z.array(z.string()).optional().default([]),
});

export type DiscoverInput = z.infer<typeof discoverInputSchema>;
