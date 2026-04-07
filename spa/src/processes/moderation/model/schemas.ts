import { z } from "zod"
import {
  createFileImageRules,
  createFileVideoRules,
  createOptionalFileImageRules,
} from "@/shared/validations/zod.ts"

export const MediaInfoSchema = z.object({
  photo1: createOptionalFileImageRules(),
  photo2: createOptionalFileImageRules(),
  photo3: createOptionalFileImageRules(),
  videos: createFileVideoRules(),
})

export const VerificationInfoSchema = z.object({
  verification_photo: createFileImageRules(),
})

export type TMediaInfo = z.infer<typeof MediaInfoSchema>
export type TVerificationInfo = z.infer<typeof VerificationInfoSchema>

export const ModerationReplacementSchema = z.record(z.string(), z.instanceof(File).optional())

export type TModerationReplacement = z.infer<typeof ModerationReplacementSchema>
