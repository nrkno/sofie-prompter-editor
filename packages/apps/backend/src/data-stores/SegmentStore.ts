import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Segment, SegmentId } from 'packages/shared/model/dist'

export class SegmentStore {
	public readonly segments = observable.map<SegmentId, Segment>()

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
			remove: action,
		})
	}

	create(segment: Segment) {
		this._updateIfChanged(segment)
	}
	update(segment: Segment) {
		this._updateIfChanged(segment)
	}
	remove(segmentId: SegmentId) {
		this._deleteIfChanged(segmentId)
	}

	private _updateIfChanged(segment: Segment) {
		if (!isEqual(this.segments.get(segment._id), segment)) {
			this.segments.set(segment._id, segment)
		}
	}
	private _deleteIfChanged(segmentId: SegmentId) {
		if (this.segments.has(segmentId)) {
			this.segments.delete(segmentId)
		}
	}
}
