import { z } from 'zod'

/** Set by a user */
export type SystemStatus = z.infer<typeof SystemStatusSchema>

export const SystemStatusSchema = z.object({
	/**
	 * If set, there is a message that should be displayed to the user.
	 * (This message summarizes the values of the other fields in SystemStatus)
	 */
	statusMessage: z.string().nullable(),

	/** Defines wether we're connected to core or not. */
	connectedToCore: z.boolean(),
})
