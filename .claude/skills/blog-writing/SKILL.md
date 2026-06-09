---
name: blog-writing
description: >-
  The house writing style for this blog: titles, articles, and any prose that ships
  on the site (post bodies, the about page, taglines, microcopy, RSS blurbs, social posts).
  Use this whenever you draft, rewrite, edit, or critique English text meant for the blog,
  even if the user just says "write a post about X", "tighten this paragraph", or "give me a
  title" without naming a style. It captures a casual, curious, reading-first voice written
  by a French C2 English speaker, and a list of AI-slop patterns to avoid. If you are writing
  words a reader will see on this site, reach for this skill first.
---

# How we write here

This blog has one voice. A French developer who reads and writes English fluently (C2), but who is not a native speaker and doesn't pretend to be. The writing is calm, curious, and honest. It explains things the author just figured out, to the person they were a week ago. It never tries to sound impressive.

Think of the reader as a peer who's smart but hasn't met this particular topic yet. You're not lecturing down to a beginner, and you're not performing for experts. You're sharing.

The whole point of the rules below is to sound like a single specific person thinking out loud, not like a content machine filling space. When a rule and your judgment disagree, trust the voice: would *this person* actually write it this way?

## The voice in one breath

- Curious, not authoritative. "Why is this still so confusing?" beats "A comprehensive guide to..."
- Plain words. Short sentences carry the weight; long ones explain.
- Honest about what you don't know. "I'm still not sure why" is a fine thing to write.
- Light and a little dry. A small joke is welcome. A performance of enthusiasm is not.
- Concrete over abstract. Real commands, real numbers, real names, real mistakes you made.

## Titles

Titles here follow the [jvns.ca](https://jvns.ca/) school. They're the part people see first, so get them right.

**Sentence case, not Title Case.** Write "How HEAD works in git", not "How HEAD Works In Git". Only proper nouns and acronyms keep their capitals.

**Be plain and searchable, not clever.** The title should say what the post is about so clearly that someone scanning a list knows whether to click. "Getting started with X" over "X: a journey". Clarity beats wit every time. If a clever title and a clear title both exist, ship the clear one.

**Questions make great titles.** A genuine question signals curiosity and meets the reader where they are:
- "Why is DNS still hard to learn?"
- "Why do domain names sometimes end with a dot?"
- "Why does 0.1 + 0.2 = 0.30000000000000004?"

**"Notes on..." is a license to be informal.** It lowers the stakes and sets honest expectations:
- "Notes on switching to Helix from vim"
- "Some notes on starting to use Django"

**First person is allowed, even celebrated.** "Things I built", "I conquered thread pools! For today, at least."

**Small, specific, concrete.** "Entering text in the terminal is complicated" tells you exactly what you're getting. "Terminal colours are tricky" admits difficulty instead of promising mastery. That honesty is the style.

What to avoid in titles: "The Ultimate Guide", "X 101", "Everything you need to know", "Mastering X", number-bait ("7 tips..."), and anything that promises more than the post delivers.

## Shape of a post

**Open with the point, in one paragraph.** Say what the post is about and who it's for, fast. Don't warm up for 600 words. A good opener often states a problem you hit, then promises the thing you figured out. The reader should know within three sentences whether to stay.

**Lead with the concrete, then explain.** Show the command, the output, the error, the screenshot first; explain the mechanics after. People understand a real example faster than an abstract description of one. This is the Simon Willison move: here's the thing working, *now* here's why.

**Use subheadings, even in short posts.** They're the single best tool for making a post scannable, and a reader should be able to skim just the headings and get the arc. Two or three are plenty for a 500-word post. Write them in sentence case like the title, and make them say something ("The program was never the point") rather than label a section ("Background"). A heading that states a claim pulls the reader into the paragraph under it. As a bonus, a clear heading is what search engines and AI assistants quote when they summarize the post, so an honest, specific heading is also the SEO-friendly one.

**Link to your sources, inline.** When you state a fact, a result, a tool, or a name, link it. It does three things at once: it lets the reader verify you (which builds trust), it gives credit, and it helps the post's search ranking through real outbound links to authoritative pages. Link the specific words that name the thing, not "click here". Prefer the canonical source: the official contest page, the project's own site, the Wikipedia article for a concept the reader might not know. Don't over-link, one or two per paragraph at most, and never link the same destination twice. If you can't find a real source for a claim, that's a sign to soften the claim or cut it, not to invent a link.

**Let paragraphs breathe unevenly.** A one-sentence paragraph for emphasis. A longer one when you're actually working through something. Never the same metronomic 3-4 sentence block over and over.

**Real examples, not `foo`/`bar`.** Use names, real data, the actual thing you typed. `["Charles Adok", "Samantha Frederick"]` over `["foo", "bar"]`, unless abstraction genuinely makes a hard point clearer.

**Close by saying something, not by summarizing.** Don't end with "In conclusion" or a recap of what you just said. End with a thought, an open question, a thing you're still wondering about, or where you'd go next. The last paragraph is often the second-most-read part of a post, so make it earn its place.

**Short by default, but follow the brief.** When nothing in the prompt or context says otherwise, aim for 400-700 words. Most posts here are short on purpose: one idea, made well, then stop. Past 800 words you're usually saying the same thing twice or explaining something the reader already gets.

But this default yields to the user. If they ask for a specific length ("a quick 200-word note", "a long deep-dive", "around 1500 words"), or the topic plainly needs more room (a tutorial with several steps, a piece working through a genuinely complex argument), follow that instead. The 400-700 range is the fallback when no signal is given, not a ceiling to enforce against the user's wishes. Read the brief first, fall back to the default second.

The first draft is almost always too long. Write it, then ask of each paragraph: does the post die without this? If not, it goes. Redundant restatements, throat-clearing, and the second example that makes the same point as the first are the usual fat. Trust the reader to keep up.

## Categories

Every post declares one or more categories in frontmatter, and each one becomes a clickable pill linking to its `/category/<slug>/` page:

```yaml
categories: ["AI", "Competitive Programming"]
```

**Reuse before you invent.** There is no registry: the set of categories is derived from the posts themselves, so check what already exists before naming a new one (`grep -h categories: src/content/blog/*.md`). The current set: **AI**, **Competitive Programming**, **Travel**. A category with a single post makes a thin page, so a new name has to earn its place: add one only when you can already picture the second and third post that will live there. Otherwise file the post under the nearest existing category.

**Naming.** A short noun phrase in Title Case, English, naming a broad subject area rather than a tag: "Travel", not "my trip to Narbonne". One or two categories fit most posts; three is the ceiling, and a post that seems to need more probably has a focus problem, not a metadata one.

**Match the exact spelling of an existing category.** Identity is case-insensitive ("competitive programming" and "Competitive Programming" are one category), but the *displayed* name is the casing of the most recent post. So a casing slip in a new post silently re-labels the pill on every older post in that category. Copy the existing spelling, don't retype it.

**Put the most representative category first.** The first one is what shows as the eyebrow on the post's social-share card; the rest appear only on the site itself.

## Images and galleries

Photos go in a `:::gallery` block, which works anywhere in the body. It holds one to four images and picks the layout from the count: one image fills the column at its natural shape, two or three share a single row, four become a 2x2 grid. Clicking any photo opens it large in a lightbox.

```markdown
:::gallery

![The harbour at Cerbère, where the Pyrenees drop into the Mediterranean.](harbour.jpg)
![A pink flower spike against dense, sunlit greenery.](flower.jpg)

:::
```

The filename resolves to `src/assets/photos/`, the same convention as the post's `cover`. A new phone photo has to be processed first: `pnpm photo <file>` writes the master into that folder (see CLAUDE.md). A bare filename with no matching file fails the build on purpose. An `http(s)://` URL also works and is rendered as-is, without optimization.

The alt text does double duty. It's the caption shown under the enlarged photo, and it's what a screen reader reads. So it's real copy: write it in the house voice, specific and plain ("The harbour at Cerbère, where the Pyrenees drop into the Mediterranean"), not a label ("harbour photo"). And resist padding. One honest photo that earns its place beats four that fill space.

## Charts

Data goes in a `:::chart` block holding one `yaml` code fence that describes the chart. It renders to a static SVG at build time, so it carries no runtime JS and re-themes with the page (light/dark) automatically, using the site's fonts and a brand palette (slate, steel, mauve). Five `type`s exist: `bar` (grouped), `stacked-bar`, `line`, `area`, `donut`.

````markdown
:::chart

```yaml
type: stacked-bar
title: Energy mix by year
unit: "%"
x: [2019, 2022, 2025]
series:
  - name: Renewables
    data: [22, 31, 44]
  - name: Gas
    data: [40, 38, 32]
  - name: Coal
    data: [38, 31, 24]
```

:::
````

The fields:

- `type` (required): `bar`, `stacked-bar`, `line`, `area`, or `donut`.
- `title` (optional): a heading shown above the chart, in the UI font.
- `caption` (optional): a line under the chart, like a figure caption.
- `unit` (optional): appended to value labels, e.g. `"%"`, `" h"`, `"k€"`. Omit it for plain numbers. There's nothing percentage-specific: a stacked bar without `unit` just shows raw totals.

For `bar`, `stacked-bar`, `line`, and `area`:

- `x` (required): the category or time labels along the bottom axis.
- `series` (required): a list of `{ name, data }`. `data` lines up with `x`. One series is fine (a single line, or a plain histogram); more than one draws multiple lines, stacks (`stacked-bar`), or sits side by side (`bar`). Up to six series get distinct colours.

Bars come in two shapes. `type: bar` draws **grouped** bars: within each category the series sit flush, side by side, so you compare values category by category (the y-axis is scaled to the largest single value). `type: stacked-bar` stacks them into one bar per category, so you read the total and each part's share. You can flip either with `grouped: true` or `stacked: true`. Both accept `orientation: horizontal` to run left-to-right with categories down the side (good for ranking or long labels), and an optional `yMax`/`xMax` to pin the axis.

```yaml
type: bar
title: Page views by quarter
unit: "k"
x: [Q1, Q2, Q3, Q4]
series:
  - name: Blog
    data: [12, 19, 24, 31]
  - name: Docs
    data: [8, 11, 9, 14]
```

For `donut`:

```yaml
type: donut
title: Time by activity
unit: " h"
data:
  - { name: Coding, value: 50 }
  - { name: Reading, value: 30 }
  - { name: Meetings, value: 20 }
```

The legend shows each slice's share as a percentage; the centre shows the total.

Two habits keep charts honest. Give every chart a `title` that states what it shows, the same way a heading states a claim. And reach for a chart only when the shape of the data is the point: three numbers belong in a sentence, not a donut. A broken or malformed `:::chart` renders a visible "Chart error" note rather than failing the build, so a mistake is obvious in preview.

## Sentence-level craft

This is where text stops sounding human. Most "AI slop" lives at the sentence level, and so does the cure.

**Vary sentence length, hard.** This matters more than any other single thing. Mix 3-word sentences with 30-word ones. Never write three sentences of similar length in a row. Machines cluster everything around 15-25 words; people swing between a blunt jab and a long, winding clause-heavy exploration that doubles back on itself before it lands. Do that.

**Vary sentence type too.** Not everything is a declaration. Ask a real question mid-paragraph. Drop an imperative. Use a fragment. For emphasis. A mind that wonders and commands and trails off reads as a mind.

**Use contractions.** "It's", "don't", "we're", "won't", "that's". Not using them reads stiff and machine-made. This is casual prose, write it like you'd say it.

**Cut the undermining words.** "Just", "simply", "clearly", "basically", "of course", "obviously". They assume the reader already knows what you're about to teach, and they usually do nothing. "Just run `npm install`" → "Run `npm install`".

**Take a position.** "This API is badly designed because..." beats "Some might argue the API has tradeoffs." False balance is a tell. The real world is rarely 50/50, so don't pretend it is. If you have an opinion, say it.

**Be specific.** "Three Astro plugins" not "various tools". "Since 2023" not "in recent years". "I lost an afternoon to this" not "this can be time-consuming". Specificity is the cheapest way to sound like you were actually there.

**Limit em dashes to roughly one per 500 words.** This blog already avoids them by convention (see CLAUDE.md): prefer commas, colons, parentheses, or just a new sentence. The em dash has become the house mark of generated text, and avoiding it happens to match the site's existing style.

**Avoid the rule of three.** Machines list things in threes by reflex: three adjectives, three examples, three parallel clauses. List two. Or four. Or one. Break the pattern.

## The non-native angle (this is a feature)

The author is French and writes excellent but non-native English. Don't manufacture errors, that would be fake and bad. But do let the style reflect a clear-thinking European writer rather than a chatty American content farm:

- Lean into directness and economy. French intellectual prose values saying the thing plainly. That instinct is good here.
- Skip idioms you'd only reach for to "sound native". No "at the end of the day", "game-changer", "hit the ground running", "low-hanging fruit", "circle back". If an idiom isn't one the author would naturally use, drop it.
- A slightly formal-but-warm register is on-brand. Dry understatement over hype. "This is mildly annoying" lands better than "This is a nightmare!!!".
- It's fine to be plain to the point of bluntness. That blunt clarity is part of the voice, not a flaw to smooth over.

The target isn't "passes as American". The target is "a sharp, curious French developer who writes clean, honest English and isn't trying to impress anyone."

## Words and phrases to avoid

Reach for the full list in `references/banlist.md` before finalizing any post. The short version of the worst offenders:

- Puffery: pivotal, crucial, vital, seamless, robust, comprehensive, vibrant, rich, meticulous, leverage, utilize, delve, foster, underscore, showcase, navigate (figurative).
- Poetic nouns used figuratively: tapestry, landscape, realm, journey, ecosystem, cornerstone, beacon, testament.
- Opener crutches: "In today's world", "In the ever-evolving landscape of", "In an era where".
- Closer crutches: "In conclusion", "In summary", "Overall", "At the end of the day".
- Formula sentences: "It's not just X, it's Y", "Not only X but also Y", "From X to Y", "No A. No B. Just C."
- Fake-casual tells: "Here's the thing:", "But honestly?", "Let me be clear:", "Let's dive in".
- Vague attribution: "Experts say", "Studies show", "It's widely regarded as". Name the source or cut it.

When you hit a banned word, don't swap in a synonym. Rewrite the sentence to say what you actually mean in plain language. The word was usually a symptom of a sentence that wasn't saying anything.

## A quick pass before you ship

Read the draft once with these eyes. You don't need to score it, just notice:

1. Does the title pass the jvns test: sentence case, plain, specific, no hype?
2. Does the opening make the point in the first three sentences?
3. Read three paragraphs in a row aloud. Do the sentences vary in length, or do they all sound the same? Awkward rhythm is audible even when it's invisible on screen.
4. Search for the worst banlist words and the undermining words ("just", "simply"). Kill them.
5. Count em dashes. More than one or two in a normal post? Replace most.
6. Is the length right for the brief? If the user gave no target, aim for 400-700 and cut any paragraph that repeats another. If they asked for longer or shorter, match that instead.
7. Does the ending say something new, or just repeat the intro?
8. Does the frontmatter `description` work as a search snippet? It's what Google and social cards show, so make it a real, specific sentence (not a teaser), and let the title's main words appear naturally in the post's first paragraph and at least one heading.
9. Do the `categories` reuse existing names with their exact spelling, most representative first, and no more than the post actually needs?
10. If the post uses a `:::gallery`, does each image's alt text read like a real sentence in the house voice? It's the caption and the screen-reader text, so a vague label is a missed chance.
11. Last check: does this sound like one specific curious person, or like anyone could have generated it? If it's the second one, find the place to put a real opinion, a real number, or a real moment of doubt.

Don't sand it down to perfection. A small redundancy kept for rhythm, a fragment, a casual aside in the middle of a technical point: those are the fingerprints of a person. Leave some in.
