# Style guide

How we write in this repository. The goal is documentation that is easy to read, easy to review, and consistent across
many authors.

## Formatting

Prettier owns formatting here, Markdown included. Run `npm run format` before opening a PR, or let your editor do it on
save.

Line breaks inside a paragraph are the formatter's business. Write a paragraph however it comes out and let Prettier
wrap it at 120 columns; the settings live in `.prettierrc`. Do not hand-wrap prose or hand-align table pipes, because
the next run undoes it.

## Voice and tone

Write plainly and concretely. Prefer short sentences, concrete examples, and the active voice.

Give each sentence one idea, and aim for 25 words or fewer. Split a sentence longer than 35 words, unless its parts only
make sense together, such as a step in an argument joined by "so" or "because". A list buried in a sentence usually
reads better as a list.

Address the reader directly in guides ("you"). Describe behavior neutrally in specifications.

Avoid filler, hype, and emoji. Say what a thing does, not how exciting it is.

Avoid AI sounding sections. Write everything in your words.

## Specifications

Use the RFC 2119 keywords MUST, SHOULD, and MAY deliberately, and only when you mean them. Reserve them for normative
requirements, not for emphasis.

Put each requirement in a sentence of its own, with one keyword and one subject. A reader or a conformance test should
be able to point at the one sentence that a bundle breaks. Explain the reason in the sentences around it, not inside it.

Define a term before you rely on it. When a field or value has a fixed vocabulary, list every allowed value.

Use a term from the [glossary](src/content/docs/specifications/glossary.md) only in the sense the glossary gives it, and
do not swap in a synonym for variety. Do not call a producer a "writer" because it writes a bundle: a writer is a
consumer that puts saves back onto real media. If you need a new meaning, add a glossary entry instead of stretching an
old one.

Note the version a feature belongs to when it matters for compatibility.

## Guides

Write a procedure as numbered steps. Start each step with a verb, give it one action, and keep it to 20 words or fewer.
Put what the reader should see afterward, or why the step matters, in a separate sentence after the step.

## Markdown conventions

- Do not write a top-level `#` heading in the body. Starlight sets the page title from frontmatter, so body headings
  start at `##`.
- Put a language tag on every fenced code block, such as `sh`, `rust`, or `json`.
- Use reference-free inline links, and prefer root-relative links between pages (`/specifications/...`).
- Keep tables readable in source; align columns when it is cheap, but do not fight the formatter over it.

## Markdown and MDX

Write pages as plain Markdown (`.md`) by default. Use MDX (`.mdx`) only when a page needs components such as cards,
tabs, or steps.

Keep specifications in plain `.md` so they stay easy to read in the repo and to edit without the toolchain. When you do
reach for `.mdx`, import Starlight's components rather than hand-writing HTML.

## Frontmatter

Both `.md` and `.mdx` pages must start with a YAML frontmatter block, fenced by `---`.

Every content page needs a `title`. Add a `description` for anything a reader might land on from search.

Use `sidebar.order` to pin a section's landing page to the top; otherwise pages sort alphabetically.

## File naming

Name files in `kebab-case`, matching the URL slug you want. A page at
`src/content/docs/specifications/universal-saves-format.md` is served at `/specifications/universal-saves-format/`.
