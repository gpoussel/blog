---
title: "Fable 5 shaves a quarter off Opus at code golf"
description: "I re-ran the 21 CodinGame code golf puzzles from the Opus post with Claude Fable 5. It wrote 24.7% fewer bytes overall, 10,712 down to 8,065: still above the best human TypeScript, but closing the gap fast."
pubDate: 2026-06-13
categories: ["AI", "Competitive Programming"]
cover: "code-golf-fable.jpg"
coverAlt: "A single white golf ball resting on a close-cropped green, the fairway falling away soft and out of focus behind it."
coverCredit: "Photo by Peter Drew on Unsplash"
---

Two weeks ago I [ran Opus 4.8 at code golf](/blog/llm-code-golf-typescript/): 21 CodinGame puzzles in TypeScript, fewest bytes wins. It lost. Longer than the best human TypeScript on nearly every puzzle, three or four times longer on the worst ones. Claude Fable 5 is the new top model, so I handed it the exact same 21 puzzles, the same golf skill, the same prompt, and counted bytes again. It wrote 24.7% less code overall: 10,712 bytes down to 8,065. Fable still sits above the best human TypeScript everywhere, but the gap got a lot smaller.

## It writes the same program, only shorter

Fable produced working code in one shot on every puzzle, exactly like Opus, no broken submissions to nurse back to health. What changed is density. It used the [golf skill](https://github.com/gpoussel/copro/blob/60014336eb2dc06f0cf77ddff48468a591d853fa/.claude/skills/codingame-golf/references/golf-tricks.md) more aggressively, collapsing declarations and leaning on coercion where Opus had left bytes on the floor.

A couple of the byte-savers that surfaced during these runs, now [folded back into the skill](https://github.com/gpoussel/copro/pull/9), give the flavor. To turn an array of string tokens into numbers, `.map(eval)` is two bytes shorter than `.map(Number)`: indirect `eval` of `"42"` just hands back 42, and TypeScript types `eval` loosely enough to pass as a map callback. It's also slow enough to time out on a large input, so it ships with a warning label.

The one I actually admire is breadth-first search written as a single loop over the queue you're still filling:

```ts
for (node of q) {
  // ...examine node...
  q.push(child); // appended mid-iteration, and still visited
}
```

A JavaScript array iterator re-reads the length on every step, so looping over the queue while you're still pushing onto it walks the whole graph in order: a full BFS with no index variable and no `while`. It reads like a bug and runs like a textbook.

Here's the full run. Every number is a byte count, so smaller is better. "Best TS" is the shortest known human TypeScript; the last two columns are what each model produced.

| Puzzle                              | Best TS | Opus 4.8 | Fable 5 |
| ----------------------------------- | ------: | -------: | ------: |
| ASCII Art                           |     104 |      122 |     111 |
| Don't Panic                         |      83 |      168 |     134 |
| Power of Thor                       |      65 |      139 |     129 |
| Températures                        |      67 |       85 |      81 |
| La descente                         |      62 |       79 |      69 |
| Unary                               |     103 |      155 |     154 |
| Blunder - Episode 1                 |     258 |      696 |     367 |
| Des nains sur des épaules de géants |      65 |      249 |     160 |
| Calcul Maya                         |     202 |      397 |     318 |
| Câblage réseau                      |     103 |      193 |     168 |
| Shadows of the Knight - Episode 1   |     140 |      203 |     157 |
| Numéros de téléphone                |      63 |      100 |      86 |
| Blunder - Episode 3                 |     110 |      447 |     209 |
| Séquençage du génôme                |      76 |      291 |     202 |
| Montagnes russes                    |     124 |      231 |     211 |
| Super calculateur                   |      66 |      169 |     150 |
| Surface                             |     183 |      423 |     243 |
| The Bridge                          |     207 |      896 |     616 |
| The Fall - Episode 2                |     233 |     3984 |    3451 |
| Le labyrinthe                       |     258 |      717 |     441 |
| Vox Codei - Episode 1               |     221 |      968 |     608 |

The savings are wildly uneven. On Unary it found a single byte, 0.6%. On Blunder - Episode 3 it cut more than half, 447 bytes down to 209. The per-puzzle average is 22.6%, and the spread itself is worth a look:

:::chart

```yaml
type: bar
title: How much Fable 5 trimmed off Opus 4.8 (% fewer bytes)
unit: "%"
orientation: horizontal
caption: "From Unary at the bottom (0.6%) to Blunder - Episode 3 at the top (53.2%). The mean is 22.6%."
x:
  - "Blunder 3"
  - "Blunder 1"
  - "Surface"
  - "Labyrinthe"
  - "Vox Codei"
  - "Des nains"
  - "The Bridge"
  - "Génome"
  - "Shadows 1"
  - "Don't Panic"
  - "Calcul Maya"
  - "Téléphone"
  - "The Fall 2"
  - "Câblage"
  - "La descente"
  - "Super calc"
  - "ASCII Art"
  - "Montagnes"
  - "Thor"
  - "Températures"
  - "Unary"
series:
  - name: Bytes saved vs Opus
    data:
      [
        53.2,
        47.3,
        42.6,
        38.5,
        37.2,
        35.7,
        31.3,
        30.6,
        22.7,
        20.2,
        19.9,
        14.0,
        13.4,
        13.0,
        12.7,
        11.2,
        9.0,
        8.7,
        7.2,
        4.7,
        0.6,
      ]
```

:::

## The model you can't try this with

There's a catch to reproducing any of this: you can't. Fable 5 has been pulled. According to [Anthropic](https://www.anthropic.com/news/fable-mythos-access), a government may believe that someone has already worked out how to get around the safeguards meant to stop people pointing Fable 5 at harmful work. I got my runs in just before the door closed. How much of that to believe, I'll leave to you.

## Fable quality at Opus prices

One result stuck with me. I went back to Opus and asked it to golf its own solutions a second time, nothing else changed, and it landed close to Fable's lengths. So Fable-grade output was reachable from Opus all along. You pay for the extra pass instead of the bigger model.

That makes me wonder where the model tiers are heading. The common workflow today is to plan with Opus and build with Sonnet. Maybe the next shape has three floors: a high-level plan from Fable, a detailed plan from Opus, the implementation from Sonnet, each model doing the thinking that matches its weight.

Plenty of people build a private benchmark the week a model ships, to learn what the release notes won't tell them. Twenty-one golf puzzles with a known human floor and a clean byte score might make a decent one. I'm tempted to grow this into something I can point at whatever comes next, assuming that one's still allowed to run. The [solutions](https://github.com/gpoussel/copro/tree/main/src/contests/cg/golf) are open if you want to race them yourself.
