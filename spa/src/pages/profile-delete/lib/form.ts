import { z } from "zod"

export const Schema = z.object({
  reasons: z.array(z.string()).max(6),
  note: z.string().max(500, { error: "validation.description_long_120" }).optional(),
})

export type TSchema = z.infer<typeof Schema>
