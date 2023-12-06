import React from 'react'
import { APIConnection } from './ApiConnection'
import { assertType } from '@sofie-prompter-editor/shared-lib'
import { RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'

const api = new APIConnection()
api.on('connected', () => console.log('connected'))
api.on('disconnected', () => console.log('disconnected'))

api.playlist.on('tmpPong', (payload) => {
	assertType<string>(payload)
	console.log(`Got a tmpPong message: "${payload}"`)
})
api.playlist.on('created', (payload) => {
	assertType<RundownPlaylist>(payload)
	console.log(`playlist created: "${JSON.stringify(payload)}"`)
})
// api.playlist.on('patched', (payload) => {
// 	assertType<Partial<RundownPlaylist>>(payload)
// 	console.log(`playlist patched: "${JSON.stringify(payload)}"`)
// })
api.playlist.on('updated', (payload) => {
	assertType<RundownPlaylist>(payload)
	console.log(`playlist updated: "${JSON.stringify(payload)}"`)
})
api.playlist.on('removed', (id) => {
	assertType<RundownPlaylistId>(id)
	console.log(`playlist removed: "${id}"`)
})
api.example.on('pongGeneric', (payload) => {
	assertType<string>(payload)
	console.log(`Got a pongGeneric message: "${payload}"`)
})
api.example.on('pongCategory', (message) => {
	console.log(`Got a pongCategory "${message.category}" message: "${message.payload}"`)
})

export const APIConnectionContext = React.createContext<APIConnection>(api)
