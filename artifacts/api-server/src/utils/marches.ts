export interface Marche {
  nom: string;
  latitude: number;
  longitude: number;
}

export const MARCHES_YAOUNDE: Marche[] = [
  { nom: "Marché Mokolo",         latitude: 3.8693, longitude: 11.5100 },
  { nom: "Marché Mfoundi",        latitude: 3.8617, longitude: 11.5208 },
  { nom: "Marché Mvog-Mbi",       latitude: 3.8506, longitude: 11.5219 },
  { nom: "Marché Essos",          latitude: 3.8700, longitude: 11.5400 },
  { nom: "Marché Biyem-Assi",     latitude: 3.8300, longitude: 11.4897 },
  { nom: "Marché Melen",          latitude: 3.8783, longitude: 11.5297 },
  { nom: "Marché Acacia",         latitude: 3.8611, longitude: 11.4983 },
  { nom: "Marché Nkol-Eton",      latitude: 3.8750, longitude: 11.5050 },
  { nom: "Marché Mendong",        latitude: 3.8225, longitude: 11.5008 },
  { nom: "Marché Mimboman",       latitude: 3.8903, longitude: 11.5633 },
  { nom: "Marché Ekounou",        latitude: 3.8333, longitude: 11.5394 },
  { nom: "Marché Nsam",           latitude: 3.8328, longitude: 11.5131 },
  { nom: "Marché Briqueterie",    latitude: 3.8794, longitude: 11.5219 },
  { nom: "Marché Kondengui",      latitude: 3.8456, longitude: 11.5419 },
  { nom: "Marché de Soa",         latitude: 3.9850, longitude: 11.5806 },
];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function marcheLesPlusProche(latitude: number, longitude: number): Marche {
  return MARCHES_YAOUNDE.reduce((best, m) => {
    return haversineKm(latitude, longitude, m.latitude, m.longitude) <
      haversineKm(latitude, longitude, best.latitude, best.longitude)
      ? m
      : best;
  });
}
