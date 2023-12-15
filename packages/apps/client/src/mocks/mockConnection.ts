import EventEmitter from 'eventemitter3'
import {
	Part,
	PartDisplayType,
	PartId,
	Rundown,
	RundownPlaylist,
	RundownPlaylistId,
	Segment,
	SegmentId,
	protectString,
} from '@sofie-prompter-editor/shared-model'

const PLAYLIST_ID_0 = generateId('playlist')
const RUNDOWN_ID_0_0 = generateId('rundown')
const SEGMENT_ID_0_0 = generateId('segment')
const PART_ID_0_0_0 = generateId('part')
const PART_ID_0_0_1 = generateId('part')
const PART_ID_0_0_2 = generateId('part')
const PART_ID_0_0_3 = generateId('part')

const SEGMENT_ID_0_1 = generateId('segment')
const PART_ID_0_1_0 = generateId('part')
const PART_ID_0_1_1 = generateId('part')

const SEGMENT_ID_0_2 = generateId('segment')
const PART_ID_0_2_0 = generateId('part')
const PART_ID_0_2_1 = generateId('part')

const SEGMENT_ID_0_3 = generateId('segment')
const PART_ID_0_3_0 = generateId('part')
const PART_ID_0_3_1 = generateId('part')
const PART_ID_0_3_2 = generateId('part')

const PLAYLIST_ID_1 = generateId('playlist')

const START_TIME = Date.now()

type Handler<T = object> = (arg: T) => void

type EventTypes = 'created' | 'changed' | 'removed'
type Services = 'playlist' | 'rundown' | 'segment' | 'part'

type Events = `${Services}_${EventTypes}`

export class MockConnection extends EventEmitter<Events> {
	private _playlists = [
		{
			_id: PLAYLIST_ID_0,
			created: START_TIME,
			isActive: false,
			label: 'Playlist 0',
			modified: START_TIME,
			rehearsal: false,
			startedPlayback: START_TIME,
			loaded: true,
		},
		{
			_id: PLAYLIST_ID_1,
			created: START_TIME,
			isActive: false,
			label: 'Playlist 1',
			modified: START_TIME,
			rehearsal: false,
			startedPlayback: undefined,
			loaded: true,
		},
	]

	playlist = {
		find: async (args?: Query<RundownPlaylist>): Promise<RundownPlaylist[]> => {
			await sleep(500)
			return this._playlists.filter((playlist) => !args || match(playlist, args.query))
		},
		get: async (id: RundownPlaylistId): Promise<RundownPlaylist | undefined> => {
			await sleep(500)
			return this._playlists.find((item) => item._id === id)
		},
		on: (type: EventTypes, fn: Handler) => {
			this.on(`playlist_${type}`, fn)
		},
		off: (type: EventTypes, fn: Handler) => {
			this.off(`playlist_${type}`, fn)
		},
	}

	private _rundowns = [
		{
			_id: RUNDOWN_ID_0_0,
			playlistId: PLAYLIST_ID_0,
			rank: 0,
			label: 'Rundown 0',
		},
	]

	rundown = {
		find: async (args?: Query<Rundown>): Promise<Rundown[]> => {
			await sleep(500)
			return this._rundowns.filter((rundown) => !args || match(rundown, args.query))
		},
		get: async (id: RundownPlaylistId): Promise<Rundown | undefined> => {
			await sleep(500)
			return this._rundowns.find((item) => item._id === id)
		},
		on: (type: EventTypes, fn: Handler) => {
			this.on(`rundown_${type}`, fn)
		},
		off: (type: EventTypes, fn: Handler) => {
			this.off(`rundown_${type}`, fn)
		},
	}

	private _segments = [
		{
			_id: SEGMENT_ID_0_0,
			label: 'Segment 0',
			rank: 5,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_1,
			label: 'Segment 1',
			rank: 1,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_2,
			label: 'Segment 2',
			rank: 2,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_3,
			label: 'Segment 3',
			rank: 3,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
		},
	]

	segment = {
		find: async (args?: Query<Segment>): Promise<Segment[]> => {
			await sleep(500)
			return this._segments.filter((segment) => !args || match(segment, args.query))
		},
		get: async (id: SegmentId): Promise<Segment | undefined> => {
			await sleep(500)
			return this._segments.find((item) => item._id === id)
		},
		on: (type: EventTypes, fn: Handler) => {
			this.on(`segment_${type}`, fn)
		},
		off: (type: EventTypes, fn: Handler) => {
			this.off(`segment_${type}`, fn)
		},
	}

	private _parts: Part[] = [
		{
			_id: PART_ID_0_0_0,
			label: 'Part 0',
			rank: 0,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'Full',
				type: PartDisplayType.VT,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_0_1,
			label: 'Part 1',
			rank: 1,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'KAM',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sollicitudin ipsum at lacinia sodales. *Sed* in **pharetra _mauris_**, id facilisis nibh. Curabitur eget erat bibendum, aliquam ligula ac, interdum orci.',
		},
		{
			_id: PART_ID_0_0_2,
			label: 'Part 2',
			rank: 2,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'Full',
				type: PartDisplayType.VT,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_0_3,
			label: 'Part 3',
			rank: 3,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'KAM',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sollicitudin ipsum at lacinia sodales. *Sed* in **pharetra _mauris_**, id facilisis nibh. Curabitur eget erat bibendum, aliquam ligula ac, interdum orci.',
		},
		{
			_id: PART_ID_0_1_0,
			label: 'Part 4',
			rank: 0,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_1,
			display: {
				label: 'FULL',
				type: PartDisplayType.VT,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_1_1,
			label: 'Part 5',
			rank: 1,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_1,
			display: {
				label: 'KAM',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum.',
		},
		{
			_id: PART_ID_0_2_0,
			label: 'Part 6',
			rank: 0,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_2,
			display: {
				label: 'Kam',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_2_1,
			label: 'Part 7',
			rank: 1,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_2,
			display: {
				label: 'FULL',
				type: PartDisplayType.VT,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_3_0,
			label: 'Part 8',
			rank: 0,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'Kam',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Donec ac rhoncus ex. Pellentesque _eleifend_ ante id maximus *mollis*. Duis in mauris vel ligula __venenatis__ gravida.\n\n\\*Mauris blandit arcu a lorem cursus ornare. Vestibulum ~at ligula vel~ nisi eleifend pretium.',
		},
		{
			_id: PART_ID_0_3_1,
			label: 'Part 9',
			rank: 1,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'FULL',
				type: PartDisplayType.VT,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_3_2,
			label: 'Part 10',
			rank: 2,
			playlistId: PLAYLIST_ID_0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'Kam',
				type: PartDisplayType.Camera,
			},
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Aenean ut nulla ut _diam imperdiet_ laoreet sed sed enim. **Vivamus bibendum** tempus metus ac consectetur. Aliquam ut nisl sed mauris sodales dignissim. ~Integer **consectetur sapien**~ quam, sit amet blandit quam cursus ac.',
		},
	]

	parts = {
		find: async (args?: Query<Part>): Promise<Part[]> => {
			await sleep(500)
			return this._parts.filter((part) => !args || match(part as unknown as { [s: string]: unknown }, args.query))
		},
		get: async (id: PartId): Promise<Part | undefined> => {
			await sleep(500)
			return this._parts.find((item) => item._id === id)
		},
		on: (type: EventTypes, fn: Handler<Part>) => {
			this.on(`part_${type}`, fn)
		},
		off: (type: EventTypes, fn: Handler<Part | Partial<Part>>) => {
			this.off(`part_${type}`, fn)
		},
	}

	constructor() {
		super()
		setInterval(() => {
			this.emit('part_changed', {
				_id: PART_ID_0_0_1,
				label: 'Part 1',
				rank: 1,
				playlistId: PLAYLIST_ID_0,
				rundownId: RUNDOWN_ID_0_0,
				segmentId: SEGMENT_ID_0_0,
				display: {
					label: 'KAM',
					type: PartDisplayType.Camera,
				},
				isOnAir: true,
				isNext: false,
				scriptContents: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n${new Date().toString()}`,
			})
		}, 2000)
	}
}

type Query<T> = {
	query: Partial<T>
}

function match<T extends { [s: string]: unknown }>(item: T, query: Partial<T>) {
	for (const [key, value] of Object.entries(query)) {
		if (item[key] !== value) return false
	}
	return true
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateId(type: string): any {
	// @ts-expect-error assdfasdf
	if (!window['lastIdMemo']) window['lastIdMemo'] = new Map()
	// @ts-expect-error assdfasdf
	const lastIdMemo = window['lastIdMemo']
	const lastId = lastIdMemo.get(type) ?? 0
	lastIdMemo.set(type, lastId + 1)
	return protectString(`${type}_${lastId}`)
}
