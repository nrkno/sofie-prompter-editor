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

export class MockConnection extends EventEmitter {
	private _playlists = [
		{
			_id: PLAYLIST_ID_0,
			created: START_TIME,
			isActive: false,
			label: 'Playlist 0',
			modified: START_TIME,
			rehearsal: false,
		},
		{
			_id: PLAYLIST_ID_1,
			created: START_TIME,
			isActive: false,
			label: 'Playlist 1',
			modified: START_TIME,
			rehearsal: false,
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
		on: (type: string, e: unknown) => {
			void e, type
		},
		off: (type: string, e: unknown) => {
			void e, type
		},
	}

	private _rundowns = [
		{
			_id: RUNDOWN_ID_0_0,
			playlistId: PLAYLIST_ID_0,
			rank: 0,
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
		on: (type: string, e: unknown) => {
			void e, type
		},
		off: (type: string, e: unknown) => {
			void e, type
		},
	}

	private _segments = [
		{
			_id: SEGMENT_ID_0_0,
			label: 'Segment 0',
			rank: 0,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_1,
			label: 'Segment 1',
			rank: 1,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_2,
			label: 'Segment 2',
			rank: 2,
			rundownId: RUNDOWN_ID_0_0,
		},
		{
			_id: SEGMENT_ID_0_3,
			label: 'Segment 3',
			rank: 3,
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
		on: (type: string, e: unknown) => {
			void e, type
		},
		off: (type: string, e: unknown) => {
			void e, type
		},
	}

	private _parts = [
		{
			_id: PART_ID_0_0_0,
			label: 'Part 0',
			rank: 0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_0_1,
			label: 'Part 1',
			rank: 1,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_0_2,
			label: 'Part 2',
			rank: 2,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_0_3,
			label: 'Part 3',
			rank: 3,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_0,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_1_0,
			label: 'Part 4',
			rank: 0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_1,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_1_1,
			label: 'Part 5',
			rank: 1,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_1,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_2_0,
			label: 'Part 6',
			rank: 0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_2,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_2_1,
			label: 'Part 7',
			rank: 1,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_2,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_3_0,
			label: 'Part 8',
			rank: 0,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_3_1,
			label: 'Part 9',
			rank: 1,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
		{
			_id: PART_ID_0_3_2,
			label: 'Part 10',
			rank: 2,
			rundownId: RUNDOWN_ID_0_0,
			segmentId: SEGMENT_ID_0_3,
			display: {
				label: 'VT',
				type: PartDisplayType.FULL,
			},
			isOnAir: true,
			isNext: false,
		},
	]

	parts = {
		find: async (args?: Query<Part>): Promise<Part[]> => {
			await sleep(500)
			return this._parts.filter((part) => !args || match(part, args.query))
		},
		get: async (id: PartId): Promise<Part | undefined> => {
			await sleep(500)
			return this._parts.find((item) => item._id === id)
		},
		on: (type: string, e: unknown) => {
			void e, type
		},
		off: (type: string, e: unknown) => {
			void e, type
		},
	}
}

type Query<T> = {
	query: Partial<T>
}

function match<T extends Record<string, unknown>>(item: T, query: Partial<T>) {
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
