import React from 'react'
import classes from './CurrentRundownAndHeader.module.scss'
import { CurrentRundown } from 'src/components/CurrentRundown/CurrentRundown'
import { Header } from 'src/components/Header/Header'
import { HamburgerMenu } from 'src/components/Header/HamburgerMenu'
import { AppMenu } from 'src/components/Header/AppMenu'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'

export const CurrentRundownAndHeader = observer(function CurrentRundownAndHeader(): React.ReactNode {
	const openRundown = RootAppStore.rundownStore.openRundown

	return (
		<div className={classes.CurrentRundownAndHeader}>
			<div className={classes.Header}>
				<Header>
					<HamburgerMenu>
						<AppMenu />
					</HamburgerMenu>
					<h1 className={classes.RundownTitle}>{openRundown?.name}</h1>
				</Header>
			</div>
			<div className={classes.Content}>
				<CurrentRundown />
			</div>
		</div>
	)
	return null
})
CurrentRundownAndHeader.displayName = 'CurrentRundownAndHeader'
