import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		preserveSymlinks: true,
		alias: {
			src: '/src',
		},
	},
	server: {
		proxy: {
			'/api': 'http://localhost:5600',
			'/socket.io': 'http://localhost:5600',
		},
	},
	optimizeDeps: {
		include: ['packages/shared/*/dist/*'],
	},
})
