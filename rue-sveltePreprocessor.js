// 
// Rue Programming Language
// Svelte Preprocessor
//
// by Aaron Meche
//
import { RueFile } from './rue-compiler.js'
import fs from 'fs'
import os from 'os'
import path from 'path'

export function preprocessRue() {
    return {
        style({ content, attributes }) {
            if (attributes.lang !== 'rue') return
            const compiler = new RueFile()
            compiler.feed(content)
            const css = compiler.getCSS()

            return { code: css }
        }
    }
}