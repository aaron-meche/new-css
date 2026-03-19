// svelte preprocessor for nss programming language
// by Aaron Meche
import { NSS } from './nss-compiler.js'
import fs from 'fs'
import os from 'os'
import path from 'path'

export function preprocessNSS() {
    return {
        style({ content, attributes }) {
            if (attributes.lang !== 'nss') return
            const compiler = new NSS()
            compiler.feed(content)
            const css = compiler.getCSS()

            return { code: css }
        }
    }
}