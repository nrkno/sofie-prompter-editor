import { Application, FeathersService, Service, HookContext } from '@feathersjs/feathers'
import { ServiceTypes } from '@sofie-prompter-editor/shared-model'

/** How long to wait before unsubscribing [ms] */
export const UNSUBSCRIBE_DELAY = 5000

export type CustomFeathersService<Methods, Events> = Omit<FS<Methods>, 'publish'> & {
	// Replace the publish method with our own, in order to get strict event types:
	// Note: this publish is based on @feathersjs/feathers -> ServiceAddons.publish (FS['publish'])
	// publish: (event: keyof Events, publisher: Parameters<FS<Methods>['publish']>[1]) => ReturnType<FS<Methods>['publish']>
	publish: <Event extends keyof Events>(
		event: Event,
		publisher: (
			data: Events[Event] extends [any] ? Events[Event][0] : void,
			context: HookContext<A, Methods>
		) => ReturnType<Parameters<FS['publish']>[1]>
	) => ReturnType<FS<Methods>['publish']>
}
type A = Application<ServiceTypes, any>
type FS<S = Service> = FeathersService<A, S>
