// Reproducible snapshot of a small center area. The output is an ODbL data extract.
// Source: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright
import fs from 'node:fs/promises'

const center = { lat: -25.7675993, lng: -49.7164928 } // Praça General Carneiro, OSM way 307355210
const bbox = [-25.7702, -49.7195, -25.7650, -49.7135]
const [south, west, north, east] = bbox
const query = `[out:json][timeout:30];(way["highway"](${south},${west},${north},${east});way["building"](${south},${west},${north},${east});way["leisure"="park"](${south},${west},${north},${east});node["historic"](${south},${west},${north},${east});node["tourism"](${south},${west},${north},${east});node["amenity"="theatre"](${south},${west},${north},${east}););out geom;`
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TrilhaCampori/0.1 public demo' },
  body: new URLSearchParams({ data: query }),
})
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}: ${(await response.text()).slice(0,200)}`)
const data = await response.json()
const coord = point => [Math.round((point.lon - center.lng) * 111320 * Math.cos(center.lat * Math.PI / 180) * 10) / 10, Math.round((center.lat - point.lat) * 111320 * 10) / 10]
const within = point => Math.abs(point[0]) <= 300 && Math.abs(point[1]) <= 300
const ways = data.elements.filter(e => e.type === 'way' && e.geometry?.length > 1)
const roads = ways.filter(e => e.tags.highway).map(e => ({ id: e.id, name: e.tags.name ?? '', kind: e.tags.highway, points: e.geometry.map(coord).filter(within) })).filter(e => e.points.length > 1)
const buildings = ways.filter(e => e.tags.building).map(e => ({ id: e.id, name: e.tags.name ?? '', levels: Math.min(8, Math.max(1, Number(e.tags['building:levels']) || 1)), points: e.geometry.map(coord) })).filter(e => e.points.length > 3 && e.points.every(within))
const parks = ways.filter(e => e.tags.leisure === 'park').map(e => ({ id: e.id, name: e.tags.name ?? '', points: e.geometry.map(coord) })).filter(e => e.points.length > 3)
const places = data.elements.filter(e => e.type === 'node' && e.tags.name).map(e => ({ id: e.id, name: e.tags.name, kind: e.tags.historic ?? e.tags.tourism ?? e.tags.amenity, point: coord({ lat: e.lat, lon: e.lon }) })).filter(e => within(e.point))
if (roads.length < 8 || buildings.length < 10 || !parks.some(p => p.name.includes('General Carneiro'))) throw new Error(`Dados incompletos: ${roads.length} vias, ${buildings.length} prédios, ${parks.length} parques`)
const result = { attribution: '© OpenStreetMap contributors, ODbL 1.0', source: 'https://www.openstreetmap.org/copyright', retrieved: new Date().toISOString().slice(0, 10), center, bbox, roads, buildings, parks, places }
await fs.mkdir('src/data', { recursive: true })
await fs.writeFile('src/data/lapa-center-osm.json', JSON.stringify(result) + '\n')
console.log(`Centro da Lapa: ${roads.length} ruas/caminhos, ${buildings.length} edifícios, ${parks.length} praças/parques, ${places.length} pontos nomeados`)
