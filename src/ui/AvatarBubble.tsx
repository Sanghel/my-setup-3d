import { useSceneStore } from '../state/sceneStore'
import { avatarBubble } from './hotspotElements'

/** Lo que dice el muñeco: el saludo y unos emojis que saltan uno tras otro. */
const AVATAR_GREETING = '¡Bienvenidos a mi setup!'
const AVATAR_EMOJIS = ['👋', '⚽', '💻', '🔥']

/**
 * Globo de chat al estilo Habbo sobre el muñeco del autor (ajustes visuales 3, D8). La posición la
 * escribe <HotspotProbe> en cada cuadro (sobre la cabeza del muñeco), como con los puntos. Solo se ve
 * en la vista general: al inspeccionar, el muñeco se desvanece y el globo también.
 */
export function AvatarBubble() {
  const visible = useSceneStore((s) => s.mode === 'overview')
  return (
    <div
      className={`avatar-bubble${visible ? '' : ' avatar-bubble--hidden'}`}
      ref={(el) => {
        avatarBubble.element = el
      }}
      aria-hidden={!visible}
    >
      <p className="avatar-bubble__box">
        <span className="avatar-bubble__name">Sanghel:</span> {AVATAR_GREETING}{' '}
        <span className="avatar-bubble__emojis" aria-hidden="true">
          {AVATAR_EMOJIS.map((emoji, index) => (
            <span key={emoji} className="avatar-bubble__emoji" style={{ animationDelay: `${index * 0.18}s` }}>
              {emoji}
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}
