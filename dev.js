//
// dev.js
//
// Rue Programming Language
// Development Test Script
//

import { RueFile } from "./src/compiler.js"

function main() {
    let file = new RueFile('./dev.rue')
    file.output('./style.css')
}

setInterval(() => {
    console.log("Rerunning...")
    main()
}, 2000)