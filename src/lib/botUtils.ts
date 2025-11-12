// Utility function to determine bot category based on ELO rating
export const getCategoryFromElo = (elo: number): string => {
  if (elo < 900) return "beginner";
  if (elo < 1700) return "intermediate";
  if (elo < 2300) return "advanced";
  if (elo < 2800) return "expert";
  if (elo < 3300) return "master";
  return "grandmaster";
};

// Shop bot data with realistic chess-themed names and proper ELO ratings
export const shopBots = [
  // Beginner Bots (400-900 ELO)
  { id: "shop-bot-b1", name: "Rookie Rachel", rating: 850, price: 200, icon: "♟️", category: "beginner", description: "Just starting to learn the game" },
  { id: "shop-bot-b2", name: "Starter Sam", rating: 800, price: 150, icon: "🎯", category: "beginner", description: "Learning basic tactics" },
  { id: "shop-bot-b3", name: "Novice Nick", rating: 900, price: 250, icon: "🔰", category: "beginner", description: "Getting comfortable with pieces" },
  
  // Intermediate Bots (1000-1700 ELO)
  { id: "shop-bot-i1", name: "Tactical Tom", rating: 1200, price: 400, icon: "🎲", category: "intermediate", description: "Plans moves ahead with tactical precision" },
  { id: "shop-bot-i2", name: "Strategic Steve", rating: 1400, price: 500, icon: "⚔️", category: "intermediate", description: "Understands positional concepts well" },
  { id: "shop-bot-i3", name: "Positional Paul", rating: 1600, price: 600, icon: "🏰", category: "intermediate", description: "Controls key squares and plans strategically" },
  
  // Advanced Bots (1800-2300 ELO)
  { id: "shop-bot-a1", name: "Master Marcus", rating: 2000, price: 800, icon: "👑", category: "advanced", description: "Strong tactical vision with deep calculation" },
  { id: "shop-bot-a2", name: "Expert Emma", rating: 2100, price: 900, icon: "🔥", category: "advanced", description: "Aggressive player with sharp attacks" },
  { id: "shop-bot-a3", name: "Advanced Alex", rating: 2200, price: 1000, icon: "⚡", category: "advanced", description: "Lightning-fast tactics with precision" },
  
  // Expert Bots (2400-2800 ELO)
  { id: "shop-bot-e1", name: "Genius Grace", rating: 2500, price: 1200, icon: "💎", category: "expert", description: "Near-perfect positional understanding" },
  { id: "shop-bot-e2", name: "Prodigy Peter", rating: 2600, price: 1300, icon: "🌟", category: "expert", description: "Brilliant combinations and deep strategy" },
  { id: "shop-bot-e3", name: "Elite Eva", rating: 2700, price: 1400, icon: "✨", category: "expert", description: "Shows absolutely no mercy" },
  
  // Master Bots (2900-3300 ELO)
  { id: "shop-bot-m1", name: "Grandmaster Gary", rating: 3000, price: 1800, icon: "🏆", category: "master", description: "Computer-like accuracy and precision" },
  { id: "shop-bot-m2", name: "Supreme Sarah", rating: 3200, price: 2000, icon: "👑💫", category: "master", description: "Superhuman play with analytical brilliance" },
  
  // Grandmaster Bots (3400+ ELO)
  { id: "shop-bot-g1", name: "Legendary Leo", rating: 3400, price: 2500, icon: "🎖️", category: "grandmaster", description: "Nearly unbeatable with absolute dominance" },
  { id: "shop-bot-g2", name: "Mythic Maya", rating: 3500, price: 3000, icon: "⭐", category: "grandmaster", description: "Godlike precision and chess mastery" },
];
