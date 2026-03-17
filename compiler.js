
import fs, { read } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __sysDir = path.dirname(__filename);

//
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
//
// Write File Text Content
function writeFileText(filePath, fileContent) {
    fs.writeFileSync(filePath, fileContent)
}

class NSS {
    constructor(filepath) {
        this.path = filepath
        this.txt = readFileText(this.path)
        this.txtLine = this.txt.split("\n")
        this.level = 0
        this.layers = []
        this.map = {}
        this.css = []
    }

    compile() {
        for (let i = 0; i < this.txtLine.length; i++) {
            this.processLine(this.txtLine[i].trim())
        }
        console.log(this.map.length)
        for (let i = 0; i < Object.keys(this.map).length; i++) {
            this.css.push(Object.keys(this.map)[i] + "{")
            this.css.push(Object.values(this.map)[i].join("\n"))
            this.css.push("}")
        }
        console.log(this.css)
    }

    processLine(line) {
        let lastChar = line.split("")[line.length - 1]
        let mapID = this.layers.join(" ")
        // New Layer
        if (lastChar == "{") {
            this.layers.push(line.replace("{", ""))
            this.map[this.layers.join(" ")] = []
        }
        // Close Layer
        else if (lastChar == "}") {
            this.layers.pop()
        }
        // Interior Line
        else if (line.includes(":")) {
            // if (!this.map[mapID]) this.map[mapID] = []
            this.map[mapID].push(line)
            // console.log(this.map)
            // this.map[this.layers.join(" ")].push(line)
        }
        // console.log(this.map)
    }

    print() {
        console.log(this.css.join("\n"))
    }

    output(path) {
        writeFileText(path, this.css.join("\n"))
    }
}

//
// Program
function main() {
    let instance = new NSS("./syntax.nss")
    instance.compile()
    instance.print()
    instance.output("./output.css")
}

main()