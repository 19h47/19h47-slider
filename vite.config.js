import { dirname, resolve } from 'node:path'
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [
		{
			name: 'docs-output',
			async closeBundle() {
				const root = __dirname
				const distDir = resolve(root, 'dist')
				const docsDir = resolve(root, 'docs')

				await mkdir(docsDir, { recursive: true })

				// Copy built files to docs (GitHub Pages)
				await cp(distDir, docsDir, { recursive: true, force: true })

				// Generate docs/index.html from index.html (single source of truth).
				// Swap dev import (src TS) to built bundle (docs).
				const template = await readFile(resolve(root, 'index.html'), 'utf8')
				const html = template.replace('./lib/index.ts', './slider.js')
				await writeFile(resolve(docsDir, 'index.html'), html, 'utf8')

				// Copy root assets used by demo
				await copyFile(resolve(root, 'level-slider.png'), resolve(docsDir, 'level-slider.png'))

				// Cleanup legacy artifacts
				await rm(resolve(docsDir, 'main.js'), { force: true })
				await rm(resolve(docsDir, 'main.js.map'), { force: true })
			},
		},
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'lib/index.ts'),
			fileName: 'slider',
			name: 'Slider',
		},
		outDir: './dist',
	},
})

