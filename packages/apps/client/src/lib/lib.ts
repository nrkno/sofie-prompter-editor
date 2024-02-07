import { IReactionDisposer } from 'mobx'
import React, { useCallback, useEffect, useRef } from 'react'
import { v4 } from 'uuid'

export function randomId() {
	return v4()
}

export function useMergedRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
	return useCallback((node) => {
		for (const ref of refs) {
			if (ref === null) continue
			if (typeof ref === 'function') {
				ref(node)
				continue
			}
			//@ts-expect-error React's typings prohibit writing to the ref, but it's actually OK
			ref.current = node
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, refs)
}

export function useDebouncedCallback(clb: () => void, deps: React.DependencyList, opts: { delay: number }) {
	const debounce = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (debounce.current) window.clearTimeout(debounce.current)
		}
	}, [])

	return useCallback(() => {
		if (debounce.current) window.clearTimeout(debounce.current)

		debounce.current = window.setTimeout(() => {
			debounce.current = null
			clb()
		}, opts.delay)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)
}

/** Take multiple `IReactionDisposers` and return a single disposer function. Useful when combining multiple
 * reactions/autoruns with React's `useEffect`  */
export function combineDisposers(...disposers: IReactionDisposer[]): () => void {
	return () => {
		disposers.forEach((dispose) => dispose())
	}
}
