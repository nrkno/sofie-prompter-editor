import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { ViewPort } from 'packages/shared/model/dist'

export class ViewPortStore {
	public viewPort = observable<ViewPort>({
		// TODO: load these from persistent store upon startup?
		_id: 'viewport',
		instanceId: '',
		position: {
			scrollOffset: 0,
			scrollOffsetTarget: null,
		},
		width: 0,
	})

	private readonly seenInstanceIds = new Set()

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
			registerInstance: action,
		})
	}

	create(part: ViewPort) {
		this._updateIfChanged(part)
	}
	update(part: ViewPort) {
		this._updateIfChanged(part)
	}

	registerInstance(instanceId: string): boolean {
		if (!this.seenInstanceIds.has(instanceId)) {
			// Is a new instanceId, so we are in control:
			this.seenInstanceIds.add(instanceId)
			this.viewPort.instanceId = instanceId
		}
		return this.viewPort.instanceId === instanceId
	}

	private _updateIfChanged(viewPort: ViewPort) {
		if (!isEqual(this.viewPort, viewPort)) {
			this.viewPort = viewPort
		}
	}
}
