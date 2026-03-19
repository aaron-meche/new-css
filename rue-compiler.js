// 
// Rue Programming Language
// Compiler
//
// by Aaron Meche
//
import fs, { read } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __sysDir = path.dirname(__filename);


// Read File Text Content
function readFileText(filePath) { 
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        return ""
    }
}

// Write File Text Content
function writeFileText(filePath, fileContent) {
    fs.writeFileSync(filePath, fileContent)
}

export class RueFile {
    path = null     // local path reference to input .nss file
    txt = null      // raw text string of read input file
    txtLine = null  // array of raw text split by line
    layers = []     // tracks active css layers throughout exec
    map = {}        // holds all css layer ref / style data
    css = []        // array of css lines to output

    // Read from filepath, parse and compile
    constructor(filepath) {
        if (!filepath) return
        this.path = filepath
        this.txt = readFileText(this.path)
        this.txtLine = this.txt.split("\n")
        this.parse()
        this.compile()
    }

    // If filepath was not provided initially
    run(filepath) { constructor(filepath) }

    // Force feed text instead of filepath
    feed(text) {
        this.txt = text
        this.txtLine = this.txt.split("\n")
        this.parse()
        this.compile()
    }

    // Iterate and process all lines
    parse() {
        for (let i = 0; i < this.txtLine.length; i++) {
            this.processLine(this.txtLine[i].trim())
        }
    }

    // Build CSS file from map
    compile() {
        for (let i = 0; i < Object.keys(this.map).length; i++) {
            this.css.push(Object.keys(this.map)[i] + "{")
            this.css.push(Object.values(this.map)[i].join("\n"))
            this.css.push("}")
        }
    }

    // Interpret each line, building map
    processLine(line) {
        let lastChar = line.split("")[line.length - 1]
        let mapID = () => { return this.layers.join(" ")?.replaceAll(" :", ":") }
        // Open a Layer ... [ident] {
        if (lastChar == "{") {
            this.layers.push(line.replace("{", ""))
            this.map[mapID()] = []
        }
        // Close Layer ... }
        else if (lastChar == "}") {
            this.layers.pop()
        }
        // Interior Line ... [attr]: [val]
        else if (line.includes(":")) {
            this.map[mapID()].push(line)
        }
    }

    print() { console.log(this.css.join("\n")) }
    getCSS() { return this.css.join("\n") }
    output(path) { writeFileText(path, this.css.join("\n")) }
}