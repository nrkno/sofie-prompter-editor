import React from 'react'
import { Alert } from 'react-bootstrap'

export function AlertBar({
	children,
	variant,
}: {
	children?: React.ReactNode
	variant?: AlertVariants
}): React.JSX.Element {
	return <Alert variant={variant ?? 'primary'}>{children}</Alert>
}

type AlertVariants = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
