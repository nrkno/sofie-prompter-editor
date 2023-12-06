import { z } from 'zod'
import { ProtectedString } from '../ProtectedString.js'
import { PartId } from './Part.js'
import { SegmentId } from './Segment.js'
import { ZodProtectedString } from './lib.js'

/** Represents a view of the prompter, is streamed from the viewPort. This is always the last connected viewport. */
export type ViewPort = z.infer<typeof ViewPortSchema>

/** Defines a position of the viewport */
export type ViewPortPosition = z.infer<typeof ViewPortPositionSchema>

export const ViewPortPositionSchema = z.object({
	/** The position of the ViewPort  */
	scrollOffset: z.number(),
	/**
	 * The Part which the current offset is calculated from.
	 * `null` means "top of page"
	 */
	scrollOffsetTarget: ZodProtectedString<SegmentId | PartId | TextMarkerId>().nullable(),
})

/** TBD, something used to mark places in ScriptContents */
export type TextMarkerId = ProtectedString<'TextMarkerId', string>

export const ViewPortSchema = z.object({
	_id: z.literal('viewport'),
	/**
	 * When a ViewPort starts up, it randomizes its instanceId and sends it to the Server.
	 * If the ViewPorts' instanceId is the "last one" it is in control.
	 * The ViewPort "in control" will stream its data to the server continuously.
	 * If a ViewPort is not "in control" it could listen to the ViewPort data and jump to the same position to stay in sync.
	 */
	instanceId: z.string(),

	/** The width of the viewport (as percentage of viewport height) */
	width: z.number(),
	/** Current position of the viewport */
	position: ViewPortPositionSchema,
})
