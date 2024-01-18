import React from 'react'

import './App.css'
import { Helmet } from 'react-helmet-async'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { Link, Outlet } from 'react-router-dom'

function App(): React.JSX.Element {
	return (
		<>
			<Helmet>
				<title>App</title>
				<body data-bs-theme="dark" />
			</Helmet>
			<Navbar>
				<Container>
					<Navbar.Brand>Prompter</Navbar.Brand>
					<Nav className="me-auto">
						<Nav.Item>
							<Link className="nav-link" to="/">
								Rundowns
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link className="nav-link" to="/backend">
								Backend playground
							</Link>
						</Nav.Item>
						<Nav.Item>
							<Link className="nav-link" to="/editor">
								Editor playground
							</Link>
						</Nav.Item>
					</Nav>
				</Container>
			</Navbar>
			<Container>
				<Outlet />
			</Container>
		</>
	)
}

export default App
