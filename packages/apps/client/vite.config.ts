import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		preserveSymlinks: true,
	},
	optimizeDeps: {
		include: ['packages/shared/*/dist/*'],
	},

	// optimizeDeps: {
	// 	include: ['@sofie-prompter-editor/shared-lib'],
	// },
	// build: {
	// 	commonjsOptions: {
	// 		include: [/@sofie-prompter-editor\/shared-lib/, /node_modules/],
	// 	},
	// },

	// server: {
	// 	watch: {
	// 		ignored: ['**/node_modules/**'],
	// 	},
	// },

	// optimizeDeps: {
	// 	link: ['shared-lib'],
	// },
})
