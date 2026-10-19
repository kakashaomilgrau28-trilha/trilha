import * as THREE from 'three'
import { geographicPosition, LAPA } from './physics'

let loading: Promise<void> | undefined
function loadMaps() {
  if (window.google?.maps?.Map) return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => { script.remove(); loading = undefined; reject(new Error('O Google Maps não respondeu.')) }, 15000)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)}&v=weekly&language=pt-BR`
    script.async = true
    script.onload = () => { clearTimeout(timer); resolve() }
    script.onerror = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('Não foi possível carregar o Google Maps.')) }
    document.head.append(script)
  })
  return loading
}

/** Official Maps basemap and shared WebGL context; no downloaded or traced tiles. */
export async function googleWorld(host: HTMLElement, scene: THREE.Scene, signal: AbortSignal, onError: (message: string) => void) {
  await loadMaps()
  if (signal.aborted) return null
  const map = new google.maps.Map(host, {
    center: LAPA, zoom: 20, tilt: 67.5, heading: 0,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
    renderingType: google.maps.RenderingType.VECTOR,
    disableDefaultUI: true, keyboardShortcuts: false, gestureHandling: 'none', clickableIcons: false,
  })
  const camera = new THREE.PerspectiveCamera()
  // Our world uses X east, Y up, Z south. Google local frame is X east, Y north, Z up.
  const rotate = new THREE.Matrix4().makeRotationX(Math.PI / 2)
  const overlay = new google.maps.WebGLOverlayView()
  let renderer: THREE.WebGLRenderer | undefined
  let rendered = false
  const timer = window.setTimeout(() => { if (!rendered) onError('O mapa não abriu. Confira a chave, as restrições e a API no Google Cloud, ou volte ao cenário provisório.') }, 20000)
  overlay.onContextRestored = ({ gl }) => {
    renderer = new THREE.WebGLRenderer({ canvas: gl.canvas as HTMLCanvasElement, context: gl, ...gl.getContextAttributes() })
    renderer.autoClear = false
  }
  overlay.onDraw = ({ transformer }) => {
    if (!renderer || signal.aborted) return
    camera.projectionMatrix.fromArray(transformer.fromLatLngAltitude({ ...LAPA, altitude: 0 })).multiply(rotate)
    renderer.render(scene, camera)
    renderer.resetState()
    rendered = true; clearTimeout(timer)
  }
  overlay.onContextLost = () => onError('A renderização do mapa foi interrompida. Reabra o cenário.')
  overlay.onRemove = () => { renderer?.dispose(); clearTimeout(timer) }
  overlay.setMap(map)
  return {
    draw(x: number, z: number) { map.moveCamera({ center: geographicPosition(x, z), zoom: 20, tilt: 67.5, heading: 0 }); overlay.requestRedraw() },
    dispose() { clearTimeout(timer); overlay.setMap(null); google.maps.event.clearInstanceListeners(map); host.replaceChildren() },
  }
}
