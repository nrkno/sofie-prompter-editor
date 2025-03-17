import { action, computed, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import {
	AnyProtectedString,
	ExpectedPackageId,
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
import { popElementFromReactiveArray, upsertElementToReactiveArray } from './util.js'

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
			// const outputLayers = applyAndValidateOverrides(coreShowStyleBase.outputLayersWithOverrides)

			const usePiece = new Map<PartDisplayType, { label: string }>()
			for (const piece of pieces) {
				if (piece.pieceType !== IBlueprintPieceType.Normal) continue

				const sourceLayer = sourceLayers.obj[piece.sourceLayerId]
				// const outputLayer = outputLayers.obj[piece.outputLayerId]

				if (!sourceLayer) continue
				const sourceLayerShortName = sourceLayer.abbreviation ?? sourceLayer.name

				// Script is special, since we need to parse it allways
				if (sourceLayer.type === SourceLayerType.SCRIPT) {
					const pieceContent = piece.content as ScriptContent
					derived.scriptContents = pieceContent.fullScript ?? ''
					continue
				}

				if (!sourceLayer?.onPresenterScreen) continue

				switch (sourceLayer.type) {
					case SourceLayerType.CAMERA:
						usePiece.set(PartDisplayType.Camera, { label: sourceLayerShortName })

						break
					case SourceLayerType.VT:
						usePiece.set(PartDisplayType.VT, { label: sourceLayerShortName })
						break
					case SourceLayerType.REMOTE:
						usePiece.set(PartDisplayType.Remote, { label: sourceLayerShortName })
						break
					case SourceLayerType.SPLITS:
						usePiece.set(PartDisplayType.Split, { label: sourceLayerShortName })
						break
					case SourceLayerType.LIVE_SPEAK:
						usePiece.set(PartDisplayType.LiveSpeak, { label: sourceLayerShortName })
						break
					case SourceLayerType.AUDIO:
					case SourceLayerType.LOWER_THIRD:
					case SourceLayerType.TRANSITION:
					case SourceLayerType.LOCAL:
					case SourceLayerType.GRAPHICS:
						usePiece.set(PartDisplayType.LiveSpeak, { label: sourceLayerShortName })
						// ignore these
						break
					case SourceLayerType.UNKNOWN:
						break

					default:
						assertNever(sourceLayer.type)
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
			// Script edits get layered on by the PartStore
			scriptPackageInfo: null,
			editedScriptContents: undefined,
		})
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

				// create a new array so that the observable.map will pick up on the change
				upsertElementToReactiveArray(this.corePartPieces, piece.startPartId, piece)
			}
		} else {
			const existingPiece = this.corePieces.get(pieceId)
			if (existingPiece) {
				this.corePieces.delete(pieceId)

				// create a new array so that the observable.map will pick up on the change
				popElementFromReactiveArray(this.corePartPieces, existingPiece.startPartId, existingPiece._id)
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
