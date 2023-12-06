import { ProtectedString } from '../ProtectedString.js'
import { PartId } from './Part.js'
import { SegmentId } from './Segment.js'

/** Represents a view of the prompter, is streamed from the viewPort. This is always the last connected viewport. */
export interface ViewPort {
	_id: 'viewport'

	/**
	 * When a ViewPort starts up, it randomizes its instanceId and sends it to the Server.
	 * If the ViewPorts' instanceId is the "last one" it is in control.
	 * The ViewPort "in control" will stream its data to the server continuously.
	 * If a ViewPort is not "in control" it could listen to the ViewPort data and jump to the same position to stay in sync.
	 */
	instanceId: string

	/** The width of the viewport (as percentage of viewport height) */
	width: number

	/** Current position of the viewport */
	position: ViewPortPosition

	// last controller message?
}
/** Defines a position of the viewport */
export interface ViewPortPosition {
	/**
	 * The Part which the current offset is calculated from.
	 * `null` means "top of page"
	 */
	scrollOffsetTarget: SegmentId | PartId | TextMarkerId | null
	/** The position of the ViewPort  */
	scrollOffset: number
}
/** TBD, something used to mark places in ScriptContents */
export type TextMarkerId = ProtectedString<'TextMarkerId', string>
