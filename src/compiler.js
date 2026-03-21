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
        throw new Error(error)
    }
}

// Write File Text Content
function writeFileText(filePath, fileContent) {
    fs.writeFileSync(filePath, fileContent)
}

export class RueFile {
    txt = null
    txtLine = null
    layers = []
    map = { ":root": [] }
    func = {}
    css = []

    inFunc = false
    funcSignature = null
    funcBody = []
    funcDepth = 0

    // Read from filepath, parse and compile
    constructor(filepath, doNotCompile = false) {
        if (!filepath) return
        this.feed(readFileText(filepath), doNotCompile)
    }

    // Force feed strinb instead of filepath
    feed(string, doNotCompile) {
        this.txt = string

        if (doNotCompile) return
        this.run()
    }

    // Parse and Compile stored text
    run() {
        this.#parse()
        this.#compile()
    }

    // Iterate and process all lines
    #parse() {
        let lineSplitText = this.txt?.split("\n")
        for (let i = 0; i < lineSplitText.length; i++) {
            this.#processLine(lineSplitText[i].trim())
        }
    }

    // Build CSS file from map
    #compile() {
        for (let i = 0; i < Object.keys(this.map).length; i++) {
            this.css.push(Object.keys(this.map)[i] + "{")
            this.css.push("\t" + Object.values(this.map)[i].join("\n\t"))
            this.css.push("}")
        }
    }

    #handleFunctionCalls(str, returnExtractedCall) {
        let openParen = str.indexOf("(")
        let funcName = ""
        let paramStr = ""
        // Capture function name
        for (let i = openParen; i > 0; --i) {
            let prevChar = str[i - 1]
            if (prevChar != " ") {
                funcName = prevChar + funcName
            } 
            else {
                break
            }
        }
        // Capture function parameters
        for (let i = openParen; i < str.length; ++i) {
            let nextChar = str[i + 1]
            if (nextChar != ")") {
                paramStr += nextChar
            } 
            else {
                break
            }
        }
        // Fetch function from func map
        let func = this.func?.[funcName]
        let funcStr = funcName + "(" + paramStr + ")"
        if (func) {
            try {
                let value = func(...paramStr?.split(","))
                str = str.replace(funcStr, value)
                if (str.includes("(") && str.includes(")")) {
                    str = this.#resolveString(str)
                }
            }
            catch (error) {
                throw new Error(error)
            }
        }
        // optionally return func signature object
        if (returnExtractedCall) {
            return {
                name: funcName,
                params: paramStr?.split(",")
            }
        }
        return str
    }

    // Handle var definitions + function calls
    #resolveString(line) {
        let charSplit = line.split("")
        let wordSplit = line.split(" ")
        // Variable Definition
        if (wordSplit[0] == "def") {
            line = line?.replace("def ", "--")
        }
        // Function Call
        if (charSplit.includes("(") && charSplit.includes(")")) {
            line = this.#handleFunctionCalls(line)
        }
        return line
    }

    // Interpret each line, building map
    #processLine(line) {
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
                if (this.funcDepth != 0) {
                    this.funcDepth--
                    this.funcBody.push(line)
                }
                // If closing main function
                else {
                    try {
                        this.func[this.funcSignature.name] = new Function(...this.funcSignature.params, this.funcBody.join("\n"))
                    }
                    catch (error) {
                        throw new Error(error)
                    }
                    this.inFunc = false
                    this.funcSignature = null
                    this.funcBody = []
                }
            }
            // Add new line to function
            else {
                this.funcBody.push(line)
            }
        }
        // Style Capture Mode
        else {
            if (firstWord == "//") return
            if (firstWord == "func") {
                this.inFunc = true
                this.funcSignature = this.#handleFunctionCalls(line, true)
            } // New Layer
            else if (lastChar == "{") {
                console.log(line)
                this.layers.push(line.replace("{", ""))
                this.map[mapID()] = []
            } // Close Layer
            else if (line == "}") {
                this.layers.pop()
            } // Variable Definition
            else if (firstWord == "def") {
                this.map[":root"].push(this.#resolveString(line))
            } // Key: Value
            else if (line.includes(":")) {
                this.map[mapID()].push(this.#resolveString(line))
            }
        }
    }

    print() { console.log(this.css.join("\n")) }
    getCSS() { return this.css.join("\n") }
    output(path) { writeFileText(path, this.css.join("\n")) }
}