// vite plugin for nss programming language
// by Aaron Meche
import { RueFile } from "./rue-compiler"
import path from 'path'
import fs from 'fs'

export default function ruePlugin() {
    return {
        name: 'rue-vite-plugin',
        enforce: 'pre',

        resolveId(id, importer) {
            if (id.endsWith('.rue')) {
                return path.resolve(path.dirname(importer), id)
            }
        },

        transform(code, id) {
            if (!id.endsWith('.rue')) return null

            const compiler = new RueFile(id)
            const css = compiler.getCSS()

            return { code: css, map: null }
        },

        load(id) {
            if (!id.endsWith('.rue')) return null

            const compiler = new RueFile(id)
            const css = compiler.getCSS()

            return { code: css, map: null }
        },

        handleHotUpdate({ file, server }) {
            if (file.endsWith('.rue')) {
                console.log(`[rue] recompiling: ${file}`)
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}