import { z } from 'zod'
import { ControllerMessageSchema } from './ControllerMessage.js'

/** Represents a view of the prompter, is streamed from the viewPort. This is always the last connected viewport. */
export type ViewPort = z.infer<typeof ViewPortSchema>

/** Defines a position of the viewport */
export type ViewPortLastKnownState = z.infer<typeof ViewPortLastKnownStateSchema>

export const ViewPortLastKnownStateSchema = z.object({
	controllerMessage: ControllerMessageSchema,

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
