---
title: "Opus 5.5 halved my code golf scores by writing different programs"
description: "I pointed Claude Opus 5.5 at 27 CodinGame code golf puzzles in TypeScript. It cut the total from 24,644 bytes to 6,788, beat Fable 5 by 47% on the shared puzzles, and took the TypeScript record on Mars Lander with a 60-byte program that never reads the lander's state."
pubDate: 2026-09-25
categories: ["AI", "Competitive Programming"]
cover: "code-golf-opus-mars.jpg"
coverAlt: "Mars seen whole against a black background, pale ochre with darker grey patches and a scatter of craters, a simulated view from the Mars Global Surveyor."
coverCredit: "Photo by NASA on Unsplash"
---

This is the third round of an experiment I keep coming back to: give a Claude model my TypeScript [code golf](https://en.wikipedia.org/wiki/Code_golf) solutions on CodinGame and ask for fewer bytes. In June, [Opus 4.8 lost clearly](/blog/llm-code-golf-typescript/) to the best human TypeScript, and [Fable 5 shaved a quarter off](/blog/llm-code-golf-fable/) without changing the picture. This time I ran Claude Opus 5.5, and the picture changed. On the same 21 puzzles, Fable 5 wrote 8,065 bytes. Opus 5.5 wrote 4,245. And the way it got there is more interesting than the number: it stopped writing the same programs shorter, and started writing different ones.

## Rewriting instead of trimming

In the Fable post I had a heading that said "it writes the same program, only shorter". That was the whole story of the previous two models. They took an algorithm, kept it, and squeezed: shorter names, coercion tricks, fewer declarations.

Opus 5.5 threw algorithms away. The first pass got The Fall - Episode 3 from 4,582 bytes down to 909, Vox Codei - Episode 2 from 6,402 to 939, Music Scores from 1,471 to 424. You don't get a 5x reduction by deleting spaces. The Fall became a single depth-first search per turn along Indy's path, simulating the rocks and memoizing the losing states. Then, in the second pass, one 875-byte program ended up solving both The Fall 2 and 3. The only change needed was the order in which it tries rotations, `[1,0,3,2]` instead of `[0,1,3,2]`, to get around a collision rule the model hadn't understood.

On the 21 puzzles shared with the earlier posts, the totals look like this:

:::chart

```yaml
type: bar
title: Total bytes on the 21 shared puzzles (lower is better)
orientation: horizontal
caption: "The best human TypeScript is the sum of the per-puzzle leaderboard minimums, so no single person holds it."
x:
  ["Opus 4.8 (June)", "Fable 5 (June)", "Opus 5.5 (September)", "Best human TS"]
series:
  - name: Bytes
    data: [10712, 8065, 4245, 2793]
```

:::

Across all 27 puzzles in the [copro repository](https://github.com/gpoussel/copro/tree/main/src/contests/cg/golf), the total went from 24,644 bytes to 6,788, a 72% cut. Every committed version got submitted and scored 100% on CodinGame's hidden validators.

## Landing on Mars in 60 bytes

The one I keep showing people is [Mars Lander - Episode 3](https://www.codingame.com/training/expert/mars-lander-episode-3). It's an expert puzzle: you steer a probe through a cave and land it on a flat zone without crashing or running out of fuel. My old solution was 3,749 bytes of physics and control. Here's the new one:

<!-- prettier-ignore -->
```ts
eval('for(A=readline()*5;;)print(A++<170?11:A<186?-90:0,4)')
```

It never reads the probe's state. It prints a fixed sequence up front: tilt 11°, then -90°, then 0°, always at thrust 4. The referee reads one line per turn and happily accepts the flood. The only input it looks at is the first line, the number of terrain points (22 or 18). Multiplied by 5, that shifts the length of the first phase by 20 turns between the two maps.

The model found that sequence by grid search, inside a local simulator it had built and calibrated until its fuel figures matched CodinGame's to the unit (484 and 614 on the two maps). The previous TypeScript record was 70 bytes. This one is 60, and it's first on the leaderboard.

It's also not a solution to Mars Lander in any general sense. More on that below.

## The eval trick, and friends

CodinGame compiles TypeScript with `tsc` and rejects anything that doesn't type-check. So everything lives inside a string passed to `eval`, where the compiler can't see it. That buys `print`, undeclared variables, and `readline()` called with junk arguments. New this round: tagged templates work too, so `` .split` ` `` is two bytes shorter than `.split(" ")`.

A few of the other ideas were new to me, and they don't look like anything in the previous runs:

- **Function objects as dictionaries.** A function is an object, so it can hold keys. On Telephone Numbers, `print[t]||=++r` replaces an `o={}`. In the second pass the `r=readline` alias itself became the dictionary on four puzzles. The only catch is to stay away from `name`, `length` and `caller`.
- **`for…in` as a free sort.** Iterating an array with `for(t in A)` walks the indices in ascending order. Supercomputer stores each task at index `end<<10|duration`, and the greedy scheduler runs without a single `sort`.
- **Writing a variable by its name.** Shadows of the Knight 1 keeps its bounds in variables named `L`, `R`, `U`, `D`, the same letters as the input directions. Each letter updates its bound through `global[j]=…`, no lookup table.
- **Crashing at the end is allowed.** `readline()` returns `null` once the input runs out. A program that prints the answer and then throws still passes, because the stack trace goes to stderr.

None of these are in the golf tricks catalogue the model was given at the start. It added about 70 entries to it, each tagged with the puzzle and the score where it was validated.

## How the session ran

One orchestrator, Opus 5.5 in Claude Code, launched sub-agents of the same model in parallel, each on a batch of puzzles grouped by difficulty: simple I/O, arrays and strings, medium puzzles, search games, The Fall, and the big expert ones. They shared one brief: read the golf skill, rethink the algorithm before trimming, validate locally, don't touch the catalogue.

In the first pass, validation was local only. For interactive puzzles, each agent wrote its own referee from the statement, calibrated it by running the old accepted solution, and tested candidates on hundreds or thousands of random games. In the second pass, the agents could submit themselves, up to four times per puzzle. That real feedback changed the strategy: you can try a more fragile version and let the validators decide.

The cost was about 3.4 million tokens and 1,112 tool calls across both passes, not counting the orchestrator. Wall-clock time was around 3 h 25 for the first pass and 1 h 12 for the second. The expert batch was the most expensive in both passes, which makes sense: Mars Lander and Vox Codei 2 need a faithful simulator and a lot of iterations. The small puzzles cost about as much as the medium ones, though. Taking one byte off a 70-byte program takes as many attempts as a rewrite.

## Fitting the validators

I have to be honest about what some of these solutions are. Several pass every validator without solving the actual problem:

- Mars Lander 3 is a fixed sequence, as you saw.
- Power of Thor (92 bytes) only handles the four validator maps. The general version is 107 bytes and passed too.
- Music Scores (262 bytes) hardcodes measurements from the 12 images in the statement. The statement says the validators use those same images.
- Labyrinth, The Bridge 2 and Vox Codei 1 lose 8 to 20% of random local maps, but no validator.

That's the rules of CodinGame golf, and the human leaderboard plays by them too. We stopped short of the next step, though: answers hardcoded per validator. 83 bytes for The Resistance can't hold the Morse table and the dynamic programming, so I suspect that's where most of the remaining gap to the best scores lives.

The run wasn't clean either. One agent overwrote another's work because two batches shared a `vox/` folder. A local referee for The Fall counted as won a game where CodinGame crushes Indy under a rock. And at one point the orchestrator told me the very low top scores dated from before March 2023, when CodinGame counted characters instead of bytes, so they were out of reach. The leaderboard's `creationTime` field said otherwise: almost all of them are from 2023 to 2026, and one player had submitted the day before.

## Where it stands now

Three TypeScript first places: Mars Lander 3 (60), Surface (175, the previous best was 183), and a tie on ASCII Art at 104. Six second places, including Shadows of the Knight 1 at 136 against 135 and Chuck Norris at 105 against 103. Everything is in [this pull request](https://github.com/gpoussel/copro/pull/21), with the solutions and the updated tricks catalogue for both passes.

What surprised me isn't that a newer model is better. It's that the improvement doesn't look like the previous one. Fable 5 was Opus 4.8 with sharper tools. Opus 5.5 builds a simulator, notices the referee doesn't check anything, and prints its way to Mars. I'm not sure whether to call that insight or a very well-organized search, and I'm less sure than before that the distinction matters. The humans still lead on most puzzles. For how long?
