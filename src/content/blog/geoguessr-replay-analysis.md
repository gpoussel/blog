---
title: "The vision model was the easy part: turning GeoGuessr streams into stats"
description: "I built a tool that reads six-hour GeoGuessr VODs and fills a CSV of games, rounds, scores and countries in about 40 minutes on a gaming PC. A local vision model does the reading, but a frame classifier, targeted crops and the game's own rules do most of the work."
pubDate: 2026-10-04
categories: ["AI"]
cover: "geoguessr-replay-globe.jpg"
coverAlt: "Close-up of an old desk globe under warm light, Canada in salmon pink with Saskatchewan and Hudson Bay readable, Greenland and Iceland at the edge."
coverCredit: "Photo by Greg Rosenke on Unsplash"
---

Since April, I've been keeping statistics on every ranked game played by a [GeoGuessr](https://www.geoguessr.com/) duo, by hand, from the stream replays. By early October that was 1,939 games and 18,825 rounds in a CSV. I tried three times to automate it and failed three times. The fourth attempt works: it turns a six-hour VOD into rows in about 40 minutes on my PC, and I spend roughly two minutes per hour of video checking the result. A local vision model reads the screen, and that's the part everyone expects to be hard. It wasn't. This post is about everything around it.

## Why keep stats on someone else's games?

The duo is [JDay](https://twitch.tv/misterjday) and [Némaïdès](https://twitch.tv/nema), two French streamers who play Team Duels in ranked mode, two against two. I'm not one of them, I watch. I liked seeing their progression, but mostly I had questions. There are a lot of German players on GeoGuessr: true, the data says so. When they play Germans, they land in Germany more often: false, not more than usual. That kind of thing is fun to check, so I built [geoscore](https://gpoussel.github.io/geoscore-jday-nema/), a static site with a widget for each question I had.

The rules matter for the rest of this post, so here they are. Each team starts with 6,000 HP. Every round, both teams are dropped somewhere in Street View and place a guess on a map, scoring 0 to 5,000 points. The team with the lower score loses HP: the difference, times a multiplier that grows by 0.5 as the game goes on. First team at zero loses, and the duo's rating moves up or down.

For every game I want the rating before and after, the opponents' rating and nationalities, and for every round the country and both scores. Typed by hand, while scrubbing through a replay. You can see why I wanted a machine to do it.

## Three failed attempts, one lesson each

Each failed attempt left me with one idea that's now a piece of the working tool, so I'll go through them as I describe the pieces. The short version:

- **April, pixel templates.** Compare fixed rectangles of the screen against reference images to know which screen you're on, then read digits with hand-made templates, then [Tesseract](https://github.com/tesseract-ocr/tesseract). It died on italic digits.
- **May, a full app.** FastAPI and React, colour heuristics, [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) on GPU, a MobileNet classifier. Bad results everywhere: reading, splitting into games, and far too much manual review.
- **June, CLIP and nearest neighbours.** Low-quality video, one frame per second, compared against a handful of reference images. Better intuition, weak detection.

The October version was written in one evening with [Claude Code](https://www.anthropic.com/claude-code), from 17:45 to a bit after midnight. That sounds fast, and it was, but it only worked because I came in knowing exactly what had failed and why.

## Piece one: knowing where you are in the video

My April code looked at a 10×10 pixel square at position (30, 90) and asked "is this the result screen?". Then a red veil appears over the whole screen when the timer runs low, and the comparison fails. Then the streamer changes the overlay and every coordinate is wrong. Absolute coordinates break the moment anything moves.

The June attempt had the right idea: use a general image encoder instead of pixels. What it lacked was a real classifier and decent input. So this time:

1. Decode the video on the GPU at 2 frames per second, 384×216.
2. Embed every frame with [SigLIP2](https://huggingface.co/google/siglip2-base-patch16-224), vision side only. A 5 h 54 VOD gives 42,536 frames in 876 seconds, 24 times faster than real time.
3. Cluster the embeddings into 40 groups with KMeans, and build a contact sheet of 24 timestamped thumbnails per cluster.
4. Label each cluster with one of seven classes: in-game, round result, versus screen, end screen, lobby, transition, other.

:::gallery

![A KMeans cluster as a contact sheet: 24 timestamped thumbnails spread over the whole stream, all Street View scenes with the webcam in the corner, so the whole cluster gets the label "in-game".](geoguessr-replay-cluster.jpg)

:::

Labelling 40 sheets instead of 42,000 frames is the trick. And I didn't even label them: the agent looked at the sheets itself and assigned the classes, splitting two clusters where the versus and end screens looked alike. A plain logistic regression on top of the embeddings (768 dimensions in, 7 classes out, 22 KB on disk) agrees with the cluster labels 99.89% of the time.

A frame-by-frame classifier still flickers, so a [Viterbi](https://en.wikipedia.org/wiki/Viterbi_algorithm) pass smooths the sequence, with a fixed penalty for every change of state. Then a small state machine turns screens into structure: a versus screen opens a game, each result screen adds a round, an end screen closes it, and a game with no rounds gets dropped.

On my reference VOD, that gives 23 games and 257 rounds. Exactly the numbers in my hand-made CSV.

## Piece two: reading, but only what you're shown

The quote I keep coming back to is from my own April prompts, translated from French: "I've reached a point where it seems hard to improve the accuracy and speed of the detection. Yet to the naked eye it's 'easy' to read." The digits are italic, so they lean into each other and you can't cut them apart with a vertical line. The video has been encoded three times (game, Twitch, YouTube), so nothing is pixel-perfect. And the numbers are animated: scores count up, damage counters fly over them, a "5K!" badge pops up. My May attempt failed on both fronts: the font, and picking the right frame to read.

A vision language model reads italic digits without any calibration. That part was almost boring. The interesting part was getting a model to answer at all.

I started with free models on [OpenRouter](https://openrouter.ai/), and gave up after about ten minutes. The first one got everything right, then took 38 seconds, then 260 seconds for the second call. Two others returned rate-limit errors. Another read the scores correctly and placed a round in Turkey because the map showed "Iğdır" and "Kars" in big letters, when the marker was in Armenia. So I switched to [LM Studio](https://lmstudio.ai/) on my own machine, behind the same OpenAI-compatible API, and Gemma 4 12B. The first call took 15 seconds and returned an empty JSON: the model's reasoning budget was eating all the tokens. With `reasoning_effort` set to `none`, it reads a frame in about 3 seconds and gets the digits nearly perfect.

But only if you show it the right image. The heads-up display is captured half a second before the result screen ends, once every animation is done. Scores, HP and multipliers are all there, still.

:::gallery

![The top of a round result screen: both teams' HP bars (6000 and 5711), a ×1.5 multiplier badge, "Round 1", and the two scores in italic, 4999 and 4710, with the distances 183 m and 90 km between them.](geoguessr-replay-hud.jpg)

:::

The end screen is sometimes on screen for barely a second before a rank-up animation covers it, so the tool samples up to four moments and stops as soon as it reads a rating change.

### The country isn't written anywhere

This one surprised me. The result screen tells you the scores and the distances, never the country. You have to work it out from the map. Show the model the whole screen and it picks the country with the biggest label, which is often a neighbour.

So the tool finds the answer marker first, a black circle with a yellow flag, with plain [OpenCV template matching](https://docs.opencv.org/4.x/d4/dc6/tutorial_py_template_matching.html) against a 32×32 template. It looks between 3 and 7 seconds into the result screen, when the map has zoomed in on the answer. Then it crops around the marker and asks the model which country contains it, with a short prompt: list the labels closest to the marker as written ("local scripts are a strong hint"), find the grey borders nearby and which side the marker is on, then decide. "Not the country of the biggest label on the map" is a sentence in that prompt, and it earns its place.

:::gallery

![A crop of the map around the answer marker, near Malda on the India and Bangladesh border, with place names written in both Latin and Bengali script and the two teams' guesses near Dhaka.](geoguessr-replay-marker.jpg)

:::

The 12B model reads labels fine but its geography is shaky: it put Monte León in Chile and Strathgordon in Scotland. I built a test set of 59 rounds (26 it got wrong, 33 it got right, to catch regressions) and tried bigger models. Gemma 4 26B-A4B, a mixture of experts with about 4 billion active parameters, fixed 15 of the 26 errors. So the extraction runs in two passes: the 12B reads all the digits and text, then LM Studio swaps it for the 26B, which only does geography.

### Making the 26B model fit in 16 GB

My GPU is an RTX 5080 with 16 GB of VRAM, and the 26B model weighs 15.6 GB. My first instinct was to load every layer on the GPU. Bad instinct: when VRAM overflows, the Windows driver silently falls back to shared memory, system RAM over PCIe, without a single error message. Everything still works, slowly.

:::chart

```yaml
type: bar
title: Seconds per request, by share of model layers on the GPU
unit: " s"
x: ["All layers", "90%", "80%"]
series:
  - name: Time per request
    data: [19, 16.4, 4.9]
caption: "Gemma 4 26B-A4B on an RTX 5080. Keeping 10-20% of the layers on the CPU is far cheaper than overflowing VRAM."
```

:::

The other trap: LM Studio shares the context window between parallel requests. With 16k of context and 8 requests in flight, each one got about 2k tokens and nothing came back complete. I noticed the GPU sitting at 20% before I understood why. The final setting is 70% of the layers on the GPU and 4 parallel requests, about 3 seconds per round.

## Piece three: the rules of the game check the reading

Back in April, while correcting template misreads one by one, I wrote down the rules as a sanity check: you start at 6,000, at most one team loses HP per round, the game ends when a team hits zero. I didn't do much with it then. It's now the reason I trust the output.

The data is redundant, and redundancy catches mistakes:

- The HP shown on screen must equal the HP recomputed from the scores and multipliers. Any gap means something was misread.
- Exactly one team ends at zero, and it must match the "VICTORY!" or "DEFEAT!" on the end screen.
- The rating chains from game to game: rating before, plus change, equals the next game's rating before. One misread rating between two consistent neighbours gets fixed by vote (1,294 back to 1,296). A change hidden behind a badge gets inferred from the next game.

On the reference VOD, these checks raised 10 alerts on 4 games. All 10 were real reading errors. None were false alarms.

> **A detour: GeoGuessr rounds to even.** The HP check kept failing by 1 or 2 points, far too often to be misreads. Damage is the score gap times a multiplier like 1.5, so half points happen. My own calculator used `floor(x + 0.5)`, and that matched 129 rounds out of 257. [Round half to even](https://en.wikipedia.org/wiki/Rounding#Rounding_half_to_even), Python's default `round()`, matched 251; the other 6 were misreads. The game rounds like a banker, and my site had been off by a point or two since April. Fixing it changed 17,027 values in the CSV and not a single game result.

There was a second humbling moment. Comparing the tool's output to my CSV, some "errors" were mine. Roskilde is in Denmark, not the Netherlands. Saskatchewan isn't in the United States. Syktyvkar is in Russia. I typed those. So the export can now replace an existing session in the CSV, instead of trusting it.

## Piece four: a human decides, quickly

From the start I wanted a semi-automatic tool: everything pre-filled, and I approve each game. The review page is a single HTML file served by Python's standard library, no framework (the React frontend of my May attempt had enough bugs of its own). On the left, the games with their alerts. In the middle, the form and the rounds. On the right, the map crop, the captured HUD, what the model read and why, and the local video, with buttons to jump to each round.

:::gallery

![The review page: a list of games on the left, a game form in the middle with yellow alerts such as "my HP read 309, computed 3094", and on the right the map crop around the marker in Poland with the model's reasoning below it.](geoguessr-replay-review.jpg)

:::

The game rules are reimplemented in JavaScript, so every alert updates as I type. Differences with the existing CSV are highlighted in orange. Ctrl+Enter approves and moves to the next game. In practice I spend about two minutes per hour of video, most of it on country borders.

## Where it stands

On the reference VOD (23 games, 257 rounds), the round counts, ratings, rating changes and results are 100% correct. Scores are at 99.4%. Round countries are at 94.2%, and some of the "errors" left are mine. Opponents' flags are the weakest at 91.3%: they're about 25×15 pixels, even after scaling them up 2.5 times.

:::chart

```yaml
type: bar
orientation: horizontal
title: Accuracy per field on the reference VOD
unit: "%"
xMax: 100
x: ["Rounds, ratings, results", "Scores", "Round country", "Opponents' flags"]
series:
  - name: Accuracy
    data: [100, 99.4, 94.2, 91.3]
```

:::

It also has holes. The screen classifier was trained on a single VOD from June; it works on the October layout, but I haven't measured how well. Crops assume 1080p. A tie between both teams broke the score reading on the very first evening, because the scores are only visible for about two seconds during their count-up animation. That one is fixed, the next surprise isn't yet.

The vision model replaced six months of digit templates in an evening, and I'm still a bit amazed by that. But on its own, it read the wrong country, at the wrong moment, from the wrong frame. What made it useful was a 22 KB classifier telling it where to look, a 32-pixel template telling it what to look at, and arithmetic telling me when not to believe it. The code isn't public yet: I'd like it to need less of me first. If you've built something like this, how did you deal with a model that's right 94% of the time without re-checking all of it by hand?
