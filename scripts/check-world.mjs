import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import ts from 'typescript'
const source = await fs.readFile(new URL('../src/world/physics.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { stepPosition, geographicPosition, LAPA } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const origin = { x: 0, y: 0 }
const straight = stepPosition(origin, 1, 0, 1, 4.2, [])
const diagonal = stepPosition(origin, 1, 1, 1, 4.2, [])
assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - straight.x) < 1e-9, 'diagonal must not move faster')
let framed = origin
for (let i = 0; i < 60; i++) framed = stepPosition(framed, 1, 0, 1 / 60, 4.2, [])
assert.ok(Math.abs(framed.x - straight.x) < 1e-9, 'movement must not depend on frame rate')
const wall = [{ x: 3, z: 0, width: 1, depth: 10 }]
assert.ok(stepPosition(origin, 1, 0, 1, 30, wall).x < 2.11, 'cannot tunnel through buildings')
assert.ok(stepPosition({ x: 115, y: 0 }, 1, 0, 1, 8, []).x <= 116, 'world boundary')
assert.deepEqual(stepPosition(origin, 0, 0, 1, 8, []), origin, 'released controls stop movement')
assert.deepEqual(geographicPosition(0, 0), LAPA)
assert.ok(geographicPosition(20, 20).lat < LAPA.lat && geographicPosition(20, 20).lng > LAPA.lng)
console.log('PASS: normalized speed, frame rate, collisions, bounds, stopped input and Lapa coordinates')
