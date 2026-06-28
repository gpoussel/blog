---
title: "I mixed LLMs into my friends' World Cup prediction pool"
description: "I dropped the PunditBench LLM predictions into my friends' World Cup pool, scored two ways. On raw scores DeepSeek V4 Flash edged everyone; under a betting-odds system only Grok 4.3 cracked the top five. The lesson isn't who won: the same market finishes 55th played naively and 20th played well, so turning a prediction into a good ticket matters more than the prediction."
pubDate: 2026-06-28
categories: ["AI"]
cover: "worldcup-trophy.jpg"
coverAlt: "A gold World Cup trophy next to an adidas match ball on the grass of an empty stadium, the stands a soft blur behind them."
coverCredit: "Photo by Fauzan Saari on Unsplash"
---

The 2026 World Cup group stage wrapped up overnight, so the football prediction benchmarks finally have something real to grade. The most thorough one I found is [PunditBench](https://punditbench.com/): 40 LLMs, each made to predict all 72 group scorelines plus a full bracket, locked and hashed before a ball was kicked. Its headline is fun. DeepSeek V4 Flash and Claude Haiku 4.5 sit near the top, both small models, both ahead of their own flagship siblings. I wanted to see how that holds up against actual people, so I did something messier: I run a prediction pool with friends, and I dropped a batch of public LLM predictions, most of them from PunditBench, straight into our standings. (One entry, a Claude Opus 4.8 run, came from a separate public predictor, so the exact ordering between models isn't a clean apples-to-apples benchmark.)

We score two ways, and the gap between them turned out to be the whole story. The first is the classic French _pronostic_ grid: 5 points for the exact score, 3 for the right goal difference (a draw counts), 1 for the right result, 0 for a miss. The second is odds-based: get the result right and you win the pre-match odds of that outcome, plus 20 for a perfect score, and you never go negative. One rewards getting close. The other rewards being right about things the market thought unlikely.

## Under the exact-score grid, a small model wins

🤖 marks an LLM, 🧑 a human. Here's the top ten.

| #   | Predictor                | Points | Exact scores | Played |
| --- | ------------------------ | -----: | -----------: | -----: |
| 1   | 🤖 DeepSeek V4 Flash     |    121 |           11 |     72 |
| 2   | 🧑 Brandon               |    118 |           13 |     72 |
| 3   | 🧑 Eva                   |    118 |           11 |     72 |
| 4   | 🤖 Claude Haiku 4.5      |    116 |           11 |     72 |
| 5   | 🤖 GLM 5.1               |    115 |           11 |     72 |
| 6   | 🧑 Victor                |    113 |           10 |     72 |
| 7   | 🤖 Claude Opus 4.8       |    113 |            9 |     72 |
| 8   | 🧑 Martin                |    112 |            9 |     72 |
| 9   | 🧑 Luka                  |    111 |           13 |     72 |
| 10  | 🤖 Gemini 3.1 Flash Lite |    111 |           12 |     72 |

DeepSeek V4 Flash finishes first, and the top ten splits clean down the middle: five models, five humans. Ten points cover all ten of them across 72 matches. The exact-score column is where it gets interesting. Brandon and Luka both caught 13 perfect scores, the most in the whole pool, yet Brandon came second and Luka ninth. Catching the exact score isn't the game; Luka simply missed more of the 3-point goal-difference calls around it.

## Switch to odds, and the humans take it back

| #   | Predictor            | Points | Exact scores | Played |
| --- | -------------------- | -----: | -----------: | -----: |
| 1   | 🧑 Tristan           |   3384 |           10 |     72 |
| 2   | 🧑 Martin            |   3346 |            9 |     72 |
| 3   | 🤖 Grok 4.3          |   3279 |            9 |     72 |
| 4   | 🧑 Stephane          |   3256 |            8 |     70 |
| 5   | 🧑 Anthony           |   3214 |            8 |     68 |
| 6   | 🤖 DeepSeek V4 Flash |   3169 |           11 |     72 |
| 7   | 🧑 Sebastien G       |   3160 |            6 |     72 |
| 8   | 🧑 Chloé             |   3141 |            8 |     72 |
| 9   | 🧑 Maxime            |   3125 |            9 |     72 |
| 10  | 🧑 Brandon           |   3104 |           13 |     72 |

Now humans take eight of the top ten. Only two models survive: Grok 4.3 in third, and DeepSeek V4 Flash, the exact-score winner, dropped to sixth. Same predictions, reshuffled by what you get paid for them. The odds system pays for nerve: a correct upset is worth several safe favourites, so the players who occasionally backed the underdog are the ones who climbed. DeepSeek's varied, plausible scorelines are perfect for the exact-score grid and merely fine here.

One caveat the LLMs don't have: a few humans skipped matches. The exact-score grid above is clean (every name in its top ten played all 72), but here Stephane sat out two and Anthony four. Since the odds total only ever adds, a missed match is a missed chance to score, so it quietly rewards showing up. Anthony actually posted the best points-per-match of the five and still finished last of them, on volume alone. The models, of course, never miss a match.

## The same information finishes 55th or 20th

One number reframed the whole thing for me. I added two robot players that do nothing but bet the market. The first plays it naively: take the favourite, write down 1-0, every single match. The second reads the odds match by match and writes the most plausible scoreline they imply. Identical starting information. The naive one finishes 55th. The odds-aware one finishes 20th. Thirty-five places separate two ways of _using the same beliefs_.

So the thing moving people up and down these tables isn't football knowledge. Nobody in the pool, human or model, shows a real edge over the betting market on who wins. What separates them is the translation step: turning a belief into a checked scoreline. Vary your guesses, and take a draw or a surprise where the points justify the risk. That's the skill being measured, and it has almost nothing to do with knowing football.

## Why the models do fine

Read in that light, the LLMs' position is unsurprising. They encode the consensus, and asked for a scoreline they produce varied, credible numbers without being told to. In an exact-score format that's the right reflex by default. They edge the well-played market by a margin that one tournament's luck explains on its own. I'd call it parity of good play, not a demonstrated edge at predicting.

## What I'm not going to claim

It's tempting to read the top of a noisy ranking as a result, and I want to resist that. Beating an EV-optimal baseline at the top of a table like this doesn't take better forecasting. It takes more variance and some luck. The smart market plays the central estimate, a low-variance strategy that lands mid-table by construction. Its 20th place is exactly where an optimal-but-unlucky player belongs, and the nineteen names above it are where this tournament's lucky gamblers happened to fall. What would actually settle it is average rank over many tournaments or resamples, not one bracket. Same caution for "the small models win": that ten-point spread across the whole top ten, against an expected noise of roughly ±15 on a 72-match total, is chance, not an effect of model size.

If I keep one sentence, it's this: in these pools, knowing how to turn a prediction into a good ticket counts for more than the prediction itself. And that's the level ground where models and people actually meet, not on the football. Next World Cup I'd rather re-run the whole pool a hundred times than read one leaderboard. Until then, Brandon, you and your 13 exact scores are still the best pundit I know.
