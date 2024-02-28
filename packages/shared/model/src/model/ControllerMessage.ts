import { z } from 'zod'
import { ZodProtectedStringOrNull } from './lib.js'
import { SegmentId } from './Segment.js'
import { PartId } from './Part.js'
import { ProtectedString } from '../ProtectedString.js'

/** Defines a position of the viewport */
export type ControllerMessage = z.infer<typeof ControllerMessageSchema>

export const ControllerMessageSchema = z.object({
	/** When set, the Output should jump to that offset */
	offset: z
		.object({
			/**
			 * The prompter object/element which the current offset is calculated from.
			 * `null` means "top of page"
			 */
			target: ZodProtectedStringOrNull<SegmentId | PartId | TextMarkerId>(),

			/** The offset from the `target` (unit: viewportUnits) */
			offset: z.number(),
		})
		.optional(),

	/** When set, change the speed of scrolling */
	speed: z.number().optional(),

	/** When set, make the prompter jump by a distance */
	jumpBy: z.number().optional(),

})

/** TBD, something used to mark places in ScriptContents */
export type TextMarkerId = ProtectedString<'TextMarkerId', string>
