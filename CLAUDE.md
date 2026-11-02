# Claude Code instructions

@Instructions.md

## Looseleaf UI

- Docs and component catalog: https://kevintngo.github.io/looseleaf
- Registry (from `components.json`): `https://kevintngo.github.io/looseleaf/r/{name}.json`
- Check the docs for a component's name and usage before adding it with `pnpm dlx shadcn@latest add @looseleaf/<name> -y`.

## pstack

pstack is vendored and committed at `vendor/pstack/`. To update it, run `scripts/sync-pstack.sh` and commit the result as its own commit. Do not delete or regenerate `vendor/pstack/` as part of other work.

- Skills: `.claude/skills` is a symlink to `vendor/pstack/skills`. Skills marked `disable-model-invocation: true` (e.g. `/architect`, `/poteto-mode`) load only when invoked by name as a slash command.
- Subagents: `.claude/agents/poteto-agent.md` and `.claude/agents/comment-sicko.md` are Claude Code ports of the pstack agents.

Translating pstack's Cursor-oriented instructions to Claude Code:

- Model per role: leave `model` unset on every subagent so it inherits the session model.
- `generalPurpose` subagent type → `general-purpose`. `readonly: true` → `Explore`.
- `Task` spawns → the `Agent` tool.
- `poteto-mode` lives at `vendor/pstack/skills/poteto-mode/SKILL.md`; bundled skills are siblings at `vendor/pstack/skills/<name>/SKILL.md`. Ignore any instruction to search `~/.cursor/plugins/`.
- Cursor-only features (bugbot, automations/Benny, `.mdc` rules, `control-cli`/`control-ui`) are unavailable. Skip those steps and say so in one line.
