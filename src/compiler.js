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
    path = null
    txt = null
    txtLine = null
    layers = []
    map = { ":root": [] }
    func = {}
    css = []

    inFunc = false
    funcName = null
    funcParams = []
    funcBody = []
    funcDepth = 0

    // Read from filepath, parse and compile
    constructor(filepath) {
        if (!filepath) return
        this.path = filepath
        this.txt = readFileText(this.path)
        this.txtLine = this.txt.split("\n")
        this.parse()
        this.compile()
    }

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

    // Call Function from saved func map
    callFunction(name, args) {
        if (!this.func[name]) this.css.push("/* Error! Function " + name + " undefined */")
        const result = this.func[name](...args)
        return String(result)
    }

    // Resolve variable / function calls
    resolveValue(val) {
        if (val.split(" ")[0] == "def") {
            val = val?.replace("def ", "--")
        }
        if (val.includes("{") && val.includes("}")) {
            let evalStr = val.slice(val.indexOf('{') + 1, val.lastIndexOf('}')).trim()
            console.log(eval(evalStr))
        }
        return val
    }

    // Interpret each line, building map
    processLine(line) {
        let lastChar = line.split("")[line.length - 1]
        let firstWord = line.split(" ")[0]
        let mapID = () => { return this.layers.join(" ")?.replaceAll(" :", ":") }
        
        // Function Capture Mode
        if (this.inFunc) {
            // Nested function
            if (lastChar == "{") {
                this.funcDepth++
                this.funcBody.push(line)
            }
            // Close function
            else if (line == "}") {
                // If closing nested function
                if (this.funcDepth > 0) {
                    this.funcDepth--
                    this.funcBody.push(line)
                }
                // If closing main function
                else {
                    const body = this.funcBody.join("\n")
                    const params = this.funcParams
                    const name = this.funcName
                    try {
                        this.func[name] = new Function(...params, body)
                    }
                    catch (error) {
                        this.css.push("/* Error creating function: " + name + " */")
                        throw new Error(error)
                    }
                    this.inFunc = false
                    this.funcName = null
                    this.funcParams = []
                    this.funcBody = []
                    this.funcDepth = 0
                }
            }
            // Add new line to function
            else {
                this.funcBody.push(line)
            }
        }
        // Style Capture Mode
        else {
            // Handle Comments
            if (firstWord == "//") return
            // Function Declaration ... func funcName(param) {
            if (firstWord == "func") {
                this.inFunc = true
                this.funcName = line.replace("func ", "").split("(")[0]
                this.funcParams = [line.split("(")[1].split(")")[0]]
            }
            // Open a Layer ... div {
            else if (lastChar == "{") {
                this.layers.push(line.replace("{", ""))
                this.map[mapID()] = []
            }
            // Close Layer ... }
            else if (line == "}") {
                this.layers.pop()
            }
            // Define Variable ... def Var: Val
            else if (firstWord == "def") {
                this.map[":root"].push(this.resolveValue(line))
            }
            // Interior Line ... attr: val
            else if (line.includes(":")) {
                let split = line.split(": ")
                let key = split[0]
                let val = split[1]
                if (val.includes("_")) {
                    val = val.replaceAll()
                }
                this.map[mapID()].push(this.resolveValue(line))
            }
            // Comments ... //
        }
        
    }

    print() { console.log(this.css.join("\n")) }
    getCSS() { return this.css.join("\n") }
    output(path) { writeFileText(path, this.css.join("\n")) }
}