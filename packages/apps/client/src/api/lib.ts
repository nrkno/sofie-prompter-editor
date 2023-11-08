import EventEmitter from 'eventemitter3'
import { Application, FeathersService } from '@feathersjs/feathers'
import { SocketService } from '@feathersjs/socketio-client'
import { ServiceTypes } from '@sofie-prompter-editor/shared-model'

export type FeathersTypedService<Methods extends EventEmitter> = Omit<
	FeathersService<Application<AddTypeToProperties<ServiceTypes, SocketService>, unknown>, Methods>,
	'on' | 'emit'
> &
	Pick<Methods, 'on' | 'emit'>

export type AddTypeToProperties<T, U> = {
	[K in keyof T]: U & T[K]
}
