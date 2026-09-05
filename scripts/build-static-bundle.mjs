import {readFile,writeFile} from 'node:fs/promises';

const dist=new URL('../dist/',import.meta.url);
const modules=['model.js','shared.js','front.js','public-app.js'];
const rewriteImports=source=>source.replace(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];\s*$/gm,(_,bindings,dependency)=>{
 const destructuring=bindings.split(',').map(binding=>binding.trim().replace(/\s+as\s+/,': ')).join(', ');
 return `const { ${destructuring} } = __modules[${JSON.stringify(dependency)}];`;
});
let bundle='(() => {\n  "use strict";\n  const __modules = Object.create(null);\n';
for(const filename of modules){
 const id=`./${filename}`,source=await readFile(new URL(filename,dist),'utf8');
 const exports=[...source.matchAll(/^export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map(match=>match[1]);
 const body=rewriteImports(source).replace(/^export\s+(?=(?:const|function|class)\s+)/gm,'');
 bundle+=exports.length?`  __modules[${JSON.stringify(id)}] = (() => {\n${body}\n    return { ${exports.join(', ')} };\n  })();\n`:`  (() => {\n${body}\n  })();\n`;
}
bundle+='})();\n';
await writeFile(new URL('app.bundle.js',dist),bundle);
console.log(`Built public bundle from ${modules.length} modules.`);
