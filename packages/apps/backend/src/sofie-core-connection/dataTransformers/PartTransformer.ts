import { action, computed, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import {
	AnyProtectedString,
	Part,
	PartDisplayType,
	PartId,
	RundownId,
	RundownPlaylistId,
	ScriptContents,
	SegmentId,
} from '@sofie-prompter-editor/shared-model'
import * as Core from '../CoreDataTypes/index.js'
import { literal } from '@sofie-automation/server-core-integration'
import { computedFn } from 'mobx-utils'
import { Transformers } from './Transformers.js'
import { IBlueprintPieceType, ScriptContent, SourceLayerType } from '@sofie-automation/blueprints-integration'
import { applyAndValidateOverrides } from '../CoreDataTypes/objectWithOverrides.js'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

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

		const coreShowStyleBase = this.coreShowStyleBases.get(showStyle.showStyleBaseId)

		const pieces = this.corePartPieces.get(corePartId) || []

		const derived: {
			displayType: PartDisplayType
			displayLabel: string
			scriptContents: ScriptContents
		} = {
			displayType: PartDisplayType.Unknown,
			displayLabel: '',
			scriptContents: '',
		}

		if (coreShowStyleBase) {
			const sourceLayers = applyAndValidateOverrides(coreShowStyleBase.sourceLayersWithOverrides)
			const outputLayers = applyAndValidateOverrides(coreShowStyleBase.outputLayersWithOverrides)

			const usePiece = new Map<PartDisplayType, { label: string }>()
			for (const piece of pieces) {
				if (piece.pieceType !== IBlueprintPieceType.Normal) continue

				const sourceLayer = sourceLayers.obj[piece.sourceLayerId]
				const outputLayer = outputLayers.obj[piece.outputLayerId]

				if (!outputLayer?.isPGM) continue

				if (sourceLayer) {
					switch (sourceLayer.type) {
						case SourceLayerType.CAMERA:
							usePiece.set(PartDisplayType.Camera, { label: piece.name })

							break
						case SourceLayerType.VT:
							usePiece.set(PartDisplayType.VT, { label: piece.name })
							break
						case SourceLayerType.REMOTE:
							usePiece.set(PartDisplayType.Remote, { label: piece.name })
							break
						case SourceLayerType.SCRIPT:
							const pieceContent = piece.content as ScriptContent
							derived.scriptContents = pieceContent.fullScript ?? ''
							break
						case SourceLayerType.SPLITS:
							usePiece.set(PartDisplayType.Split, { label: piece.name })
							break
						case SourceLayerType.LIVE_SPEAK:
							usePiece.set(PartDisplayType.LiveSpeak, { label: piece.name })
							break
						case SourceLayerType.AUDIO:
						case SourceLayerType.LOWER_THIRD:
						case SourceLayerType.TRANSITION:
						case SourceLayerType.LOCAL:
						case SourceLayerType.GRAPHICS:
							usePiece.set(PartDisplayType.LiveSpeak, { label: piece.name })
							// ignore these
							break
						case SourceLayerType.UNKNOWN:
							break

						default:
							assertNever(sourceLayer.type)
					}
				}
			}

			// Pick the most significant display type:
			const partDisplayTypesOrdered = [
				PartDisplayType.Split,
				PartDisplayType.Remote,
				PartDisplayType.VT,
				PartDisplayType.Camera,
				PartDisplayType.LiveSpeak,
			]
			for (const partDisplayType of partDisplayTypesOrdered) {
				const displayType = usePiece.get(partDisplayType)
				if (displayType) {
					derived.displayType = partDisplayType
					derived.displayLabel = displayType.label
					break
				}
			}
		}

		return literal<Part>({
			_id: partId,
			playlistId,
			rundownId,
			segmentId,
			rank: corePart._rank,

			isOnAir: false,
			isNext: false,

			label: corePart.title,
			// prompterLabel?: string
			identifier: corePart.identifier,
			invalid: corePart.invalid,
			expectedDuration: corePart.expectedDuration,
			isNew: false,
			display: {
				type: derived.displayType,
				label: derived.displayLabel,
			},
			scriptContents: derived.scriptContents,
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

	private convertId<B extends AnyProtectedString, A extends Core.ProtectedString<any>>(id: B): A
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B
	private convertId<A, B>(id: A): B {
		return id as any
	}
}