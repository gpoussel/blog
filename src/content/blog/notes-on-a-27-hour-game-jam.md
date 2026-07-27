---
title: "Notes on building a game in 27 hours"
description: "Let Them Bee is an incremental game I built for the DTJ36 jam in 27 hours: 29 commits, 10,743 lines of TypeScript, two runtime dependencies, and Claude Opus 5 on low reasoning effort as my only assistant. Where the time went, and why installing ESLint halfway through the jam was a good idea."
pubDate: 2026-07-27
categories: ["Web", "AI"]
cover: "let-them-bee.jpg"
coverAlt: "A bee on a yellow flower head, wings folded, deep in the pollen."
coverCredit: "Photo by Meggyn Pomerleau on Unsplash"
---

I spent last weekend making a game for DTJ36, a jam with a one-word theme: bee. The result is [Let Them Bee](https://gpoussel.itch.io/let-them-bee), an incremental game where you fly a single forager by mouse for one trip, hive to flowers to hive, and that trip is then recorded and replayed forever without you. The nectar comes in on its own. You spend it building your comb, cell by cell, and when the hive has grown you take the controls back and fly a better trip.

:::gallery

![The title screen: a pixel-art meadow with flower beds and a pond, the game's name in wax-yellow letters, and a bee sitting on the exclamation mark.](let-them-bee-title.png)
![The meadow during a run: the forager crosses open flowers while the panel on the left tracks the colony and the one at the bottom shows the best trip so far, at 10.48 nectar per second.](let-them-bee-meadow.png)

:::

The jam ran for 36 hours; I used 27 of them. First commit to last: 29 commits on `main`, 10,743 lines of TypeScript across 88 files. Here's what I noticed afterwards, reading my own git history.

## Opus 5 on "low" reasoning, all weekend

I wrote none of those 10,743 lines by hand. I worked with [Claude Opus 5](https://www.anthropic.com/claude) the whole jam, on the **low** thinking effort, and never moved the dial up.

That setting turned out to be the right trade between cost, speed and quality for this kind of work. Higher effort means waiting longer for the model to deliberate, and during a jam the loop I care about is type a request, see the meadow move, judge it, ask again. On low, that loop stays under a minute. The few times I suspected I needed more thinking, what I actually needed was a clearer instruction.

The division of labour matters more than the setting, though. I made the design decisions: what the game is, what the trip means, which upgrades exist, whether a change was fun. The assistant did the implementation and ran the simulations, which is where it earns its keep in a game like this. Balancing an incremental game means running the numbers forward: does the curve stall, does the comb open too fast, is minute ten still interesting? That's tedious arithmetic, and it's precisely the work I don't want to be doing by hand at hour 22.

## The biggest file in the project is data

I expected the game loop to dominate. It doesn't.

:::chart

```yaml
type: bar
title: Lines of TypeScript by folder
orientation: horizontal
x: [scenes, ui, config, gfx, systems, dev, entities]
series:
  - name: Lines
    data: [2442, 2049, 1905, 1863, 1652, 490, 295]
```

:::

`config/upgrades.ts` alone is 1,140 lines, and it contains no logic at all. It's the comb: which cell costs what, what it unlocks, what it does to the numbers. The largest thing I wrote in 27 hours was content, not engine. `systems/GameState.ts` comes second at 916 lines, and the actual simulation fits under that.

:::gallery

![The comb screen: hexagonal upgrade cells around the hive, the built ones in green, the ones you can afford outlined in orange, and everything beyond the edge still hidden.](let-them-bee-comb.png)

:::

The other line that surprised me is `gfx/` at 1,863 lines. That's the animated logo, the garden, the wax textures, the nine-slice frames: art written as code rather than drawn. With two runtime dependencies ([Phaser 4](https://phaser.io/) and `phaser-pixui`) and no artist, generating the visuals was cheaper than sourcing them.

## Installing ESLint in the middle of a jam

At hour 20, with the clock running and the game half built, I stopped and merged a pull request that added Prettier, [typescript-eslint's `strictTypeChecked`](https://typescript-eslint.io/users/configs/#strict-type-checked), a pre-commit hook and a CI workflow. Forty files touched, 2,234 insertions, 702 deletions. Nothing playable came out of it.

Every jam instinct says don't. You clean up after, if the game ships.

The 15 pull requests that came after went faster. Not because the linter caught bugs, though it caught a few, but because I stopped deciding things: no more formatting arguments with myself at 2 AM, no more wondering whether a `possibly undefined` was real. Twenty hours in is roughly when a jam codebase starts fighting back, and that's precisely the moment the tooling pays for itself. Doing it at hour 2 would have been too early; there was no shape to enforce yet.

The three CI workflows went in on the first evening, though: build, GitHub Pages, itch.io. The game was deployable before it was playable, which I'd do again. Deploying is the failure mode you don't want to discover at hour 26.

## The GDD describes the game as it is

I wrote a 1,166-line design document for a 27-hour project. A 1:9 ratio of docs to code, which is unusual for anything, let alone a jam.

It survives because of one rule I put in `CLAUDE.md`: the document describes the game as it is, never as it was imagined. Any gameplay change updates it in the same commit.

The second half of the rule is that no number is ever copied into it. Balancing values live in `src/config/`, and the document says why they're there. Nothing to synchronize, nothing that can quietly go stale. It's not a plan, it's a mirror, and that's the only kind of design doc I've managed to keep alive past day one.

## Commit titles that read as verse

The titles are in French, and each one describes the change to the game rather than the change to the code:

> _La reine s'en va, et ses filles naissent en sachant._ (The queen leaves, and her daughters are born already knowing.)
>
> _Le rayon s'étend, et l'abeille nue vole de travers._
>
> _Le pré pioche dans un sac, et les bourgeons s'ouvrent à temps._

That last one is a bag-shuffle random distribution for flower spawns plus a timing fix on bloom. You can read the whole history as a summary of the game's evolution, which is more than I can say for most of my commit logs. It costs about 20 seconds per commit.

## One palette, five colours, locked on day one

`#71653F #D6DC53 #F3B468 #639B35 #4A655A`. Written into the project conventions before the first sprite: no ad hoc shades, ever. Every texture and every UI element draws from those five.

Visual coherence in a jam usually happens by accident or not at all. This one was decided upfront and cost nothing to maintain, unlike the usual last-hour pass where you try to reconcile eleven greens. Same idea for asset credits: the rule was that an asset is added to the credits screen in the same commit that adds the asset. Nine entries, zero panic at the end about which font came from where.

## You can't put "is this fun?" in a pipeline

I keep reading that agents will soon produce games end to end, from a prompt to a finished build. After a weekend of doing it with one, I don't believe it, and the reason isn't code quality.

The hard parts of this jam were never implementation. Deciding that the unit of progression should be a recorded gesture rather than a number going up. Feeling that the meadow was too forgiving and that nectar had to decay from the moment a flower opens. Playing my own trip twenty times and knowing, without being able to justify it, that a lap of about three seconds felt right and a longer one felt like homework. Those are judgements about an experience I was having. The model wasn't having it.

So the honest description is accelerator, not replacement. It removed the friction between an idea and a version I could play, which is enormous: I tried far more variations than I would have alone, and trying variations is how a jam game gets good. But somebody has to want a specific thing, and then be disappointed by the first version of it. That part didn't move at all.

## What I'd change

The rhythm was lopsided: 4 commits the first evening, 25 the next day, a pull request every 35 minutes on the Sunday. Nobody works like that twice in a row, and I wouldn't want to.

And I know where the nine unused hours should have gone. Three of my first four pull requests went into the title screen: the animated logo, the nine-slice buttons, the garden, a little house at the edge of the vegetable patch. The game didn't exist yet. I'm not sorry about it, a first impression is a real thing, but the meadow, which is where the game actually happens, got its design in a single pull request on Sunday morning and never got a second pass.

If you've made a jam game, when do you stop and set up the boring parts?
