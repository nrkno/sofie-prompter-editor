import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export function useQueryParam(paramName: string): string | null {
	const location = useLocation()

	const params = useMemo(() => new URLSearchParams(location.search), [location.search])

	return params.get(paramName)
}
