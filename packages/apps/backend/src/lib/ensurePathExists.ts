import fs from 'fs-extra'

export async function ensurePathExists(path: string): Promise<void> {
	await fs.ensureDir(path)
}
