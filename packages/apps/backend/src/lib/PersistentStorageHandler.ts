import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { ensurePathExists } from './ensurePathExists.js'

export class PersistentStorageHandler<T> {
	private fileName: string
	private storageReady: Promise<void>
	constructor(private keyName: string) {
		let storageDir = process.env.STORAGE_DIR

		if (!storageDir) {
			storageDir = path.join(os.homedir(), '.sofie-prompter-editor')
			this.storageReady = ensurePathExists(storageDir)
		} else {
			this.storageReady = Promise.resolve()
		}

		this.fileName = path.join(storageDir, `${keyName}.json`)
	}
	set(value: T) {
		this.storageReady = this.storageReady
			.then(async () => {
				await fs.writeFile(this.fileName, JSON.stringify(value))
			})
			.catch((e) => {
				console.error(`Error while writing file: ${e}`)
			})
	}
	async get(): Promise<T | null> {
		try {
			await this.storageReady

			const text = await fs.readFile(this.fileName, {
				encoding: 'utf-8',
			})
			return JSON.parse(text)
		} catch (e) {
			return null
		}
	}
}
