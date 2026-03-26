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
    #txt = null
    #layers = []
    #map = { ":root": [] }
    #var = {}
    #func = {}
    #css = []

    #inFunc = false
    #funcSignature = null
    #funcBody = []
    #funcDepth = 0

    // Read from filepath, parse and compile
    constructor(filepath, doNotCompile = false) {
        if (!filepath) return
        this.feed(readFileText(filepath), doNotCompile)
    }

    // Force feed strinb instead of filepath
    feed(string, doNotCompile) {
        this.#txt = string

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
        let lineSplitText = this.#txt?.split("\n")
        for (let i = 0; i < lineSplitText.length; i++) {
            this.#processLine(lineSplitText[i].trim())
        }
    }

    // Build CSS file from map
    #compile() {
        for (let i = 0; i < Object.keys(this.#map).length; i++) {
            this.#css.push(Object.keys(this.#map)[i] + "{")
            this.#css.push("\t" + Object.values(this.#map)[i].join("\n\t"))
            this.#css.push("}")
        }
    }

    // Interpret each line, building map
    #processLine(line) {
        let lastChar = line.split("")[line.length - 1]
        let firstChar = line.split("")[0]
        let firstWord = line.split(" ")[0]
        let mapID = () => { return this.#layers.join(" ")?.replaceAll(" :", ":") }
        
        if (firstWord == "//") return
        if (firstWord == "<!--") return

        // Function Capture Mode
        if (this.#inFunc) {
            // Nested function
            if (lastChar == "{") {
                this.#funcDepth++
                this.#funcBody.push(line)
            }
            // Close function
            else if (line == "}") {
                // If closing nested function
                if (this.#funcDepth != 0) {
                    this.#funcDepth--
                    this.#funcBody.push(line)
                }
                // If closing main function
                else {
                    try {
                        this.#funcBody = this.#handleJavascriptContext(this.#funcBody)
                        this.#func[this.#funcSignature.name] = {
                            name: this.#funcSignature.name,
                            params: this.#funcSignature.params,
                            body: this.#funcBody,
                            function: new Function(...this.#funcSignature.params, this.#funcBody.join("\n")),
                        }
                    }
                    catch (error) {
                        console.error("add func: ", error)
                    }
                    this.#inFunc = false
                    this.#funcSignature = null
                    this.#funcBody = []
                }
            }
            // Add new line to function
            else {
                this.#funcBody.push(line)
            }
        }
        // Style Capture Mode
        else {
            if (firstWord == "func") {
                this.#inFunc = true
                this.#funcSignature = this.#extractFunctionCalls(line)[0]
            } // New Layer
            else if (lastChar == "{") {
                this.#layers.push(line.replace("{", ""))
                this.#map[mapID()] = []
            } // Close Layer
            else if (line == "}") {
                this.#layers.pop()
            } // Variable Definition
            else if (firstWord == "def") {
                this.#map[":root"].push(this.#resolveString(line))
            } // Rue Variables
            else if (firstChar == "_") {
                let varName = line.split(":")[0].replaceAll("_", "").trim()
                let varValue = line.split(":")[1].trim()
                this.#var[varName] = this.#resolveString(varValue)
                // this.#var[this.firstWord.re]
            } // Key: Value
            else if (line.includes(":")) {
                this.#map[mapID()].push(this.#resolveString(line))
            }
        }
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
        if (charSplit.includes("_")) {
            line = this.#handleRueVarCalls(line)
        }
        return line
    }

    #extractFunctionCalls(str) {
        if (!str.includes("(")) return null
        let numOfLParen = str.split("(").length - 1
        let indexOfLParen = null
        let functions = []
        let currFunc = { name: "", params: "" }
        for (let i = 0; i < numOfLParen; i++) {
            indexOfLParen = str.indexOf("(")
            // Capture BEHIND (function name)
            for (let i = indexOfLParen; i > 0; --i) {
                let prevChar = str[i - 1]
                if (prevChar != " ") {
                    currFunc.name = prevChar + currFunc.name
                } 
                else break
            }
            // Capture AHEAD (function parameters)
            for (let i = indexOfLParen; i < str.length; ++i) {
                let nextChar = str[i + 1]
                if (nextChar != ")") {
                    currFunc.params += nextChar
                } 
                else break
            }
            currFunc.params = currFunc.params?.split(",")
            functions.push(currFunc)
            currFunc = { name: "", params: "" }
            str = str.replace("(", "_")
        }
        return functions
    }

    #handleFunctionCalls(str) {
        let extractedCalls = this.#extractFunctionCalls(str)
        if (!extractedCalls) return str
        // console.log(str)
        for (let i = 0; i < extractedCalls.length; i++) {
            let funcName = extractedCalls[i].name
            let parameters = extractedCalls[i].params
            // Fetch function from func map
            let func = this.#func?.[funcName]
            let funcCallStr = funcName + "(" + parameters + ")"
            if (func) {
                try {
                    let funcCallValue = func.function(...parameters)
                    str = str.replace(funcCallStr, funcCallValue)
                }
                catch (error) {
                    console.error("handleFunctionCalls: " + error.message)
                }
            }
        }
        return str
    }

    // in development
    #handleJavascriptContext(lineArr) {
        for (let i = 0; i < lineArr.length; i++) {
            let calls = this.#extractFunctionCalls(lineArr[i])
            if (!calls) continue
            for (let i = 0; i < calls.length; i++) {
                let foundFunc = this.#func?.[calls[i].name]
                if (!foundFunc) continue
                else {
                    let contextStr = `const ${foundFunc.name} = (${foundFunc.params}) => {\n${foundFunc.body}\n}`
                    // lineArr = [contextStr, ...lineArr]
                    // lineArr = lineArr.unshift(contextStr)
                    // console.log(lineArr)
                    // console.log(contextStr)
                }
            }
            // if (this.#func?.[found.name]) {
            //     const foundFuncObj = this.#func[found.name]
            //     // console.log(foundFuncObj.body)
            //     const contextStr = `const ${foundFuncObj.name} = (${foundFuncObj.params.join(",")}) => { ${this.handleInteriorJavascriptCalls(foundFuncObj.body)} }`
            //     // console.log(this.#handleDefinedFunctionCalls(foundFuncObj.body))
            //     body.unshift(contextStr)
            // }
        }
        return lineArr
    }

    #handleRueVarCalls(line) {
        let curVarName = ""
        for (let i = line.indexOf("_") + 1; i < line.length; i++) {
            if (line[i] == "_") break
            curVarName += line[i]
        }
        line = line.replace("_" + curVarName + "_", this.#var[curVarName])
        if (line.includes("_")) 
            return this.#handleRueVarCalls(line)
        else 
            return line
    }

    print() { console.log(this.#css.join("\n")) }
    getCSS() { return this.#css.join("\n") }
    output(path) { writeFileText(path, this.#css.join("\n")) }
}