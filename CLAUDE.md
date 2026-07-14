## Working with PROJECT.md

1. Targeted reads by default. For small fixes, tweaks, or bug investigations,
   don't read the full PROJECT.md — grep for the relevant feature/section,
   or check "Current phase" and "Open decisions" only. If a targeted read
   doesn't surface enough context to be confident, do a full read rather
   than guessing — don't proceed on a hunch. Full read required when
   starting a genuinely new feature, or when explicitly asked to check
   project history.

2. Keep PROJECT.md lean. Once a phase entry is ~3-4 phases old and fully
   resolved (no open follow-ups referencing it), move its detailed
   narrative into CHANGELOG.md, leaving a one-line pointer in PROJECT.md if
   needed. PROJECT.md stays focused on: current phase, active open
   decisions, recent history. Propose this pruning after wrapping up a
   phase, don't wait for the file to get unwieldy. When grepping for
   context on an older feature, also check CHANGELOG.md — it may have been
   moved there.

3. Match verification effort to the change. A pure logic fix with no
   visual/design surface needs a typecheck + targeted functional check, not
   a full screenshot pass (light/dark/zoomed crops). Visual/UI changes still
   get the full pass. If unsure whether a change has visual surface, default
   to verifying — this rule is for obviously backend-only changes, not an
   excuse to skip verification generally.
