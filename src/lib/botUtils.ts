import rookieRachel from "@/assets/shop/rookie-rachel.jpg";
import starterSam from "@/assets/shop/starter-sam.jpg";
import noviceNick from "@/assets/shop/novice-nick.jpg";
import tacticalTom from "@/assets/shop/tactical-tom.jpg";
import strategicSteve from "@/assets/shop/strategic-steve.jpg";
import positionalPaul from "@/assets/shop/positional-paul.jpg";
import masterMarcus from "@/assets/shop/master-marcus.jpg";
import expertEmma from "@/assets/shop/expert-emma.jpg";
import advancedAlex from "@/assets/shop/advanced-alex.jpg";
import geniusGrace from "@/assets/shop/genius-grace.jpg";
import prodigyPeter from "@/assets/shop/prodigy-peter.jpg";
import eliteEva from "@/assets/shop/elite-eva.jpg";
import grandmasterGary from "@/assets/shop/grandmaster-gary.jpg";
import supremeSarah from "@/assets/shop/supreme-sarah.jpg";
import legendaryLeo from "@/assets/shop/legendary-leo.jpg";
import mythicMaya from "@/assets/shop/mythic-maya.jpg";

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
  { id: "shop-bot-b1", name: "Rookie Rachel", rating: 850, price: 200, image: rookieRachel, category: "beginner", description: "Just starting to learn the game" },
  { id: "shop-bot-b2", name: "Starter Sam", rating: 800, price: 150, image: starterSam, category: "beginner", description: "Learning basic tactics" },
  { id: "shop-bot-b3", name: "Novice Nick", rating: 900, price: 250, image: noviceNick, category: "beginner", description: "Getting comfortable with pieces" },
  
  // Intermediate Bots (1000-1700 ELO)
  { id: "shop-bot-i1", name: "Tactical Tom", rating: 1200, price: 400, image: tacticalTom, category: "intermediate", description: "Plans moves ahead with tactical precision" },
  { id: "shop-bot-i2", name: "Strategic Steve", rating: 1400, price: 500, image: strategicSteve, category: "intermediate", description: "Understands positional concepts well" },
  { id: "shop-bot-i3", name: "Positional Paul", rating: 1600, price: 600, image: positionalPaul, category: "intermediate", description: "Controls key squares and plans strategically" },
  
  // Advanced Bots (1800-2300 ELO)
  { id: "shop-bot-a1", name: "Master Marcus", rating: 2000, price: 800, image: masterMarcus, category: "advanced", description: "Strong tactical vision with deep calculation" },
  { id: "shop-bot-a2", name: "Expert Emma", rating: 2100, price: 900, image: expertEmma, category: "advanced", description: "Aggressive player with sharp attacks" },
  { id: "shop-bot-a3", name: "Advanced Alex", rating: 2200, price: 1000, image: advancedAlex, category: "advanced", description: "Lightning-fast tactics with precision" },
  
  // Expert Bots (2400-2800 ELO)
  { id: "shop-bot-e1", name: "Genius Grace", rating: 2500, price: 1200, image: geniusGrace, category: "expert", description: "Near-perfect positional understanding" },
  { id: "shop-bot-e2", name: "Prodigy Peter", rating: 2600, price: 1300, image: prodigyPeter, category: "expert", description: "Brilliant combinations and deep strategy" },
  { id: "shop-bot-e3", name: "Elite Eva", rating: 2700, price: 1400, image: eliteEva, category: "expert", description: "Shows absolutely no mercy" },
  
  // Master Bots (2900-3300 ELO)
  { id: "shop-bot-m1", name: "Grandmaster Gary", rating: 3000, price: 1800, image: grandmasterGary, category: "master", description: "Computer-like accuracy and precision" },
  { id: "shop-bot-m2", name: "Supreme Sarah", rating: 3200, price: 2000, image: supremeSarah, category: "master", description: "Superhuman play with analytical brilliance" },
  
  // Grandmaster Bots (3400+ ELO)
  { id: "shop-bot-g1", name: "Legendary Leo", rating: 3400, price: 2500, image: legendaryLeo, category: "grandmaster", description: "Nearly unbeatable with absolute dominance" },
  { id: "shop-bot-g2", name: "Mythic Maya", rating: 3500, price: 3000, image: mythicMaya, category: "grandmaster", description: "Godlike precision and chess mastery" },
];
