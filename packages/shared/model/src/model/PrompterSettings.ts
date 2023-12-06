/** Set by a user */
export interface PrompterSettings {
	fontSize: number // in percentage of viewport height

	mirrorHorizontally: boolean
	mirrorVertically: boolean

	focusPosition: 'start' | 'center' | 'end'
	showFocusPosition: boolean

	/** Adds padding between the edge of the screen and the text */
	marginHorizontal: number
	/** In percentage of viewport height */
	marginVertical: number
}
