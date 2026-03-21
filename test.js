//
// test.js
// 
// Testing script for
// running Rue compiler
//

import { RueFile } from "./src/compiler.js";

function main(testToRun = "all") {
    let tests = [
        "empty", 
        "normal", 
        "one-line",
        "syntax-error",
        "wrong-lang"
    ]
    let passed = 0

    if (testToRun == "all") {
        for (let i = 0; i < tests.length; i++) {
            let test = tests[i]
            let rueInstance = new RueFile(`./test/${test}.rue`)
            rueInstance.output(`./test-output/${test}.css`)
            if (rueInstance.getCSS) passed++
        }
        console.log(passed, "out of", tests.length, "tests passed", Math.round(passed * 100 / tests.length), "%")
    }
    else {
        let rueInstance = new RueFile(`./test/${testToRun}.rue`)
        rueInstance.output(`./output/${testToRun}.css`)
    }

}

main("dev")