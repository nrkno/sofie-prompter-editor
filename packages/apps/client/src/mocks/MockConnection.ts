import { EventEmitter } from 'eventemitter3'
import {
	Part,
	PartDisplayType,
	PartId,
	ProtectedString,
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
const PART_ID_0_3_4_INSERTED = generateId('part')

const PLAYLIST_ID_1 = generateId('playlist')

const START_TIME = Date.now()

type EventTypes = 'created' | 'updated' | 'removed'
type Services = 'playlist' | 'rundown' | 'segment' | 'part' | 'outputSettings' | 'viewPort' | 'example'

type Events = `${Services}_${EventTypes}` | 'connected' | 'disconnected'

class MockService<
	T extends ProtectedString<string, string>,
	K extends { _id: T },
	L extends string
> extends EventEmitter {
	constructor(private store: K[], extraMethods: Record<L, () => Promise<void>>) {
		super()

		Object.assign(this, extraMethods)
	}

	find = async (args: Query<K>): Promise<K[]> => {
		await sleep(500)
		return this.store.filter((item) => !args || match(item, args.query))
	}

	get = async (id: T): Promise<K | undefined> => {
		await sleep(500)
		return this.store.find((item) => item._id === id)
	}

	create = async () => Promise.resolve()
	update = async () => Promise.resolve()
	remove = async () => Promise.resolve()
	hooks = async () => Promise.resolve()
}

export class MockConnection extends EventEmitter<Events> {
	private createMockService<L extends ProtectedString<string, string>, T extends { _id: L }, K extends string>(
		_serviceName: Services,
		store: T[] = [],
		extraMethods: Record<K, () => Promise<void>> = Object.assign({})
	) {
		return new MockService(store, extraMethods) as MockService<L, T, K> & typeof extraMethods
	}

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

	playlist = this.createMockService('playlist', this._playlists, {
		subscribeToPlaylists: () => Promise.resolve(),
		tmpPing: () => Promise.resolve(),
	})

	private _rundowns = [
		{
			_id: RUNDOWN_ID_0_0,
			playlistId: PLAYLIST_ID_0,
			rank: 0,
			label: 'Rundown 0',
		},
	]

	rundown = this.createMockService('rundown', this._rundowns, {
		subscribeToRundownsInPlaylist: () => Promise.resolve(),
		unSubscribeFromRundownsInPlaylist: () => Promise.resolve(),
	})

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

	segment = this.createMockService('segment', this._segments, {})

	private _part: Part[] = [
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
			identifier: 'A1',
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
			identifier: 'A2',
			isOnAir: true,
			isNext: false,
			scriptContents:
				'Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum.',
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

	part = this.createMockService('part', this._part, {})

	outputSettings = this.createMockService('outputSettings')

	viewPort = this.createMockService('viewPort')

	example = this.createMockService('example')

	connected = true

	host = 'DUMMY'

	port = 1234

	constructor() {
		super()

		setTimeout(() => {
			this.emit('connected')
		}, 100)

		setInterval(() => {
			this.part.emit('updated', {
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

		setTimeout(() => {
			this.part.emit('created', {
				_id: PART_ID_0_3_4_INSERTED,
				label: 'Part 1.5 - inserted',
				rank: 1.5,
				playlistId: PLAYLIST_ID_0,
				rundownId: RUNDOWN_ID_0_0,
				segmentId: SEGMENT_ID_0_0,
				display: {
					label: 'KAM',
					type: PartDisplayType.Camera,
				},
				isOnAir: true,
				isNext: false,
				scriptContents: `~[INSERTED]~ Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n${new Date().toString()}`,
			})
		}, 10000)
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
