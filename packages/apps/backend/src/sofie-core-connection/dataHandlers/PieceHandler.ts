import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from '../CoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'
import { Transformers } from '../dataTransformers/Transformers.js'

export class PieceHandler extends DataHandler {
	public initialized: Promise<void>

	constructor(log: LoggerInstance, core: CoreConnection, store: Store, transformers: Transformers) {
		super(log.category('PieceHandler'), core, store, transformers)

		this.initialized = Promise.resolve().then(async () => {
			{
				const observer = this.core.observe('pieces')
				observer.added = (id: string) => this._updatePiece(protectString(id))
				observer.changed = (id: string) => this._updatePiece(protectString(id))
				observer.removed = (id: string) => this._updatePiece(protectString(id))
				this.observers.push(observer)
			}
		})
	}

	private _updatePiece(pieceId: Core.PieceId): void {
		const piece = this.pieces.findOne(pieceId)
		this.transformers.parts.updateCorePiece(pieceId, piece)
	}
	private get pieces(): Collection<Core.Piece> {
		const collection = this.core.getCollection<Core.Piece>('pieces')
		if (!collection) {
			this.log.error('collection "pieces" not found!')
			throw new Error('collection "pieces" not found!')
		}
		return collection
	}
}
