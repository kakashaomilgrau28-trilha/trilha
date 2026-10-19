import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import {
  Award, BadgeCheck, Ban, Bell, Check, ChevronDown, Compass, Flag,
  Map as MapIcon, MessageCircle, MoreHorizontal, Package,
  Send, Shield, ShoppingBag, Signal, Sparkles, Trophy, Users, X,
} from 'lucide-react'
import { avatars, players } from './gameData'
import { paranaCities, realClubs } from './realClubs'
import { HumanPortrait } from './world/HumanPortrait'
const OpenWorld = lazy(() => import('./world/OpenWorld'))

import { useCatalog } from './catalog'
import { demoRepository, loadState, saveState } from './demoStore'
import { canRescue, containsPersonalContact, earnedPoints, normalizeNickname, scoreLabel } from './gameLogic'
import type { EditionId, GameState, PageId, Player, Reward } from './model'

const pages: { id: PageId; label: string; icon: typeof MapIcon }[] = [
  { id: 'map', label: 'Explorar', icon: MapIcon },
  { id: 'collection', label: 'Coleção', icon: Package },
  { id: 'ranking', label: 'Placar', icon: Trophy },
  { id: 'chat', label: 'Conversa', icon: MessageCircle },
  { id: 'shop', label: 'Vitrine', icon: ShoppingBag },
]

function App() {
  const { clubs, editions, rewards, source, refresh } = useCatalog()
  const [game, setGame] = useState<GameState>(loadState)
  const [activePage, setActivePage] = useState<PageId>('map')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  // Paved path in Praça General Carneiro, facing the monument and church.
  const [playerPosition, setPlayerPosition] = useState({ x: 47, y: 50.83 })
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [avatarDraft, setAvatarDraft] = useState('trilheiro')
  const [clubDraft, setClubDraft] = useState('')
  const [cityDraft, setCityDraft] = useState('LAPA')
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [rankingFilter, setRankingFilter] = useState<'players' | 'clubs'>('players')
  const [chatDraft, setChatDraft] = useState('')
  const [playerMenu, setPlayerMenu] = useState<string | null>(null)
  const [hiddenPlayers] = useState<string[]>([])
  const [modal, setModal] = useState<'none' | 'qr' | 'report'>('none')

  useEffect(() => saveState(game), [game])
  useEffect(() => { if (!game.nickname) setWelcomeOpen(true) }, [game.nickname])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const edition = editions.find((entry) => entry.id === game.edition) ?? editions[0]
  const editionRewards = rewards.filter((reward) => reward.edition === game.edition)
  const myPoints = earnedPoints(game, game.edition, rewards)
  const visiblePlayers = players.filter((player) => !game.blockedPlayerIds.includes(player.id) && !hiddenPlayers.includes(player.id))
  const claimedThisEdition = (rewardId: string) => game.claims.some((claim) => claim.rewardId === rewardId && claim.edition === game.edition)
  const rewardResult = selectedReward ? canRescue(selectedReward, game.edition, playerPosition, game.claims) : null

  function updateGame(update: Partial<GameState>) {
    setGame((current) => ({ ...current, ...update }))
  }

  function enterGame(event: FormEvent) {
    event.preventDefault()
    const nickname = normalizeNickname(nicknameDraft)
    if (nickname.length < 3) { setToast('Escolha um apelido com pelo menos 3 caracteres.'); return }
    if (containsPersonalContact(nickname)) { setToast('Use um apelido sem telefone ou e-mail.'); return }
    if (!realClubs.some(club => club.id === clubDraft && club.city === cityDraft)) { setToast('Escolha um clube de Desbravadores da cidade selecionada.'); return }
    updateGame({ nickname, avatar: avatarDraft, clubId: clubDraft })
    setWelcomeOpen(false)
    setToast(`Bem-vindo(a), ${nickname}!`)
  }

  async function rescue(reward: Reward, viaQr = false) {
    const result = canRescue(reward, game.edition, viaQr ? { x: reward.x, y: reward.y } : playerPosition, game.claims)
    if (!result.ok) { setToast(scoreLabel(result.reason)); return }
    const response = await demoRepository.claimReward(reward.id, game.edition)
    if (!response.ok) { setToast('Não foi possível validar o resgate. Tente novamente.'); return }
    updateGame({ claims: [...game.claims, result.claim] })
    setSelectedReward(null)
    setModal('none')
    setToast(`${reward.name} foi para sua coleção · +${reward.points} pontos`)
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = chatDraft.trim()
    if (!text) return
    if (text.length > 160) { setToast('A mensagem pode ter até 160 caracteres.'); return }
    if (containsPersonalContact(text)) { setToast('Por segurança, não compartilhe telefone ou e-mail.'); return }
    if (Date.now() - game.lastMessageAt < 8000) { setToast('Aguarde alguns segundos antes de enviar outra mensagem.'); return }
    const message = { id: `mine-${Date.now()}`, playerId: 'me', nickname: game.nickname, avatar: game.avatar, text, sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    updateGame({ messages: [...game.messages, message], lastMessageAt: Date.now() })
    setChatDraft('')
  }

  function selectEdition(value: EditionId) {
    updateGame({ edition: value })
    setSelectedReward(null)
  }

  function toggleMute(playerId: string) {
    const isMuted = game.mutedPlayerIds.includes(playerId)
    updateGame({ mutedPlayerIds: isMuted ? game.mutedPlayerIds.filter((id) => id !== playerId) : [...game.mutedPlayerIds, playerId] })
    setToast(isMuted ? 'Jogador reativado.' : 'Jogador silenciado nesta demonstração.')
    setPlayerMenu(null)
  }

  function blockPlayer(player: Player) {
    updateGame({ blockedPlayerIds: [...game.blockedPlayerIds, player.id] })
    setToast(`${player.nickname} foi bloqueado nesta demonstração.`)
    setPlayerMenu(null)
  }

  function buyCosmetic(productId: string) {
    if (game.purchasedCosmetics.includes(productId)) { setToast('Este item já está na sua conta de demonstração.'); return }
    updateGame({ purchasedCosmetics: [...game.purchasedCosmetics, productId] })
    setToast('Compra simulada concluída. Nenhum pagamento foi processado.')
  }

  const userClaims = game.claims.filter((claim) => claim.edition === game.edition)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setActivePage('map') }}>
          <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
          <span>trilha<span className="brand-dot">.</span><small>mundo compartilhado</small></span>
        </a>
        <div className="side-caption">SEU ESPAÇO</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {pages.map(({ id, label, icon: Icon }) => <button key={id} className={activePage === id ? 'nav-link active' : 'nav-link'} onClick={() => setActivePage(id)}><Icon size={19} /><span>{label}</span>{id === 'chat' && <span className="nav-count">3</span>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-player">
          <AvatarBadge avatar={game.avatar} size="small" />
          <div className="player-copy"><strong>{game.nickname || 'Seu apelido'}</strong><span>{clubs.find((club) => club.id === game.clubId)?.name}</span></div>
          <button className="icon-button muted" aria-label="Editar perfil" onClick={() => { setNicknameDraft(game.nickname); setAvatarDraft(game.avatar); setClubDraft(game.clubId); setCityDraft(realClubs.find(club => club.id === game.clubId)?.city ?? 'LAPA'); setWelcomeOpen(true) }}><MoreHorizontal size={19} /></button>
        </div>
        <div className="sidebar-note"><Shield size={16} /><span>Seu perfil de demonstração fica salvo neste navegador.</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Compass size={18} /></span><b>trilha<span className="brand-dot">.</span></b></div>
          <div className="edition-switch" aria-label="Selecionar edição">
            {editions.map((item) => <button key={item.id} className={item.id === game.edition ? 'edition-pill selected' : 'edition-pill'} onClick={() => selectEdition(item.id)}><span className="edition-dot" style={{ background: item.accent }} />{item.shortLabel}</button>)}
          </div>
          <div className="topbar-right">
            <span className="connection"><i />{source === 'supabase' ? 'Catálogo online' : 'Catálogo local'}</span>
            <button className="icon-button notification-button" aria-label="Notificações"><Bell size={18} /><i /></button>
            <button className="avatar-button" onClick={() => { setNicknameDraft(game.nickname); setAvatarDraft(game.avatar); setClubDraft(game.clubId); setCityDraft(realClubs.find(club => club.id === game.clubId)?.city ?? 'LAPA'); setWelcomeOpen(true) }} aria-label="Abrir perfil"><AvatarBadge avatar={game.avatar} size="small" /></button>
          </div>
        </header>

        <div className="content-area">
          <div className="content-head">
            <div><div className="eyebrow">{edition.label} <span>·</span> Demonstração</div><h1>{activePage === 'map' ? 'Um mundo para explorar.' : pages.find((page) => page.id === activePage)?.label}</h1><p>{activePage === 'map' ? 'Caminhe pela Lapa, encontre lembranças e explore com seu personagem.' : pageSubtitle(activePage)}</p></div>
            <div className="head-actions"><button className="edition-select" onClick={refresh}><Signal size={15} /> {source === 'supabase' ? 'Atualizar catálogo' : 'Recarregar espaço'} <ChevronDown size={14} /></button></div>
          </div>

          {activePage === 'map' && <section className="map-layout">
            <div className="map-column">
              <Suspense fallback={<div className="catalog-state" role="status">Preparando o mundo 3D…</div>}><OpenWorld avatar={game.avatar} nickname={game.nickname} position={playerPosition} paused={welcomeOpen || !!selectedReward || modal !== 'none'} players={visiblePlayers} rewards={editionRewards} claimedIds={userClaims.map(c => c.rewardId)} onPosition={setPlayerPosition} onReward={setSelectedReward} /></Suspense>
              <div className="below-map-hint"><div className="hint-icon"><Compass size={19} /></div><div><b>Explore a pé.</b><span>WASD no computador · analógico flutuante no celular.</span></div></div>
            </div>
            <aside className="right-rail">
              <div className="stat-card points-card"><div className="stat-icon"><Sparkles size={17} /></div><span className="stat-label">SEUS PONTOS · {edition.shortLabel}</span><strong>{myPoints}<small> pts</small></strong><div className="stat-bottom"><span>Somente resgates contam</span><span className="tiny-star">✳</span></div></div>
              <div className="rail-card"><div className="card-heading"><div><h2>Por perto</h2><span>{visiblePlayers.filter((player) => player.online).length} personagens simulados (NPCs)</span></div><button className="icon-button muted" aria-label="Mais sobre jogadores"><MoreHorizontal size={18} /></button></div><div className="nearby-list">{visiblePlayers.filter((player) => player.online).slice(0, 4).map((player) => <NearbyPlayer key={player.id} player={player} onMenu={() => setPlayerMenu(playerMenu === player.id ? null : player.id)} menuOpen={playerMenu === player.id} muted={game.mutedPlayerIds.includes(player.id)} onMute={() => toggleMute(player.id)} onBlock={() => blockPlayer(player)} onReport={() => { setPlayerMenu(null); setModal('report') }} />)}</div><button className="outline-wide" onClick={() => setActivePage('chat')}><MessageCircle size={15} /> Abrir conversa do espaço</button></div>
              <div className="rail-card rewards-mini"><div className="card-heading"><div><h2>Espalhadas por aqui</h2><span>{editionRewards.length - userClaims.length} disponíveis</span></div><button className="link-button" onClick={() => setActivePage('collection')}>Coleção</button></div>{editionRewards.slice(0, 2).map((reward) => <button key={reward.id} className="mini-reward" onClick={() => setSelectedReward(reward)}><span className="mini-reward-art">{reward.icon}</span><span className="mini-reward-copy"><b>{reward.name}</b><small>{reward.category} · {reward.rarity}</small></span><span className="mini-points">+{reward.points}<small> pts</small></span></button>)}</div>
            </aside>
          </section>}

          {activePage === 'collection' && <CollectionPage claims={userClaims} />}
          {activePage === 'ranking' && <RankingPage game={game} rankingFilter={rankingFilter} setRankingFilter={setRankingFilter} />}
          {activePage === 'shop' && <ShopPage game={game} buyCosmetic={buyCosmetic} />}
          {activePage === 'chat' && <ChatPage game={game} chatDraft={chatDraft} setChatDraft={setChatDraft} sendMessage={sendMessage} hiddenPlayers={hiddenPlayers} onReport={() => setModal('report')} />}
        </div>
        <footer className="disclaimer"><span className="disclaimer-symbol">✳</span> Demonstração independente · Cenário 3D · NPCs simulados · Progresso neste navegador <button onClick={() => setToast('Esta versão é demonstrativa. Perfil, resgates e mensagens ficam neste navegador.')}>Saiba mais</button></footer>
      </main>

      <nav className="mobile-nav" aria-label="Navegação inferior">{pages.map(({ id, label, icon: Icon }) => <button key={id} className={activePage === id ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setActivePage(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>

      {welcomeOpen && <div className="overlay"><div className="welcome-modal"><button className="modal-close" onClick={() => setWelcomeOpen(false)} aria-label="Fechar"><X size={19} /></button><div className="welcome-logo"><Compass size={25} /></div><span className="eyebrow">BOAS-VINDAS AO TRILHA</span><h2>Qual é o seu jeito de explorar?</h2><p>Escolha um apelido e um avatar. Não use seu nome completo ou informações pessoais.</p><form onSubmit={enterGame}><label className="field-label" htmlFor="nickname">Seu apelido</label><input id="nickname" className="text-input" value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} placeholder="Ex.: VentoNorte" maxLength={18} autoComplete="off" /><label className="field-label">Escolha seu avatar</label><div className="avatar-picker">{avatars.map((avatar) => <button type="button" key={avatar.id} className={avatarDraft === avatar.id ? 'avatar-choice selected' : 'avatar-choice'} onClick={() => setAvatarDraft(avatar.id)}><AvatarBadge avatar={avatar.id} size="medium" /><span>{avatar.label}</span>{avatarDraft === avatar.id && <i><Check size={12} /></i>}</button>)}</div><label className="field-label" htmlFor="state">Estado</label><select id="state" className="text-input" value="PARANÁ" disabled><option>PARANÁ</option></select><label className="field-label" htmlFor="city">Cidade</label><select id="city" className="text-input" value={cityDraft} onChange={(event) => { setCityDraft(event.target.value); setClubDraft('') }}>{paranaCities.map(city => <option key={city} value={city}>{city}</option>)}</select><label className="field-label" htmlFor="club">Clube de Desbravadores <small>(diretório DSA)</small></label><select id="club" className="text-input" value={clubDraft} onChange={(event) => setClubDraft(event.target.value)} required><option value="">Escolha seu clube</option>{realClubs.filter(club => club.city === cityDraft).map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select><p className="club-source-note">Clubes cadastrados no Paraná em 19/10/2026. <a href="https://clubes.adventistas.org/br/" target="_blank" rel="noreferrer">Consultar diretório oficial ↗</a></p><div className="privacy-hint"><Shield size={15} /> Seu perfil fica neste navegador. Você pode alterá-lo depois.</div><button className="primary-button full" type="submit">Entrar no espaço <Compass size={17} /></button></form></div></div>}

      {selectedReward && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReward(null) }}><div className="reward-modal"><button className="modal-close" onClick={() => setSelectedReward(null)} aria-label="Fechar"><X size={19} /></button><div className="reward-art-large">{selectedReward.icon}<span className="sparkle-a">✦</span><span className="sparkle-b">✧</span></div><span className="eyebrow">{selectedReward.category.toUpperCase()} · {selectedReward.rarity.toUpperCase()}</span><h2>{selectedReward.name}</h2><p>{selectedReward.description}</p><div className="reward-detail-row"><span>Valor no placar</span><b>+{selectedReward.points} pontos</b></div><div className="reward-detail-row"><span>Limite por jogador</span><b>{selectedReward.limit} resgate</b></div><div className="rescue-status">{claimedThisEdition(selectedReward.id) ? <><Check size={16} /> Você já coletou este item.</> : rewardResult?.ok ? <><span className="status-dot ready" /> Disponível para resgate</> : <><span className="status-dot far" /> Fora de alcance · mova seu avatar</>}</div><button className="primary-button full" disabled={claimedThisEdition(selectedReward.id) || !rewardResult?.ok} onClick={() => rescue(selectedReward)}>{claimedThisEdition(selectedReward.id) ? 'Já está na sua coleção' : 'Resgatar recompensa'} <Award size={17} /></button><button className="qr-fallback" onClick={() => setModal('qr')}><span className="qr-mini">▦</span> Validar QR do local <small>alternativa demonstrativa</small></button><small className="modal-footnote">Resgates são demonstração local. A validação real deve acontecer no servidor.</small></div></div>}

      {modal === 'qr' && <div className="overlay"><div className="small-modal"><button className="modal-close" onClick={() => setModal('none')} aria-label="Fechar"><X size={19} /></button><div className="qr-placeholder"><span>▦</span><small>QR</small></div><span className="eyebrow">ALTERNATIVA DE RESGATE</span><h2>Validação por QR</h2><p>No evento, um código QR autorizado pode validar um resgate quando a localização ou a conexão não forem precisas.</p><div className="demo-code">Código demonstrativo <b>TRILHA-UNICO-01</b></div><button className="primary-button full" onClick={() => selectedReward ? rescue(selectedReward, true) : (setToast('A validação do QR é demonstrativa e exige escolher uma recompensa.'), setModal('none'))}>Validar código demonstrativo <Check size={17} /></button><small className="modal-footnote">Código fictício de uso único, simulado localmente. Códigos reais precisam ser validados no servidor.</small></div></div>}

      {modal === 'report' && <div className="overlay"><div className="small-modal report-modal"><button className="modal-close" onClick={() => setModal('none')} aria-label="Fechar"><X size={19} /></button><div className="welcome-logo warning"><Flag size={22} /></div><span className="eyebrow">CUIDADO COM A COMUNIDADE</span><h2>Denunciar jogador</h2><p>Na demonstração, o relato não é enviado para nenhum serviço.</p><textarea className="text-input report-input" maxLength={240} placeholder="Conte brevemente o que aconteceu (opcional)" /><button className="primary-button full" onClick={() => { setModal('none'); setToast('Denúncia registrada apenas nesta demonstração.') }}>Enviar relato demonstrativo <Flag size={16} /></button></div></div>}

      {toast && <div className="toast" role="status"><BadgeCheck size={17} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
    </div>
  )
}

function pageSubtitle(page: PageId) {
  const subtitles: Record<PageId, string> = { map: 'Explore o mapa compartilhado.', collection: 'Lembranças que você encontrou por aqui.', ranking: 'Uma disputa amigável, separada por edição.', shop: 'Visuais opcionais, sem vantagem no jogo.', chat: 'Conversa pública do espaço. Sem mensagens privadas.' }
  return subtitles[page]
}

function AvatarBadge({ avatar, size }: { avatar: string; size: 'tiny' | 'small' | 'medium' | 'large' }) {
  const option = avatars.find((item) => item.id === avatar) ?? avatars[0]
  return <span className={`avatar-badge ${size}`} style={{ background: option.color }}><HumanPortrait avatar={avatar} /></span>
}

function NearbyPlayer({ player, onMenu, menuOpen, muted, onMute, onBlock, onReport }: { player: Player; onMenu: () => void; menuOpen: boolean; muted: boolean; onMute: () => void; onBlock: () => void; onReport: () => void }) {
  const { clubs } = useCatalog()
  const club = clubs.find((item) => item.id === player.clubId)
  return <div className="nearby-row"><AvatarBadge avatar={player.avatar} size="small" /><div className="nearby-copy"><b>{player.nickname}</b><span><i style={{ background: club?.color }} />{club?.name || 'Sem clube'} · NPC</span></div><button className="icon-button muted" onClick={onMenu} aria-label={`Opções para ${player.nickname}`}><MoreHorizontal size={18} /></button>{menuOpen && <div className="player-popover"><button onClick={onMute}><Bell size={14} />{muted ? 'Reativar' : 'Silenciar'}</button><button onClick={onBlock}><Ban size={14} />Bloquear</button><button onClick={onReport}><Flag size={14} />Denunciar</button></div>}</div>
}

function CollectionPage({ claims }: { claims: GameState['claims'] }) {
  const { rewards } = useCatalog()
  const owned = claims.map((claim) => rewards.find((reward) => reward.id === claim.rewardId)).filter((reward): reward is Reward => Boolean(reward))
  return <section className="page-panel"><div className="panel-toolbar"><div><h2>Seu álbum</h2><p>{owned.length} {owned.length === 1 ? 'lembrança encontrada' : 'lembranças encontradas'} nesta edição</p></div><span className="count-chip">{owned.length} ITENS</span></div>{owned.length ? <div className="collection-grid">{owned.map((reward) => <article key={reward.id} className="collection-item"><div className="collection-art">{reward.icon}</div><div className="collection-copy"><span>{reward.category} · {reward.rarity}</span><b>{reward.name}</b><small>+{reward.points} pontos</small></div><BadgeCheck size={19} /></article>)}</div> : <div className="empty-state"><div className="empty-icon"><Package size={25} /></div><h3>Seu álbum começa aqui</h3><p>Encontre uma recompensa no mapa para guardar a primeira lembrança.</p><span>Os itens são digitais e não podem ser transferidos nesta demonstração.</span></div>}</section>
}

function RankingPage({ game, rankingFilter, setRankingFilter }: { game: GameState; rankingFilter: 'players' | 'clubs'; setRankingFilter: (filter: 'players' | 'clubs') => void }) {
  const { clubs, editions, rewards } = useCatalog()
  const scores = { preview: [145, 120, 95, 80, 60], alpha: [225, 190, 170, 115, 85], omega: [180, 160, 125, 95, 70] }[game.edition]
  const boardPlayers = [...players.slice(0, 4).map((player, index) => ({ id: player.id, name: player.nickname, avatar: player.avatar, club: player.clubId, points: scores[index], me: false })), { id: 'me', name: game.nickname || 'Você', avatar: game.avatar, club: game.clubId, points: earnedPoints(game, game.edition, rewards), me: true }].sort((a, b) => b.points - a.points)
  const clubScores = clubs.filter(club => club.id === game.clubId).map(club => ({ ...club, points: earnedPoints(game, game.edition, rewards) }))
  return <section className="page-panel"><div className="panel-toolbar"><div><h2>Placar {editions.find((item) => item.id === game.edition)?.label}</h2><p>Seu progresso demonstrativo aparece separado por edição.</p></div><span className="demo-chip">PONTOS LOCAIS</span></div><div className="segmented-control"><button className={rankingFilter === 'players' ? 'selected' : ''} onClick={() => setRankingFilter('players')}>Jogadores</button><button className={rankingFilter === 'clubs' ? 'selected' : ''} onClick={() => setRankingFilter('clubs')}>Clubes</button></div><div className="ranking-table"><div className="ranking-head"><span>POS.</span><span>{rankingFilter === 'players' ? 'JOGADOR' : 'CLUBE'}</span><span>PONTOS</span></div>{rankingFilter === 'players' ? boardPlayers.map((player, index) => <div key={player.id} className={`ranking-row ${player.me ? 'me' : ''}`}><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="ranking-person"><AvatarBadge avatar={player.avatar} size="small" /><span><b>{player.name}{player.me && <em>você</em>}</b><small>{clubs.find((club) => club.id === player.club)?.name}</small></span></span><b className="ranking-points">{player.points}<small> pts</small></b></div>) : clubScores.map((club, index) => <div key={club.id} className="ranking-row"><span className={`rank-number rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="ranking-person"><span className="club-medallion" style={{ background: club.color }}>{club.name.slice(0, 1)}</span><span><b>{club.name}</b><small>{realClubs.find(item => item.id === club.id)?.city} · seus pontos neste navegador</small></span></span><b className="ranking-points">{club.points}<small> pts</small></b></div>)}</div><div className="ranking-foot"><Shield size={16} /><span>Pontos desta demonstração local. Não existe classificação oficial dos clubes.</span></div></section>
}

function ShopPage({ game, buyCosmetic }: { game: GameState; buyCosmetic: (id: string) => void }) {
  const { cosmetics } = useCatalog()
  return <section className="page-panel"><div className="shop-banner"><div><span className="eyebrow">VITRINE DO ESPAÇO</span><h2>Seu estilo, seu caminho.</h2><p>Itens visuais opcionais. Nenhum produto muda alcance, pontos ou resgates.</p></div><span className="shop-banner-emoji">🎒</span></div><div className="shop-heading"><div><h2>Cosméticos</h2><p>Compra simulada · nenhum pagamento é processado</p></div><span className="demo-chip">DEMONSTRAÇÃO</span></div><div className="shop-grid">{cosmetics.map((product, index) => { const purchased = game.purchasedCosmetics.includes(product.id); return <article className="product-card" key={product.id}><div className={`product-art product-art-${index}`}>{product.icon}<span className="product-sparkle">✦</span></div><div className="product-info"><span>{product.type}</span><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><b>R$ {product.price.toFixed(2).replace('.', ',')}</b><button className={purchased ? 'buy-button purchased' : 'buy-button'} onClick={() => buyCosmetic(product.id)}>{purchased ? <><Check size={15} />Adquirido</> : 'Experimentar'}</button></div></div></article>})}</div><div className="shop-policy"><Shield size={17} /><p><b>Uma loja segura começa com clareza.</b><span>Compras reais exigem autorização do responsável para menores, checkout seguro, condições adequadas aos países participantes e revisão dos requisitos legais.</span></p></div></section>
}

function ChatPage({ game, chatDraft, setChatDraft, sendMessage, hiddenPlayers, onReport }: { game: GameState; chatDraft: string; setChatDraft: (text: string) => void; sendMessage: (event: FormEvent) => void; hiddenPlayers: string[]; onReport: () => void }) {
  const messages = game.messages.filter((message) => !hiddenPlayers.includes(message.playerId) && !game.mutedPlayerIds.includes(message.playerId) && !game.blockedPlayerIds.includes(message.playerId))
  return <section className="page-panel chat-panel"><div className="chat-header"><div className="chat-room-icon"><Users size={19} /></div><div><h2>Praça do encontro</h2><span><i /> conversa demonstrativa · mensagens neste navegador</span></div><button className="icon-button muted" onClick={onReport} aria-label="Ajuda e denúncia"><Flag size={17} /></button></div><div className="safety-banner"><Shield size={16} /><span>Este espaço é público. Não compartilhe seu nome completo, telefone, e-mail ou localização.</span></div><div className="message-list">{messages.map((message) => <article className={`message-row ${message.playerId === 'me' ? 'mine' : ''}`} key={message.id}><AvatarBadge avatar={message.avatar} size="small" /><div className="message-body"><div><b>{message.nickname}</b><time>{message.sentAt}</time></div><p>{message.text}</p>{message.playerId !== 'me' && <button className="message-report" onClick={onReport}>Denunciar</button>}</div></article>)}</div><form className="chat-composer" onSubmit={sendMessage}><input className="text-input" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} maxLength={160} placeholder="Escreva para o espaço..." aria-label="Mensagem" /><span>{chatDraft.length}/160</span><button className="send-button" type="submit" aria-label="Enviar mensagem"><Send size={17} /></button></form><div className="chat-note">Mensagens limitadas a 160 caracteres e uma a cada 8 segundos.</div></section>
}

export default App
