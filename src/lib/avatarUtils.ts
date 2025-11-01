export const avatarIcons = [
  { id: "default", icon: "👤", name: "Default" },
  { id: "1", icon: "⚔️", name: "Knight Helmet" },
  { id: "2", icon: "♟️", name: "Chess Pawn" },
  { id: "3", icon: "🛡️", name: "Shield Bearer" },
  { id: "4", icon: "👑", name: "Cool King" },
  { id: "5", icon: "♛", name: "Chess Crown" },
  { id: "6", icon: "🪓", name: "Battle Axe" },
  { id: "7", icon: "🔥", name: "Fire Phoenix" },
  { id: "8", icon: "❄️", name: "Ice Crystal" },
  { id: "9", icon: "⚡", name: "Lightning Bolt" },
  { id: "10", icon: "🐲", name: "Dragon Soul" },
  { id: "11", icon: "🪄", name: "Magic Wand" },
  { id: "12", icon: "🔱", name: "Royal Scepter" },
];

export const getAvatarIcon = (avatarId: string | null): string => {
  const avatar = avatarIcons.find(a => a.id === (avatarId || "default"));
  return avatar?.icon || "👤";
};
