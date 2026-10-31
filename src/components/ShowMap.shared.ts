// Shared by the iPhone (Apple Maps) and web versions of the shows map.

export type MapShow = { id: string; title: string; when: string; lat: number; lng: number };
export type ShowMapProps = { shows: MapShow[]; onOpen: (id: string) => void };

/** San Diego, where Nexus shows happen for now. */
export const MAP_CENTER = { latitude: 32.8, longitude: -117.17 };
