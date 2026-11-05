// Свой обфускатор на TypeScript-парсере: все строковые литералы уезжают в
// зашифрованный (base64 от UTF-8) массив, а в коде остаётся _0x..(0x..).
// Глобальные имена функций НЕ трогаем — сайт продолжает работать.
// node tools/obfuscate.mjs <вход.js> <выход.js>
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ts = require('/opt/node22/lib/node_modules/typescript');

const [inPath, outPath] = process.argv.slice(2);
const code = fs.readFileSync(inPath, 'utf8');
const sf = ts.createSourceFile(inPath, code, ts.ScriptTarget.ES2017, true);

// имена-приманки: hex, которых в исходнике нет
const rnd = () => '_0x' + Math.floor(Math.random() * 0xfffff).toString(16).padStart(5, '0');
let ARR = rnd(), CACHE = rnd(), DEC = rnd();
while (code.includes(ARR) || code.includes(CACHE) || code.includes(DEC)) { ARR = rnd(); CACHE = rnd(); DEC = rnd(); }

const strings = [];
const f = ts.factory;

function isDirective(node) {
  const p = node.parent;
  return p && ts.isExpressionStatement(p) && p.expression === node && node.text === 'use strict';
}
function isPropName(node) {
  const p = node.parent;
  return p && (ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)
    || ts.isGetAccessorDeclaration(p) || ts.isSetAccessorDeclaration(p) || ts.isEnumMember(p)) && p.name === node;
}

const transformer = (ctx) => (root) => {
  const visit = (node) => {
    if (ts.isStringLiteral(node) && !isDirective(node) && !isPropName(node)) {
      const idx = strings.push(Buffer.from(node.text, 'utf8').toString('base64')) - 1;
      return f.createCallExpression(f.createIdentifier(DEC), undefined, [f.createNumericLiteral('0x' + idx.toString(16))]);
    }
    return ts.visitEachChild(node, visit, ctx);
  };
  return ts.visitNode(root, visit);
};

const result = ts.transform(sf, [transformer]);
const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const body = printer.printFile(result.transformed[0]);
result.dispose();

// декодер с кешем: каждая строка расшифровывается один раз (без просадки на слабых телефонах)
const header =
  'var ' + ARR + '=' + JSON.stringify(strings) + ',' + CACHE + '=[];\n' +
  'function ' + DEC + '(i){return ' + CACHE + '[i]!==undefined?' + CACHE + '[i]:(' + CACHE + '[i]=decodeURIComponent(escape(atob(' + ARR + '[i]))))}\n';

fs.writeFileSync(outPath, header + body);
console.error('ok', inPath.split('/').slice(-2).join('/'), '→ строк в массиве:', strings.length);
