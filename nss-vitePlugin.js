// vite plugin for nss programming language
// by Aaron Meche
import { NSS } from "./nss-compiler"
import path from 'path'
import fs from 'fs'

export default function nssPlugin() {
    return {
        name: 'nss-vite-plugin',
        enforce: 'pre',

        resolveId(id, importer) {
            if (id.endsWith('.nss')) {
                return path.resolve(path.dirname(importer), id)
            }
        },

        transform(code, id) {
            if (!id.endsWith('.nss')) return null

            const compiler = new NSS(id)
            const css = compiler.getCSS()

            return { code: css, map: null }
        },

        load(id) {
            if (!id.endsWith('.nss')) return null

            const compiler = new NSS(id)
            const css = compiler.getCSS()

            return { code: css, map: null }
        },

        handleHotUpdate({ file, server }) {
            if (file.endsWith('.nss')) {
                console.log(`[nss] recompiling: ${file}`)
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}