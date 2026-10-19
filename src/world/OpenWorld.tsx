import { useEffect, useRef, useState, type PointerEvent } from 'react'
import * as THREE from 'three'
import { avatars } from '../gameData'
import type { Player, Reward } from '../model'
import { buildTown, disposeScene, label, person } from './scene'
import { pointInPolygon, stepPosition, WORLD_SIZE, type Obstacle, type Position } from './physics'
import './world.css'

type Props = {
  avatar: string; nickname: string; position: Position; paused: boolean
  players: Player[]; rewards: Reward[]; claimedIds: string[]
  onPosition: (p: Position) => void; onReward: (reward: Reward) => void
}
export default function OpenWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const joystick = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const input = useRef({ x: 0, z: 0, run: false })
  const touch = useRef<{ id: number; x: number; y: number } | null>(null)
  const latest = useRef(props); latest.current = props
  const [error, setError] = useState('')
  const [nearby, setNearby] = useState<Reward | null>(null)
  const [help, setHelp] = useState(false)
  latest.current = { ...props, paused: props.paused || help }
  const [attempt, setAttempt] = useState(0)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const rewardKey = props.rewards.map(r => `${r.id}:${r.x}:${r.y}`).join('|')
  const playerKey = props.players.map(p => p.id).join('|')

  useEffect(() => {
    if (!host.current) return
    const container = host.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#b8d4d6'); scene.fog = new THREE.Fog('#c0d3ca', 80, 360)
    scene.add(new THREE.HemisphereLight('#fff6dc', '#68846c', 2.2))
    const sun = new THREE.DirectionalLight('#fff2d2', 2.8); sun.position.set(30, 60, 20); scene.add(sun)
    const obstacles: Obstacle[] = buildTown(scene)
    const actor = person(Math.max(0, avatars.findIndex(a => a.id === latest.current.avatar)))
    scene.add(actor.root)
    const name = label(latest.current.nickname || 'Você'); name.position.y = 2.6; actor.root.add(name)
    const npcs = latest.current.players.map((p, i) => {
      const npc = person(i + 1); npc.root.position.set((p.x - 50) * WORLD_SIZE / 100, 0, (p.y - 50) * WORLD_SIZE / 100)
      npc.root.rotation.y = i * 1.9
      const tag = label(`${p.nickname} · NPC`); tag.position.y = 2.6; npc.root.add(tag)
      scene.add(npc.root); return npc
    })
    const rewardMeshes = latest.current.rewards.map(r => {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(.8), new THREE.MeshStandardMaterial({ color: '#f5c357', metalness: .45, roughness: .3, emissive: '#6a3c08' }))
      mesh.position.set((r.x - 50) * WORLD_SIZE / 100, 1.8, (r.y - 50) * WORLD_SIZE / 100)
      const tag = label(r.name); tag.position.y = 1.5; mesh.add(tag); scene.add(mesh)
      return { reward: r, mesh }
    })
    let p = { x: (latest.current.position.x - 50) * WORLD_SIZE / 100, y: (latest.current.position.y - 50) * WORLD_SIZE / 100 }
    const keys = new Set<string>()
    let renderer: THREE.WebGLRenderer | undefined
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 600)
    const cameraTarget = new THREE.Vector3(), lookAt = new THREE.Vector3()
    camera.position.set(p.x - 11, 12, p.y + 16)
    const resize = () => {
      if (!renderer) return
      const w = container.clientWidth, h = container.clientHeight
      renderer.setSize(w, h); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix()
    }
    setError('')
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.domElement.setAttribute('aria-label', 'Centro histórico da Lapa em 3D com personagem humano')
      container.appendChild(renderer.domElement); resize()
    } catch { setError('Este navegador não conseguiu iniciar o 3D. Ative a aceleração gráfica ou tente outro navegador.') }
    const observer = new ResizeObserver(resize); observer.observe(container)
    const reset = () => { keys.clear(); input.current = { x: 0, z: 0, run: false }; touch.current = null; if (joystick.current) joystick.current.style.display = 'none' }
    const keyCode = (e: KeyboardEvent) => e.code || ({ w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', e: 'KeyE', Shift: 'ShiftLeft' }[e.key] ?? e.key)
    const keyDown = (e: KeyboardEvent) => {
      if (latest.current.paused || !(document.activeElement === surface.current || surface.current?.contains(document.activeElement))) return
      if ((e.target as HTMLElement).closest('input,textarea,select,button,a')) return
      const code = keyCode(e)
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(code)) { e.preventDefault(); keys.add(code) }
      if (code === 'KeyE' && !e.repeat) {
        const r = latest.current.rewards.find(r => !latest.current.claimedIds.includes(r.id) && Math.hypot((r.x-50)*WORLD_SIZE/100-p.x, (r.y-50)*WORLD_SIZE/100-p.y) < 5)
        if (r) latest.current.onReward(r)
      }
    }
    const keyUp = (e: KeyboardEvent) => keys.delete(keyCode(e))
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset)
    const leaveFocus = (e: FocusEvent) => { if (!surface.current?.contains(e.relatedTarget as Node)) reset() }
    surface.current?.addEventListener('focusout', leaveFocus)
    const focusedSurface = surface.current
    let frame = 0, last = performance.now(), published = 0
    const tick = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now
      if (latest.current.paused || document.hidden) reset()
      const enabled = !latest.current.paused && !document.hidden
      const dx = enabled ? Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + input.current.x : 0
      const dz = enabled ? Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + input.current.z : 0
      const next = stepPosition(p, dx, dz, dt, keys.has('ShiftLeft') || keys.has('ShiftRight') || input.current.run ? 8 : 4.2, obstacles)
      const moving = Math.hypot(next.x-p.x, next.y-p.y) > .0001
      if (moving) actor.root.rotation.y = Math.atan2(dx, dz)
      p = next; actor.root.position.set(p.x, 0, p.y); actor.animate(now / 1000, moving)
      npcs.forEach(npc => npc.animate(now / 1000, false))
      for (const { reward, mesh } of rewardMeshes) {
        mesh.visible = !latest.current.claimedIds.includes(reward.id)
        mesh.rotation.y = now * .0008; mesh.position.y = 1.8 + Math.sin(now * .002) * .2
      }
      if (now - published > 100) {
        published = now
        latest.current.onPosition({ x: p.x / WORLD_SIZE * 100 + 50, y: p.y / WORLD_SIZE * 100 + 50 })
        setCoords({ x: Math.round(p.x), y: Math.round(p.y) })
        setNearby(latest.current.rewards.find(r => !latest.current.claimedIds.includes(r.id) && Math.hypot((r.x-50)*WORLD_SIZE/100-p.x, (r.y-50)*WORLD_SIZE/100-p.y)<5) ?? null)
      }
      if (!document.hidden) {
        if (renderer) {
          const cameraBlocked = (x: number, z: number) => obstacles.some(o => o.polygon && pointInPolygon(x, z, o.polygon))
          const cameraDistance = [16, 10, 5, 2].find(distance => !cameraBlocked(p.x - distance * .7, p.y + distance)) ?? 2
          cameraTarget.set(p.x - cameraDistance * .7, 12, p.y + cameraDistance); camera.position.lerp(cameraTarget, 1 - Math.exp(-6 * dt))
          lookAt.set(p.x + 8, 1, p.y - 3); camera.lookAt(lookAt); renderer.render(scene, camera)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); reset()
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset)
      focusedSurface?.removeEventListener('focusout', leaveFocus)
      renderer?.dispose(); container.replaceChildren(); disposeScene(scene)
    }
  }, [props.avatar, props.nickname, rewardKey, playerKey, attempt])

  function start(e: PointerEvent<HTMLDivElement>) {
    if (latest.current.paused || (e.target as HTMLElement).closest('button,a,summary,details') || touch.current) return
    e.currentTarget.focus({ preventScroll: true })
    if (e.pointerType === 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    touch.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (joystick.current) { joystick.current.style.cssText = `display:block;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px` }
    if (thumb.current) thumb.current.style.transform = 'translate(0,0)'
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!touch.current || touch.current.id !== e.pointerId) return
    const dx = e.clientX - touch.current.x, dy = e.clientY - touch.current.y
    const length = Math.hypot(dx, dy), scale = Math.max(1, length / 45)
    input.current.x = length < 5 ? 0 : dx / scale / 45; input.current.z = length < 5 ? 0 : dy / scale / 45
    if (thumb.current) thumb.current.style.transform = `translate(${dx/scale}px,${dy/scale}px)`
  }
  function stop(e: PointerEvent<HTMLDivElement>) {
    if (touch.current?.id !== e.pointerId) return
    touch.current = null; input.current.x = 0; input.current.z = 0
    if (joystick.current) joystick.current.style.display = 'none'
  }
  return <section className="open-world">
    <div className="world-toolbar"><div><span className="world-live-dot" /> CENTRO DA LAPA <small>PARANÁ · BRASIL</small></div><div><span className="world-data-label">RUAS E EDIFÍCIOS REAIS</span><button onClick={() => setHelp(v => !v)} aria-label="Ajuda e controles">?</button></div></div>
    <div className="world-surface" ref={surface} tabIndex={0} aria-label="Explorar Lapa. Clique aqui e use WASD ou setas. No celular, toque e arraste para andar." onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      <div ref={host} className="world-renderer" />
      <div className="world-location"><small>01 / EXPLORE O MUNDO</small><b>Bem-vindo à Lapa.</b><span>Praça General Carneiro · ruas e prédios mapeados</span></div>
      <div className="world-minimap" aria-label={`Posição virtual: ${coords.x}, ${coords.y} metros`}><span>N ↑</span><i style={{ left: `${coords.x / WORLD_SIZE * 100 + 50}%`, top: `${coords.y / WORLD_SIZE * 100 + 50}%` }} /><small>{coords.x} / {coords.y} m</small></div>
      <div className="world-control-hint"><span className="desktop-controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> andar · <kbd>Shift</kbd> correr</span><span className="mobile-controls">Toque e arraste para andar</span></div>
      <div className="floating-stick" ref={joystick} aria-hidden="true"><div ref={thumb} /></div>
      <button className="world-run" aria-pressed={input.current.run} onClick={() => { input.current.run = !input.current.run; setCoords(v => ({ ...v })); surface.current?.focus({ preventScroll: true }) }}>Correr</button>
      {nearby && <button className="world-interact" onClick={() => props.onReward(nearby)}>E · {nearby.name} →</button>}
      {error && <div className="world-error" role="alert"><b>O cenário precisa de atenção</b><p>{error}</p><button onClick={() => setAttempt(v => v + 1)}>Tentar novamente</button></div>}
      {help && <div className="world-help"><button onClick={() => setHelp(false)} aria-label="Fechar ajuda">×</button><h3>Uma pessoa, um mundo.</h3><p>Clique no cenário e use WASD ou as setas. Shift para correr. No celular, toque e arraste: o analógico aparece sob seu dedo. Aproxime-se das lembranças e pressione E.</p><p>O traçado das ruas, a Praça General Carneiro e os contornos dos edifícios vêm de dados do OpenStreetMap. A aparência dos prédios, vegetação e iluminação são interpretações artísticas. O percurso é virtual, sem GPS.</p><p>Os acompanhantes identificados como NPC são simulados. Não representam pessoas conectadas.</p></div>}
    </div>
    <div className="world-caption"><span>Personagens 3D · caminhada livre · NPCs simulados</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a></div>
  </section>
}
