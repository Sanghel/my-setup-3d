/** Elemento DOM de cada punto de interés (por id de objeto): <Hotspots> los registra, <HotspotProbe> los mueve. */
export const hotspotElements = new Map<string, HTMLElement>()

/** Globo de chat del muñeco del autor: <AvatarBubble> lo registra y <HotspotProbe> lo mueve sobre su cabeza. */
export const avatarBubble: { element: HTMLElement | null } = { element: null }
