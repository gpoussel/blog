---
title: "Notes on Anthropic's Partner Basecamp"
description: "Two days at Anthropic's Partner Basecamp: the diagnostic loop, evals as a discipline, the three phases of AI inside a company, and an evening to rewalk London."
pubDate: 2026-05-30
category: "AI"
cover: "london-eye.jpg"
coverAlt: "The London Eye gone quiet over the Thames at dusk, a minute before the lights came up."
---

Last week I got to spend two days at Anthropic's Partner Basecamp. It's a training for the people who carry [Claude](https://www.anthropic.com/claude) into client work: a morning of commercial framing, an afternoon of building, repeated. I came back with a clearer idea of how to sell AI to people who don't actually want it, a mental model for where AI lands inside a company, and, almost as a bonus, an evening or two to walk London again. Here's what stuck.

## The codes for selling AI to a reluctant client

The morning sessions were less about the model than about the conversation around it. We worked through a client playbook: which conversations are worth starting this week, and how to start them. The blockers turned out to be the familiar ones. Security and permission processes that move slower than the technology. Organisations that buy AI without enabling the people who are supposed to use it. None of that is a model problem.

What I took away was the vocabulary for it. The codes, almost, for walking a hesitant client from "this feels risky" to "fine, let's try this one small thing". That was the most useful part of the two days, and the part I least expected to find useful.

## Three phases of AI, not one

The framework I keep coming back to: AI arrives in a company in three waves, and people confuse them constantly. First, AI for every employee, the assistant on everyone's desk. Second, AI for the people who build software, which is where [Claude Code](https://www.anthropic.com/claude-code) and agentic coding live. Third, AI inside the product you ship to your own customers, built on something like the [Claude Agent SDK](https://docs.anthropic.com/en/api/agent-sdk/overview).

Different tools, different risks, different buyer in the room. Mixing them is how a meeting goes in circles. Seeing them drawn apart made a lot of my half-formed arguments fall into place.

## The technical part was the hands-on part

The afternoons were building, not slides. A few things I'll reuse:

- **The diagnostic loop**: symptom, hypothesis, evidence, recommendation. A way to debug any AI system, from one broken prompt up to a fifty-agent pipeline. It reads as obvious. It is not obvious when you're staring at a flaky agent at six in the evening.
- **Evals as a discipline, not a vibe.** Moving from "try it and see" to a repeatable suite, from simple graders up to [LLM-as-a-judge](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests), before anything reaches a customer.
- **Model economics.** We took a production prompt from roughly 25% to over 90% accuracy on Haiku, the small cheap model, and watched what [prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) does to latency and spend. The lesson: reach for the smallest model that clears the bar, then engineer the prompt, instead of defaulting to the largest one.

The advice I liked best was almost a throwaway line from the Anthropic side: when you're stuck, ask Claude. Even they do. The career version of the same idea was to protect a little time to learn every single day. In a field moving this fast, that stopped sounding like a platitude.

## The one thing I'd have changed

A small regret. We only had Anthropic's own people for about thirty minutes, over a remote video call, with no one from the company in the room. The facilitation was excellent and the material was plainly theirs, so this isn't a complaint about the content. I'd just have traded an exercise or two for more direct time with the people building the thing. One of their architects called the partnership a two-way exchange, and I wanted a bit more of the exchange. Anthropic stays a partner I'm glad to work alongside. This is a wish, not a grievance.

## And London, for an evening

The other quiet gift of a work trip is the trip. Two evenings off the daily routine, a city I hadn't walked properly in years, and a phone in my pocket.

:::gallery

![Westminster Bridge near sunset, the Elizabeth Tower still catching light while the rest of Parliament slips into shadow.](london-westminster-bridge.jpg)
![The London Eye gone quiet over the Thames at dusk, a minute before the lights came up.](london-eye.jpg)
![The clock tower the next night, lit gold against a deep blue sky and a skyline full of cranes.](london-big-ben-night.jpg)
![Rows of red lanterns strung over a busy Chinatown street, just north of Leicester Square.](london-chinatown.jpg)

:::

The part I'm still chewing on isn't any single technique. It's that the hard skill now isn't prompting; it's deciding which problems are worth pointing all of this at, and defining them precisely enough that the tools can help. I don't have a clean answer for that yet. For now I'm fine carrying the question around.
