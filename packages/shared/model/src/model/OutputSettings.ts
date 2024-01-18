import { z } from 'zod'
import { ZodProtectedStringOrNull } from './lib.js'
import { RundownPlaylistId } from './RundownPlaylist.js'

/** Set by a user */
export type OutputSettings = z.infer<typeof OutputSettingsSchema>

export const OutputSettingsSchema = z.object({
	// _id: z.literal(''),

	fontSize: z.number().min(0).max(100),

	mirrorHorizontally: z.boolean(),
	mirrorVertically: z.boolean(),

	focusPosition: z.union([z.literal('start'), z.literal('center'), z.literal('end')]),
	showFocusPosition: z.boolean(),

	/** Adds padding between the edge of the screen and the text */
	marginHorizontal: z.number().min(0).max(100),
	/** In percentage of viewport height */
	marginVertical: z.number().min(0).max(100),

	/** If set, defines the rundown that is to be displayed in the Output */
	activeRundownPlaylistId: ZodProtectedStringOrNull<RundownPlaylistId>(),
})
