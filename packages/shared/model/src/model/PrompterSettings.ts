import { z } from 'zod'

/** Set by a user */
export type PrompterSettings = z.infer<typeof PrompterSettingsSchema>

export const PrompterSettingsSchema = z.object({
	fontSize: z.number().min(0).max(100),

	mirrorHorizontally: z.boolean(),
	mirrorVertically: z.boolean(),

	focusPosition: z.union([z.literal('start'), z.literal('center'), z.literal('end')]),
	showFocusPosition: z.boolean(),

	/** Adds padding between the edge of the screen and the text */
	marginHorizontal: z.number().min(0).max(100),
	/** In percentage of viewport height */
	marginVertical: z.number().min(0).max(100),
})
