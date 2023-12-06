import { ViewPortPosition } from './ViewPort.js'

/** Sent from the user control interface to the ViewPort */
export type ControllerMessage = {
	speed: number // unit (lines per second)?
	/** If set, viewport should jump to that position  */
	position?: ViewPortPosition
}
