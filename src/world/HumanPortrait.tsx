const colors = [
  ['#d59b57', '#bb825b', '#332921'], ['#7199a5', '#e2b38d', '#49312b'],
  ['#66917a', '#805337', '#211e20'], ['#bf7f74', '#b97d55', '#322421'],
  ['#9380b4', '#e3b590', '#633b26'], ['#be945a', '#724d39', '#201d1b'],
]
const ids = ['trilheiro', 'observadora', 'guardiao', 'cartografa', 'naturalista', 'pioneiro']
export function HumanPortrait({ avatar }: { avatar: string }) {
  const [shirt, skin, hair] = colors[Math.max(0, ids.indexOf(avatar))]
  return <svg className="human-portrait" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 64v-8c0-15 44-15 44 0v8" fill={shirt}/><path d="M27 37h10v15H27z" fill={skin}/><ellipse cx="32" cy="28" rx="14" ry="18" fill={skin}/><path d="M18 26V18c0-17 30-16 29 3l-5 4-3-11-21 9" fill={hair}/><circle cx="26" cy="29" r="1.6" fill="#2e2a27"/><circle cx="38" cy="29" r="1.6" fill="#2e2a27"/><path d="M28 37q4 3 8 0" fill="none" stroke="#865444" strokeWidth="1.5"/><path d="m23 48 9 7 9-7-7 15h-4z" fill="#f3cb5d"/></svg>
}
