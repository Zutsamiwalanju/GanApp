// Friendly default names so the chat isn't a wall of "Explorer".
const ADJ = ['Sunny', 'Curious', 'Chill', 'Swift', 'Bright', 'Lucky', 'Brave', 'Mellow', 'Witty', 'Breezy', 'Jolly', 'Kind', 'Bold', 'Cozy', 'Zesty', 'Lively'];
const ANIMAL = ['Tarsier', 'Carabao', 'Maya', 'Tamaraw', 'Pawikan', 'Agila', 'Butanding', 'Kalaw', 'Tarictic', 'Bakunawa', 'Dugong', 'Kalapati', 'Pusa', 'Kuwago', 'Alitaptap', 'Paru-paro'];

export function friendlyName(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${ADJ[h % ADJ.length]} ${ANIMAL[(h >>> 8) % ANIMAL.length]}`;
}
