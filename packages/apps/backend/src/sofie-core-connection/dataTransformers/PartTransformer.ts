import { action, computed, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import {
	AnyProtectedString,
	Part,
	PartDisplayType,
	PartId,
	RundownId,
	RundownPlaylistId,
	SegmentId,
} from '@sofie-prompter-editor/shared-model'
import * as Core from '../CoreDataTypes/index.js'
import { literal } from '@sofie-automation/server-core-integration'
import { computedFn } from 'mobx-utils'
import { Transformers } from './Transformers.js'

/** Transforms Core Parts, Pieces & ShowStyles into Prompter Parts */
export class PartTransformer {
	// public readonly parts = observable.map<PartId, Part>()

	private readonly coreParts = observable.map<Core.PartId, Core.DBPart>()
	private readonly corePieces = observable.map<Core.PieceId, Core.Piece>()
	private readonly coreShowStyleBases = observable.map<Core.ShowStyleBaseId, Core.DBShowStyleBase>()
	private readonly coreShowStyleVariants = observable.map<Core.ShowStyleVariantId, Core.DBShowStyleVariant>()

	private readonly corePartPieces = observable.map<Core.PartId, Core.Piece[]>()

	constructor(private transformers: Transformers) {
		makeObservable(this, {
			partIds: computed,
			updateCorePart: action,
			updateCorePiece: action,
			updateCoreShowStyleBase: action,
			updateCoreShowStyleVariant: action,
			// partPieces: computed,
			// parts: computed,
		})

		// autorun(() => {
		// 	this._updateCorePartPieces()
		// }, {
		// 	delay: 100,
		// })
	}

	public get partIds(): Core.PartId[] {
		return Array.from(this.coreParts.keys())
	}
	public transformPartId(id: Core.PartId): PartId {
		return this.convertId<Core.PartId, PartId>(id)
	}

	/** Exposes a transformed Part. Used reactively from a Store */
	public getTransformedPart = computedFn((corePartId: Core.PartId): Part | undefined => {
		const partId = this.convertId<Core.PartId, PartId>(corePartId)

		const corePart = this.coreParts.get(corePartId)
		if (!corePart) return undefined

		const corePlaylistId = this.transformers.rundowns.getPlaylistIdOfRundown(corePart.rundownId)
		if (!corePlaylistId) return undefined

		const showStyle = this.transformers.rundowns.getShowStyleOfRundown(corePart.rundownId)
		if (!showStyle) return undefined

		const rundownId: RundownId = this.convertId<Core.RundownId, RundownId>(corePart.rundownId)
		const segmentId = this.convertId<Core.SegmentId, SegmentId>(corePart.segmentId)
		const playlistId = this.convertId<Core.RundownPlaylistId, RundownPlaylistId>(corePlaylistId)

		const pieces = this.corePartPieces.get(corePartId) || []

		return literal<Part>({
			_id: partId,
			playlistId,
			rundownId,
			segmentId,
			rank: corePart._rank,

			isOnAir: false,
			isNext: false,

			// @ts-ignore
			// pieces: pieces,

			label: corePart.title,
			// prompterLabel?: string
			identifier: corePart.identifier,
			// invalid?: boolean
			expectedDuration: corePart.expectedDuration,
			isNew: false,
			display: {
				type: PartDisplayType.FULL, // ie sourceLayer.type in Sofie
				label: '', // ie sourceLayer.name in Sofie
			},
			// scriptContents?: ScriptContents
		})

		return undefined
	})

	updateCorePart(partId: Core.PartId, part: Core.DBPart | undefined) {
		if (part) {
			if (!isEqual(this.coreParts.get(partId), part)) {
				this.coreParts.set(partId, part)
			}
		} else {
			if (this.coreParts.has(partId)) {
				this.coreParts.delete(partId)
			}
		}
	}
	updateCorePiece(pieceId: Core.PieceId, piece: Core.Piece | undefined) {
		if (piece) {
			if (!isEqual(this.corePieces.get(pieceId), piece)) {
				this.corePieces.set(piece._id, piece)

				const existingPartPieces = this.corePartPieces.get(piece.startPartId) || []
				if (!existingPartPieces.find((p) => p._id === piece._id)) {
					existingPartPieces.push(piece)
					this.corePartPieces.set(piece.startPartId, existingPartPieces)
				}
			}
		} else {
			const existingPiece = this.corePieces.get(pieceId)
			if (existingPiece) {
				this.corePieces.delete(pieceId)

				const existingPartPieces = this.corePartPieces.get(existingPiece.startPartId) || []
				const i = existingPartPieces.findIndex((p) => p._id !== existingPiece._id)
				if (i != -1) {
					existingPartPieces.splice(i, 1)
					this.corePartPieces.set(existingPiece.startPartId, existingPartPieces)
				}
			}
		}
	}

	updateCoreShowStyleBase(id: Core.ShowStyleBaseId, showStyleBase: Core.DBShowStyleBase | undefined) {
		if (showStyleBase) {
			if (!isEqual(this.coreShowStyleBases.get(id), showStyleBase)) {
				this.coreShowStyleBases.set(id, showStyleBase)
			}
		} else {
			if (this.coreShowStyleBases.has(id)) {
				this.coreShowStyleBases.delete(id)
				// changed = true
			}
		}
		// if (changed) {
		// 	for (const part of this.coreParts.values()) {

		// 		if (part)
		// 	}
		// }
	}
	updateCoreShowStyleVariant(id: Core.ShowStyleVariantId, showStyleVariant: Core.DBShowStyleVariant | undefined) {
		if (showStyleVariant) {
			if (!isEqual(this.coreShowStyleVariants.get(id), showStyleVariant)) {
				this.coreShowStyleVariants.set(id, showStyleVariant)
			}
		} else {
			if (this.coreShowStyleVariants.has(id)) {
				this.coreShowStyleVariants.delete(id)
			}
		}
	}

	// private _updateAllParts() {
	// 	for (const partId of this.coreParts.keys()) {
	// 		this._updatePart(partId)
	// 	}
	// }
	// private _updatePart(corePartId: Core.PartId) {
	// 	const partId = this.convertId<Core.PartId, PartId>(corePartId)
	// 	const part = this._transformPart(corePartId)

	// 	if (part) {
	// 		this.store.parts.updatePart(part)
	// 	} else {
	// 		this.store.parts.removePart(partId)
	// 	}
	// }

	private convertId<B extends AnyProtectedString, A extends Core.ProtectedString<any>>(id: B): A
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B
	private convertId<A, B>(id: A): B {
		return id as any
	}
}
