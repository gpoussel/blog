---
title: "Can an LLM win at code golf in TypeScript?"
description: "I ran Opus 4.8 against 21 CodinGame code golf puzzles in TypeScript, from easy to hard. It never came close to first place, and usually didn't even beat the best human TypeScript. Here are the numbers."
pubDate: 2026-06-01
updatedDate: 2026-06-13
categories: ["AI", "Competitive Programming"]
cover: "code-golf-typescript.jpg"
coverAlt: "A single golf ball on a wooden tee, low in the grass, the rest of the course thrown out of focus behind it."
coverCredit: "Photo by Will Porada on Unsplash"
---

[Code golf](https://en.wikipedia.org/wiki/Code_golf) is the game of solving a problem in the fewest bytes of source code you can manage. The score is the size of the program, and lower is better. It rewards every habit a good engineer is taught to drop: one-letter names, abused operators, no readability at all. I wanted to see how a current LLM handles that inversion, so I pointed Opus 4.8 (medium effort) at 21 code golf puzzles on [CodinGame](https://www.codingame.com/), easy to hard, and made it write TypeScript. The short version: it never got close to first place, and most of the time it didn't even beat the shortest known human TypeScript solution.

_Follow-up: I later re-ran the same 21 puzzles with [Claude Fable 5](/blog/llm-code-golf-fable/), the newer top model. It wrote a quarter fewer bytes than Opus, though it still sits above the best human TypeScript._

## Why TypeScript, of all languages

TypeScript is a deliberately strange pick for golf. Nobody golfs it in real life, because the code you ship gets transpiled to JavaScript and minified by a tool, never shrunk by hand. The language is built for the opposite of golf. Variables must be declared, a function's arity is fixed, the types want to be spelled out. It resists you at every byte.

That resistance is the whole point of the experiment. I wanted a language where the model can't lean on a culture of golfing tricks it absorbed during training, the way it obviously can with Perl or Ruby. TypeScript is a clean room.

## The skill helped; the target length didn't

I didn't send the model in cold. It had a [skill I wrote](https://github.com/gpoussel/copro/tree/main/.claude/skills/codingame-golf) that compiles golfing advice into one place: collapse declarations, prefer expressions over statements, exploit coercion, and so on. It clearly helped against a naive baseline.

I also tried giving Opus a concrete target, the current best score for the puzzle, to see whether a number to chase would push it harder. It changed nothing. The model wrote roughly the same code whether I asked for "as short as possible" or "get this under 64 bytes". The target was just words.

## The whole run, in one table

Here's the full set. Every number is a byte count, so smaller is better. "First place" is the best score on the leaderboard in any language; "Best TS" is the shortest known TypeScript; the last column is what Opus produced.

| Puzzle                              | First place     | Best TS | Opus 4.8 |
| ----------------------------------- | --------------- | ------: | -------: |
| ASCII Art                           | 64 (Python 3)   |     104 |      122 |
| Don't Panic                         | 56 (Bash)       |      83 |      168 |
| Power of Thor                       | 42 (Perl, Ruby) |      65 |      139 |
| Températures                        | 29 (Perl)       |      67 |       85 |
| La descente                         | 27 (Ruby)       |      62 |       79 |
| Unary                               | 64 (Bash)       |     103 |      155 |
| Blunder - Episode 1                 | 215 (Python 3)  |     258 |      696 |
| Des nains sur des épaules de géants | 35 (Perl)       |      65 |      249 |
| Calcul Maya                         | 176 (Ruby)      |     202 |      397 |
| Câblage réseau                      | 73 (Perl, Ruby) |     103 |      193 |
| Shadows of the Knight - Episode 1   | 90 (Perl)       |     140 |      203 |
| Numéros de téléphone                | 31 (Perl)       |      63 |      100 |
| Blunder - Episode 3                 | 76 (Ruby)       |     110 |      447 |
| Séquençage du génôme                | 47 (Ruby)       |      76 |      291 |
| Montagnes russes                    | 84 (Perl)       |     124 |      231 |
| Super calculateur                   | 39 (Ruby)       |      66 |      169 |
| Surface                             | 145 (Perl)      |     183 |      423 |
| The Bridge                          | 175 (Perl)      |     207 |      896 |
| The Fall - Episode 2                | 209 (Perl)      |     233 |     3984 |
| Le labyrinthe                       | 211 (Perl)      |     258 |      717 |
| Vox Codei - Episode 1               | 171 (PHP)       |     221 |      968 |

## Opus is always the longest one in the room

Two things stand out. Opus is consistently longer than the best human TypeScript, often half again as long, sometimes four times over. And the all-language leaderboard sits in a different category entirely.

:::chart

```yaml
type: bar
title: Best human TypeScript vs Opus 4.8, by puzzle (bytes, lower is better)
orientation: horizontal
caption: "The Fall - Episode 2 is left off: Opus wrote 3984 bytes there against the best TypeScript's 233, and it would flatten the rest of the chart."
x:
  - "La descente"
  - "Téléphone"
  - "Thor"
  - "Des nains"
  - "Super calc"
  - "Températures"
  - "Génome"
  - "Don't Panic"
  - "Câblage"
  - "Unary"
  - "ASCII Art"
  - "Blunder 3"
  - "Montagnes"
  - "Shadows 1"
  - "Surface"
  - "Calcul Maya"
  - "The Bridge"
  - "Vox Codei"
  - "Blunder 1"
  - "Labyrinthe"
series:
  - name: Best TypeScript
    data:
      [
        62,
        63,
        65,
        65,
        66,
        67,
        76,
        83,
        103,
        103,
        104,
        110,
        124,
        140,
        183,
        202,
        207,
        221,
        258,
        258,
      ]
  - name: Opus 4.8
    data:
      [
        79,
        100,
        139,
        249,
        169,
        85,
        291,
        168,
        193,
        155,
        122,
        447,
        231,
        203,
        423,
        397,
        896,
        968,
        696,
        717,
      ]
```

:::

The worst case isn't even on that chart. On The Fall - Episode 2, Opus produced 3984 bytes where the best TypeScript is 233 and first place is 209. The interesting part is how it got there. It started from a tight, minified attempt, then kept patching that same dense code to handle edge cases, one fix at a time, and never stepped back to rewrite once the solution passed. So the result is unreadable like golf, but four thousand bytes long: the worst of both. A human golfer would have thrown the draft away and started over.

## If you want to win, bring Perl

The leaderboard is blunt about which language to show up with.

:::chart

```yaml
type: donut
title: First-place golf solutions by language (21 CodinGame puzzles)
caption: "Two puzzles tie between Perl and Ruby, so the slices sum to 23."
data:
  - { name: Perl, value: 11 }
  - { name: Ruby, value: 7 }
  - { name: Python 3, value: 2 }
  - { name: Bash, value: 2 }
  - { name: PHP, value: 1 }
```

:::

Perl and Ruby take the top spot on 16 of the 21 puzzles between them. Both are terse by design and carry decades of golfing culture, with whole communities that have worked out the shortest way to say almost anything. TypeScript carries none of that. That absence is the reason I chose it, and the reason the best human TypeScript scores already sit so far above the all-language record.

## Could it reach first place honestly?

One caveat about the leaderboard itself. Some of these puzzles have a history of rule-bending entries: code shaped around the exact test cases CodinGame ran rather than the actual problem, which lands far below any honest solution. Those holes have reportedly been closed since. So in principle a model now has a fair target and could climb toward first place "à la loyale".

It doesn't. Even leaving the suspect old records aside, there are two gaps to close, not one: Opus sits well above the best honest TypeScript, and TypeScript itself sits well above the all-language record. The model isn't closing either.

## Where this could go next

Could a better skill close the gap? Some of it, probably. The obvious move is to learn from people who already golf TypeScript well: read their solutions, pull out the recurring patterns, feed those back to the model as concrete examples instead of general advice. I went looking and couldn't find enough published TypeScript golf on GitHub to build that from. So if you keep your own solutions somewhere public, I'd genuinely like to see them and extend the experiment. My runs and the skill are open: the [solutions](https://github.com/gpoussel/copro/tree/main/src/contests/cg/golf) and the [skill](https://github.com/gpoussel/copro/tree/main/.claude/skills/codingame-golf).

The honest conclusion is narrow. An LLM with strong general coding skill is not a code golfer, at least not in a language it never saw golfed. The constraint it's bad at here is "say the same thing in fewer bytes", which is almost the inverse of how these models are trained to write.

The next post in this little competitive-programming series goes the other way. How to use an LLM to clear the hardest difficulty levels, the ones that turn on the algorithm rather than the byte count, without vibecoding yourself into a corner. That's a game it plays much better.
