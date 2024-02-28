import { z } from 'zod'
import { ControllerMessageSchema, TextMarkerId } from './ControllerMessage.js'
import { ZodProtectedStringOrNull } from './lib.js'
import { PartId, SegmentId } from './index.js'

/** Represents a view of the prompter, is streamed from the viewPort. This is always the last connected viewport. */
export type ViewPort = z.infer<typeof ViewPortSchema>

export const ViewPortStateSchema = z.object({
	offset: z.object({
		/**
		 * The prompter object/element which the current offset is calculated from.
		 * `null` means "top of page"
		 */
		target: ZodProtectedStringOrNull<SegmentId | PartId | TextMarkerId>(),

		/** The offset from the `target` (unit: viewportUnits) */
		offset: z.number(),
	}),

	/** When set, change the speed of scrolling */
	speed: z.number(),

	/**
	 * The offset to be applied over time (smoothly).
	 * Can be added to offset.offset for the eventual position.
	 */
	animatedOffset: z.number(),
})

export type ViewPortState = z.infer<typeof ViewPortStateSchema>

/** Defines a position of the viewport */
export type ViewPortLastKnownState = z.infer<typeof ViewPortLastKnownStateSchema>

export const ViewPortLastKnownStateSchema = z.object({
	state: ViewPortStateSchema,

	timestamp: z.number(),
})

/** The Primary Viewport will be continously updating this singular object */
export const ViewPortSchema = z.object({
	_id: z.literal(''),

	/** Aspect ratio of the viewport */
	aspectRatio: z.number(),

	/** Current position of the viewport */
	lastKnownState: ViewPortLastKnownStateSchema.nullable(),
})
