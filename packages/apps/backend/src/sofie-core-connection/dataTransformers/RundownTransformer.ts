import { action, computed, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { AnyProtectedString, Rundown, RundownId, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import * as Core from '../CoreDataTypes/index.js'
import { computedFn } from 'mobx-utils'

/** Transforms Core Rundowns into Prompter Rundowns */

export class RundownTransformer {
	// public readonly rundowns = observable.map<RundownId, Rundown>()

	private readonly coreRundowns = observable.map<Core.RundownId, Core.Rundown>()

	constructor() {
		makeObservable(this, {
			updateCoreRundown: action,
			showStyleBaseIds: computed,
			showStyleVariantIds: computed,
		})
	}
	get rundownIds(): Set<Core.RundownId> {
		return new Set(Array.from(this.coreRundowns.keys()))
	}
	public transformRundownId(id: Core.RundownId): RundownId {
		return this.convertId<Core.RundownId, RundownId>(id)
	}
	public getCoreRundown = computedFn((rundownId: Core.RundownId): Core.Rundown | undefined => {
		return this.coreRundowns.get(rundownId)
	})
	public getPlaylistIdOfRundown = computedFn((rundownId: Core.RundownId): Core.RundownPlaylistId | undefined => {
		return this.coreRundowns.get(rundownId)?.playlistId
	})

	public getTransformedRundown = computedFn((rundownId: RundownId): Rundown | undefined => {
		const coreRundownId = this.convertId<RundownId, Core.RundownId>(rundownId)

		const coreRundown = this.coreRundowns.get(coreRundownId)
		if (!coreRundown) return undefined

		return {
			_id: this.convertId<Core.RundownId, RundownId>(coreRundown._id),

			playlistId: this.convertId<Core.RundownPlaylistId, RundownPlaylistId>(coreRundown.playlistId),
			label: coreRundown.name,
			rank: 0, // todo
		}
	})

	updateCoreRundown(coreRundownId: Core.RundownId, coreRundown: Core.Rundown | undefined) {
		// const rundownId = this.convertId<Core.RundownId, RundownId>(coreRundownId)

		if (coreRundown) {
			if (!isEqual(this.coreRundowns.get(coreRundownId), coreRundown)) {
				this.coreRundowns.set(coreRundownId, coreRundown)

				// Also update store.rundowns:
				// const rundown = this.convert(coreRundown)
				// this.store.rundowns.updateRundown(rundownId, rundown)
			}
		} else {
			if (this.coreRundowns.has(coreRundownId)) {
				this.coreRundowns.delete(coreRundownId)

				// Also update store.rundowns:
				// this.store.rundowns.updateRundown(rundownId, undefined)
			}
		}
	}

	get showStyleBaseIds(): Core.ShowStyleBaseId[] {
		const showStyleBaseIds = new Set<Core.ShowStyleBaseId>()
		for (const coreRundown of this.coreRundowns.values()) {
			showStyleBaseIds.add(coreRundown.showStyleBaseId)
		}
		return Array.from(showStyleBaseIds.keys())
	}
	get showStyleVariantIds(): Core.ShowStyleVariantId[] {
		const showStyleVariantIds = new Set<Core.ShowStyleVariantId>()
		for (const coreRundown of this.coreRundowns.values()) {
			showStyleVariantIds.add(coreRundown.showStyleVariantId)
		}
		return Array.from(showStyleVariantIds.keys())
	}

	private convertId<B extends AnyProtectedString, A extends Core.ProtectedString<any>>(id: B): A
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B
	private convertId<A, B>(id: A): B {
		return id as any
	}
}
