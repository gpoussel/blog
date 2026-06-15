---
title: "How close can an LLM get to a CodinGame optimization leaderboard?"
description: "I pointed Opus 4.8 at six CodinGame optimization puzzles. On the travelling salesman it tied the top of the leaderboard; on the open-ended games it reached a sixth or an eighth of the best score and stopped. The thing it's bad at is the CodinGame squeeze, not the solving."
pubDate: 2026-06-07
categories: ["AI", "Competitive Programming"]
cover: "optimization-codingame.jpg"
coverAlt: "A close-up of an open pocket watch lying on a table, its gears and hands sharp against a soft dark background."
coverCredit: "Photo by Ruben Caldera on Unsplash"
---

CodinGame has a category called [Optimization](https://www.codingame.com/training/optimization). The puzzles there aren't pass/fail. You submit a program, it runs against one fixed hidden test case (the same one for everyone), and you get a score. Better score, higher rank. There's no single correct answer, only a less-bad one, and the leaderboard never really closes.

I pointed Opus 4.8 at five of them, the same way I [ran it at code golf](/blog/llm-code-golf-typescript/) the week before. The result split cleanly in two. On a textbook problem it tied the very top of the leaderboard. On the open-ended games it landed at a sixth, sometimes an eighth, of the best score and stopped climbing. It struggles with the squeeze, not the solving.

## Why these puzzles make good test subjects

A graded problem with no fixed answer is a better probe than a pass/fail one. There's always a higher score in principle, so "it works" is never the end of the story, and you find out fast whether a model knows how to keep going.

The catch that defines the whole category: the visible test cases do not predict the hidden one. You can score beautifully on the examples and rank poorly, because the ranking instance is bigger or shaped differently. The only ground truth is a real submission. That alone breaks the habit most coding assistants have, which is to tune until the sample tests pass and call it done.

These problems are also old and much studied. Many of the CodinGame validators have been picked apart over the years, and the best players have pushed each one to what is effectively its practical extremum. So there's a known ceiling to measure against, even if nobody calls it optimal.

## The real work often happens off CodinGame

The interesting puzzles reward moving computation out of the 5-second runtime and into preparation you do beforehand.

[Wordle](https://www.codingame.com/training/optimization/codingame-wordle) is the clearest case. The answer always comes from a fixed list of about ten thousand words. So the sensible move is to download that list, build a decision tree offline (first guess, then a table keyed on the feedback, then another), and ship the precomputed tables as a near-hardcoded lookup. Opus did exactly this once I nudged it there. The tables it generated scored 203. A plain runtime greedy solver, no tables at all, scored 171, which is better. Partial offline preparation actively hurt: a second guess chosen by the offline policy is wrong when the rest of the game falls back to a different runtime heuristic. To make tables win you have to compute the whole policy, not the first two levels and hope. The #1 is 154, so the plain greedy is already within reach of the top; the clever offline idea is what walked it backwards.

[2048](https://www.codingame.com/training/optimization/2048) has been studied to death as a stochastic game: the standard answer is [expectimax over the random tile spawns](https://stackoverflow.com/questions/22342854/what-is-the-optimal-algorithm-for-the-game-2048), and the famous [bitboard AIs](https://github.com/nneonneo/2048-ai) chase the highest expected score. The CodinGame variant isn't random, though. The referee hands you the spawn seed every turn, so the "random" generator is just a deterministic function you can replay. Port the PRNG, run a deterministic beam search, and offline Opus averaged ~628k per game. Except that never became a rank: every attempt on CodinGame errored before the game finished, peaking around 17,772 and never a clean 100%, because the slower contest hardware couldn't reach the search horizon in time. The #1 is about 69 million. Offline it looked strong; live it didn't even validate.

## When it's stuck, it goes reading

The most useful thing I learned: if the model can't crack a puzzle and you tell it this is a CodinGame puzzle, it starts looking for help on the internet. It reads the forum, it digs up other people's solutions on GitHub.

That mattered for the [CodinGame Sponsored Contest](https://www.codingame.com/training/optimization/codingame-sponsored-contest), a puzzle that hides what it even is on purpose. The inputs are base64+zlib encoded twice. Decoded, it's a blind Pac-Man: you only ever see the four cells around you and the ghost positions, never the maze. Our first naive bot froze on turn one because it kept printing the move for "down", which happens to be a wall at spawn. The unlock was a [published writeup by texus](https://github.com/texus/codingame) that the model found and reverse-engineered the exact input format and the strange action mapping from. And here's the quietly good part of these puzzles: no first-place (genuinely optimal) solution is ever public. The reference writeups get you to a respectable, well-known score, not to the top. There's always room left.

## The numbers

Here's where the five landed.

| Puzzle              | What Opus did                    |        Opus score |         #1 |
| ------------------- | -------------------------------- | ----------------: | ---------: |
| Travelling Salesman | multi-seed iterated local search |           201,391 |    201,382 |
| 2048                | deterministic beam search        |   no valid CG run | 69,058,228 |
| Wordle              | offline decision tables          | 203 (greedy: 171) |        154 |
| Blind Pac-Man       | greedy BFS coverage              |             2,568 |     14,337 |
| Code vs Zombies     | per-turn genetic search          |           210,920 |  1,763,840 |

The [Travelling Salesman](https://www.codingame.com/training/optimization/travelling-salesman) line is the happy one. A nearest-neighbour start, [2-opt and Or-opt local search](https://en.wikipedia.org/wiki/2-opt), double-bridge [iterated local search](https://en.wikipedia.org/wiki/Iterated_local_search), many seeds. That's a textbook metaheuristic, and the model assembled it competently. Final tour 201,391 against a #1 of 201,382. Nine units off, on a problem with a known shape. When the recipe exists, it cooks.

Put all five on one scale and the gradient is the point. I normalised each to first place (best-over-Opus for the puzzles you minimise, Opus-over-best for the ones you maximise), so 100% means tied with #1:

:::chart

```yaml
type: bar
title: "How close Opus got to the #1 score (% of the leader's quality)"
unit: "%"
orientation: horizontal
caption: "Normalised to first place: best/Opus for the puzzles you minimise (Travelling Salesman, Wordle), Opus/best for the ones you maximise. 2048 never produced a valid run on CodinGame, so it sits near zero."
x: ["Travelling Salesman", "Wordle", "Blind Pac-Man", "Code vs Zombies", "2048"]
series:
  - name: Share of #1
    data: [100, 90, 18, 12, 0.03]
```

:::

On [Code vs Zombies](https://www.codingame.com/training/optimization/code-vs-zombies) the model wrote a genuinely reasonable per-turn genetic search over Ash's future moves, scored 210,920, about five times its own heuristic baseline. The #1 is around 1.76 million. Reaching that needs deliberately herding zombies into one tight cluster while keeping every human alive, then collecting one enormous combo. A random-angle search almost never stumbles onto that plan. The Pac-Man bot hit 2,568 and matched the published reference solutions exactly, which is also their ceiling. The leaders visit roughly five times as many cells with a coverage planner nobody has written up.

## Good at solving, bad at squeezing

So the split is consistent. Where the problem reduces to a known algorithm, the model implements it well and lands near the top. Where the top score depends on a bespoke insight, the kind you only get by flirting with the exact limits of the exercise, it produces a sensible general solution and then plateaus. And it doesn't really know it has plateaued: the feedback loop these puzzles demand (submit, read a single number, form a theory about a hidden instance you cannot see, try again) is exactly the loop it's weakest at. I had to do most of that steering myself, and even then we stayed far from the optimised solutions.

That's not a complaint, more a useful boundary. A current LLM is a strong first-draft engineer for a graded problem. It is not yet the person who sits with one puzzle for a week and finds the trick that moves the leaderboard. The code and the working notes are [open](https://github.com/gpoussel/copro/tree/main/src/contests/cg/opti) if you want to push any of them further. I'd like to know which one cracks first.
