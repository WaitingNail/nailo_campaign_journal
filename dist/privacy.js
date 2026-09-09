// Public display uses generic labels; stored IDs still drive grouping and counts.
export const isAnonymous = p => typeof p.anonymous === 'boolean' ? p.anonymous : !p.mine;
export const playerKey = p => p.playerId || p.player.trim().normalize('NFKC');
const nameKey = name => name.trim().normalize('NFKC');
const makeId = prefix => prefix + crypto.randomUUID().replaceAll('-', '');
export const anonymousPlayerName = () => '匿名玩家';
export const anonymousCharacterName = () => '匿名角色';

export function normalizePrivacy(data, previous = { campaigns: [] }, ids = {}) {
 const prior = new Map(), names = new Map();
 const remember = p => {
  if (!p.playerId) return;
  const key = nameKey(p.player);
  if (!names.has(key)) names.set(key, new Set());
  names.get(key).add(p.playerId);
 };
 for (const c of previous.campaigns) for (const p of c.characters) { prior.set(`${c.id}/${p.id}`, p); remember(p); }
 for (const c of data.campaigns) for (const p of c.characters) remember(p);
 for (const c of data.campaigns) for (const p of c.characters) {
  const old = prior.get(`${c.id}/${p.id}`), matching = names.get(nameKey(p.player));
  p.playerId ||= (old && nameKey(old.player) === nameKey(p.player) ? old.playerId : '') || (matching?.size === 1 ? [...matching][0] : (ids.player ? ids.player(nameKey(p.player)) : makeId('pl_')));
  p.publicId ||= old?.publicId || (ids.character ? ids.character(c.id, p.id) : makeId('pc_'));
  p.anonymous = isAnonymous(p);
  remember(p);
 }
 return data;
}

export function playersInCampaign(campaign) {
 const groups = new Map();
 for (const p of campaign.characters) {
  const id = playerKey(p);
  if (!groups.has(id)) groups.set(id, { id, name: p.player, characters: [] });
  groups.get(id).characters.push(p);
 }
 return [...groups.values()];
}

export function toPublicJournal(data) {
 const result = structuredClone(data);
 const anonymousPlayers = new Set(result.campaigns.flatMap(c => c.characters.filter(isAnonymous).map(playerKey)));
 result.publicData = true;
 for (const c of result.campaigns) c.characters = c.characters.map(p => {
  const anonymous = isAnonymous(p), id = p.publicId || p.id, playerId = playerKey(p);
  const common = { id, playerId, anonymous, mine: p.mine,
   name: anonymous ? anonymousCharacterName(id) : p.name,
   player: anonymousPlayers.has(playerId) ? anonymousPlayerName(playerId) : p.player };
  if (anonymous) return { ...common, portrait: '', portraitAlt: '匿名角色', color: '#53616B',
   ancestry: '', background: '', classes: [], occupation: '', attributes: {}, skills: [], notes: '', sheetUrl: '' };
  return { ...common, portrait: p.portrait || '', portraitAlt: p.portraitAlt || '', color: p.color || '#375963',
   ancestry: p.ancestry || '', background: p.background || '', classes: p.classes || [], occupation: p.occupation || '',
   attributes: p.attributes || {}, skills: p.skills || [], notes: p.notes || '', sheetUrl: p.sheetUrl || '' };
 });
 return result;
}
