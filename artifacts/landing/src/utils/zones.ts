export interface Zone {
  id: string;
  nom: string;
  couleur: string;
  emoji: string;
  lat: number;
  lon: number;
}

export const ZONES: Zone[] = [
  { id: "centre",     nom: "Centre",            couleur: "#4CAF50", emoji: "🏙️", lat: 3.8617, lon: 11.5208 },
  { id: "bastos",     nom: "Bastos / Nlongkak", couleur: "#2196F3", emoji: "🏘️", lat: 3.8850, lon: 11.5050 },
  { id: "biyem_assi", nom: "Biyem-Assi / Odza", couleur: "#FF9800", emoji: "🌿", lat: 3.8300, lon: 11.4897 },
  { id: "essos",      nom: "Essos / Mimboman",  couleur: "#9C27B0", emoji: "🏡", lat: 3.8780, lon: 11.5500 },
  { id: "ekounou",    nom: "Ekounou / Nsam",    couleur: "#F44336", emoji: "🛖", lat: 3.8330, lon: 11.5394 },
  { id: "soa",        nom: "Soa",               couleur: "#795548", emoji: "🌾", lat: 3.9850, lon: 11.5806 },
];

function hypot(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111;
  const dLon = (lon2 - lon1) * 111 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

export function assignerZone(latitude: number, longitude: number): Zone {
  return ZONES.reduce((best, z) =>
    hypot(latitude, longitude, z.lat, z.lon) < hypot(latitude, longitude, best.lat, best.lon) ? z : best
  );
}
