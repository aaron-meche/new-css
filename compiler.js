
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
        this.css = []
    }

    compile() {
        for (let i = 0; i < this.txtLine.length; i++) {
            this.processLine(this.txtLine[i].trim())
        }
    }

    processLine(line) {
        let lastChar = line.split("")[line.length - 1]
        if (lastChar == "{") {

        }
        else if (lastChar == "}") {

        }
        else  {
            
        }

        this.css.push(lastChar)
    }

    print() {
        console.log(this.css.join("\n"))
    }
}

//
// Program
function main() {
    let instance = new NSS("./syntax.nss")
    instance.compile()
    instance.print()
}

main()