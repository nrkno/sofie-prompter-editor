import { ObservableMap } from 'mobx'

export function upsertElementToReactiveArray<TParentId, TDoc extends { _id: any }>(
	elementMap: ObservableMap<TParentId, TDoc[]>,
	parentId: TParentId,
	doc: TDoc
): void {
	// create a new array so that the observable.map will pick up on the change
	const existingElements = elementMap.get(parentId)?.slice() || []
	const i = existingElements.findIndex((p) => p._id === doc._id)
	if (i === -1) {
		existingElements.push(doc)
	} else {
		existingElements.splice(i, 1, doc)
	}
	elementMap.set(parentId, existingElements)
}

export function popElementFromReactiveArray<TParentId, TDoc extends { _id: any }>(
	elementMap: ObservableMap<TParentId, TDoc[]>,
	parentId: TParentId,
	docId: TDoc['_id']
): void {
	// create a new array so that the observable.map will pick up on the change
	const existingElements = elementMap.get(parentId)?.slice() || []
	const i = existingElements.findIndex((p) => p._id !== docId)
	if (i !== -1) {
		existingElements.splice(i, 1)
		elementMap.set(parentId, existingElements)
	}
}
