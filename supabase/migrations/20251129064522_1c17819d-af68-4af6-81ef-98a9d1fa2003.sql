-- Create blog_posts table for SEO-optimized chess content
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  meta_description TEXT NOT NULL,
  meta_keywords TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Admins can insert blog posts
CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update their own blog posts
CREATE POLICY "Admins can update their own blog posts"
ON public.blog_posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) AND author_id = auth.uid());

-- Admins can delete their own blog posts
CREATE POLICY "Admins can delete their own blog posts"
ON public.blog_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) AND author_id = auth.uid());

-- Create index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Create index for category filtering
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);

-- Create index for status and published_at for listing
CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Seed some initial SEO-optimized blog posts
INSERT INTO public.blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  author_id, 
  author_name, 
  category, 
  tags, 
  meta_description, 
  meta_keywords,
  status
) VALUES
(
  '10 Essential Chess Opening Principles for Beginners',
  '10-essential-chess-opening-principles-beginners',
  'Master the fundamentals of chess openings with these 10 proven principles. Learn how to control the center, develop your pieces efficiently, and gain an early advantage.',
  '# 10 Essential Chess Opening Principles for Beginners

## Introduction
The opening phase of a chess game sets the foundation for your entire strategy. Whether you''re a complete beginner or looking to solidify your fundamentals, these 10 principles will help you start every game with confidence.

## 1. Control the Center
The center squares (e4, d4, e5, d5) are the most important on the board. Controlling them gives your pieces maximum mobility and influence.

**Why it matters:** Pieces placed in the center can reach more squares and control more of the board than pieces on the edges.

## 2. Develop Your Pieces Early
Don''t move the same piece twice in the opening unless absolutely necessary. Get all your pieces into the game quickly.

**Recommended order:** Knights before bishops, castle early, connect your rooks.

## 3. Castle Early
King safety is paramount. Castle within your first 10 moves to protect your king and activate your rook.

## 4. Don''t Move Your Queen Too Early
Your queen is powerful but vulnerable. Moving it early often results in losing time as opponents attack it.

## 5. Control Key Squares
Identify and control important squares, especially those in the center and near your opponent''s king.

## 6. Develop With Purpose
Each move should contribute to your position. Ask yourself: "What does this move accomplish?"

## 7. Avoid Unnecessary Pawn Moves
While pawn moves can control space, too many weaken your position and waste development time.

## 8. Connect Your Rooks
Place your rooks on open or semi-open files where they can become active in the middlegame.

## 9. Think About Pawn Structure
Your pawn structure affects the entire game. Avoid creating weaknesses like isolated or doubled pawns without compensation.

## 10. Study Common Opening Systems
Learn 1-2 openings for White and 1-2 defenses for Black. Understanding typical plans is more important than memorizing moves.

## Conclusion
These principles form the foundation of sound opening play. Practice them consistently, and you''ll find yourself emerging from the opening with strong, playable positions every time.

**Practice Tip:** Review your games and check if you followed these principles. Over time, they''ll become second nature!',
  '00000000-0000-0000-0000-000000000000',
  'Chessify Team',
  'Beginner Tips',
  ARRAY['openings', 'beginners', 'strategy', 'fundamentals'],
  'Master chess opening principles with this beginner-friendly guide. Learn the 10 essential rules to start your games strong, control the center, and develop pieces efficiently.',
  'chess openings, chess opening principles, beginner chess strategy, chess fundamentals, how to play chess openings, chess center control, chess development, castle in chess, chess opening tips',
  'published'
),
(
  'The Complete Guide to Chess Tactics: Forks, Pins, and Skewers',
  'complete-guide-chess-tactics-forks-pins-skewers',
  'Discover the fundamental chess tactics every player must know. Learn how to spot forks, pins, and skewers to win material and dominate your opponents.',
  '# The Complete Guide to Chess Tactics: Forks, Pins, and Skewers

## Introduction
Chess tactics are forcing moves that exploit weaknesses in your opponent''s position. Mastering the fundamental tactical patterns—forks, pins, and skewers—will dramatically improve your game and help you win material consistently.

## What Are Chess Tactics?
Tactics are short-term sequences of moves that achieve a specific goal, usually gaining material or delivering checkmate. They form the foundation of combination play.

## The Fork: Double Attack Mastery

### What is a Fork?
A fork occurs when one piece attacks two or more enemy pieces simultaneously. The opponent can only save one piece, losing the other.

### Knight Forks
Knights are the best forking pieces because they can attack multiple pieces that can''t defend each other.

**Common Knight Fork Pattern:**
- Knight to f7 attacking king and queen (the "family fork")
- Knight to e4 attacking pieces on c5 and g5

### Pawn Forks
Don''t underestimate pawn forks! A pawn attacking two pieces can be devastating.

**Example:** A pawn on e5 attacking knights on d6 and f6.

### Queen and Rook Forks
These powerful pieces can fork along ranks, files, and diagonals.

## The Pin: Restricting Movement

### What is a Pin?
A pin occurs when a piece cannot move because doing so would expose a more valuable piece behind it to attack.

### Types of Pins

**Absolute Pin:**
When the piece behind is the king. The pinned piece legally cannot move.

**Relative Pin:**
When the piece behind is valuable but not the king. Moving is legal but usually bad.

### Breaking Pins
- Attack the pinning piece
- Block the pin
- Move the valuable piece away
- Create counter-threats

## The Skewer: Reverse Pin

### What is a Skewer?
A skewer is like a pin in reverse—a valuable piece is forced to move, exposing a less valuable piece behind it.

**Classic Example:**
- A rook attacks the king, forcing it to move
- The rook then captures the queen behind it

### When Skewers Work Best
- Along ranks, files, and diagonals
- When pieces are aligned
- In endgames with limited escape squares

## Combining Tactics

### Fork + Pin Combo
Create a pin, then fork the pinned piece with another threat.

### Discovery Attacks
Move one piece to reveal an attack from another, creating multiple threats.

### Removing the Defender
Capture or chase away a piece defending against your tactic.

## Practice Exercises

### Exercise 1: Find the Fork
Look for positions where your knight can attack king and queen simultaneously.

### Exercise 2: Spot the Pin
Identify pieces lined up with the opponent''s king or queen.

### Exercise 3: Create a Skewer
Find positions where you can force a valuable piece to move, exposing another piece.

## How to Improve Your Tactical Vision

1. **Daily Puzzle Practice:** Solve 10-15 tactical puzzles every day
2. **Analyze Your Games:** Review games to find missed tactical opportunities
3. **Pattern Recognition:** Study tactical motifs repeatedly until they become automatic
4. **Visualization Training:** Practice seeing moves in your head without moving pieces
5. **Slow Down:** In games, take time to check for tactics before and after every move

## Common Tactical Mistakes

- **Moving too fast:** Tactics require careful calculation
- **Tunnel vision:** Looking for one tactic while missing another
- **Ignoring opponent threats:** Always check what your opponent is threatening
- **Overcomplicating:** The simplest tactic is usually the best

## Conclusion
Forks, pins, and skewers are the building blocks of tactical chess. Master these patterns through daily practice, and you''ll start seeing tactical opportunities in every position. Remember: tactics flow from superior positions, so combine strong positional play with sharp tactical awareness.

**Next Steps:**
1. Practice tactical puzzles focusing on these patterns
2. Review master games highlighting these tactics
3. Play slower time controls to give yourself time to spot tactics
4. Keep a tactics journal of interesting patterns you encounter',
  '00000000-0000-0000-0000-000000000000',
  'Chessify Team',
  'Tactics',
  ARRAY['tactics', 'intermediate', 'strategy', 'combinations'],
  'Master essential chess tactics including forks, pins, and skewers. Learn how to spot tactical patterns, win material, and improve your tactical vision with practical examples.',
  'chess tactics, chess forks, chess pins, chess skewers, tactical patterns, win material in chess, chess combinations, improve chess tactics, chess tactical training',
  'published'
),
(
  'Endgame Mastery: Key Positions Every Chess Player Should Know',
  'endgame-mastery-key-positions-every-player-should-know',
  'Learn the essential endgame positions that separate good players from great ones. Master king and pawn endgames, opposition, and basic checkmates.',
  '# Endgame Mastery: Key Positions Every Chess Player Should Know

## Introduction
"All rook endgames are drawn" might be a joke, but endgame knowledge is no laughing matter. The endgame is where games are won or lost, and understanding key positions is essential for every serious chess player.

## Why Study Endgames?

### The Reality of Chess
- 90% of amateur games reach an endgame
- Endgame knowledge provides certain wins or draws
- Many beautiful middlegame combinations lead to winning endgames

### The Payoff
Endgame study has the highest return on investment for your chess improvement. One hour of endgame study can save you countless games.

## Basic Checkmates

### King and Queen vs. King
**Goal:** Checkmate in under 10 moves

**Technique:**
1. Use your queen to restrict the enemy king to the side of the board
2. Bring your king closer to help deliver checkmate
3. Avoid stalemate by ensuring the enemy king has a legal move before the final blow

### King and Rook vs. King
**Goal:** Drive the enemy king to the edge

**The Box Method:**
1. Use your rook to cut off the enemy king
2. Shrink the "box" the king can move in
3. Bring your king closer
4. Deliver checkmate on the edge

### Two Rooks Checkmate
The easiest checkmate! Use your rooks to push the enemy king to the edge.

## King and Pawn Endgames

### The Square Rule
Can your king catch the opponent''s pawn?

**The Test:**
1. Draw an imaginary square from the pawn to the promotion square
2. If your king can step into this square, you can catch the pawn
3. If not, the pawn promotes

### Opposition
The most important concept in king and pawn endgames.

**Direct Opposition:**
- Kings face each other with one square between them
- The player NOT to move has the opposition
- Opposition helps you advance your king or stop the opponent''s king

**Example:** White king on e4, Black king on e6. If it''s Black''s turn, White has the opposition.

### Distant Opposition
Kings are separated by 3 or 5 squares but on the same file or rank.

### Key Squares
Critical squares that, when occupied by your king, guarantee a win or draw.

**For a pawn on e5:**
- Key squares are d7, e7, f7, d6, e6, f6
- If the attacking king reaches any key square, the pawn promotes

## Rook Endgames

### Lucena Position
**The Winning Technique:**
1. Your king is on the promotion square
2. Your rook cuts off the enemy king
3. Build a bridge with your rook to escape checks
4. Promote the pawn

**Key Idea:** Use your rook to shield your king from checks.

### Philidor Position
**The Drawing Technique:**
1. Place your rook on the 3rd rank
2. Keep the enemy king cut off from your king
3. When the pawn advances to the 6th rank, move your rook to the 1st rank for back-rank checks

### Rook and Pawn vs. Rook
**General Principles:**
- The defending side usually draws with correct play
- Keep your king active
- Give checks from behind the pawn when defending
- Use your rook actively, not passively

## Queen Endgames

### Queen vs. Pawn on 7th Rank
Usually winning for the queen, but some positions are drawn.

**Drawing Exceptions:**
- Bishop pawn or rook pawn with the king in front
- The defender''s king must be close to the pawn

### Queen and Pawn vs. Queen
Extremely complex! General drawing tendencies unless:
- The pawn is far advanced (6th or 7th rank)
- The attacking king is active
- The defending king is cut off

## Bishop Endgames

### Bishop and Pawn vs. Bishop (Same Color)
Can be winning or drawn depending on:
- Can the defending bishop stop the pawn?
- Is the defending king close enough?
- Can the attacker''s king support the pawn?

### Opposite-Colored Bishops
**Important:** These endgames have strong drawing tendencies.
- Blockade the pawns with your bishop
- Keep your king active
- Create a fortress if behind

## Knight Endgames

### Knight and Pawn vs. Knight
Generally drawn if:
- The defending knight can blockade the pawn
- The defending king is reasonably active

**Winning chances increase when:**
- Multiple pawns are present
- The attacking king is very active

## Practical Endgame Tips

### 1. Activity is King
In endgames, king activity often matters more than material. An active king can dominate a passive one.

### 2. Calculate Accurately
Endgames require precise calculation. One wrong move can turn a win into a draw or a draw into a loss.

### 3. Think in Terms of Plans
- What is my goal?
- How do I achieve it?
- What is my opponent trying to do?
- How do I stop it?

### 4. Know Your Theoretical Positions
Study fundamental positions like Lucena, Philidor, and key square theory. They appear in countless games.

### 5. Practice, Practice, Practice
Set up positions against a computer or training partner. Play them until the technique is automatic.

## Study Plan for Endgames

### Week 1-2: Basic Checkmates
Master queen, rook, and two-rook checkmates.

### Week 3-4: King and Pawn Endgames
Study opposition, key squares, and simple pawn endgames.

### Week 5-6: Rook Endgames
Learn Lucena and Philidor positions.

### Week 7-8: Minor Piece Endgames
Study basic bishop and knight endgames.

### Ongoing: Practice and Review
Regularly revisit these positions to maintain your knowledge.

## Recommended Resources

### Books
- "100 Endgames You Must Know" by Jesus de la Villa
- "Silman''s Complete Endgame Course" by Jeremy Silman
- "Dvoretsky''s Endgame Manual" (Advanced)

### Online Training
- Chessify endgame puzzles
- Lichess endgame practice
- Chess.com endgame drills

## Conclusion
Endgame knowledge is like money in the bank—it never loses value. The positions covered here form the foundation of endgame mastery. Study them systematically, practice regularly, and watch your results improve dramatically.

Remember: "Study the endgame before everything else." - José Capablanca

**Action Items:**
1. Bookmark this guide
2. Practice one endgame position daily
3. Review your game endgames with an engine
4. Build a personal endgame notebook',
  '00000000-0000-0000-0000-000000000000',
  'Chessify Team',
  'Endgame',
  ARRAY['endgame', 'advanced', 'technique', 'theory'],
  'Master essential chess endgames including king and pawn endgames, opposition, Lucena and Philidor positions, and basic checkmates. Complete guide with practical tips.',
  'chess endgame, king and pawn endgame, opposition in chess, Lucena position, Philidor position, basic checkmates, rook endgame, chess endgame theory, how to win chess endgames',
  'published'
);