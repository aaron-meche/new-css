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
    main()
}, 2000)