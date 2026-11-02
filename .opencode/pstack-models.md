# pstack model mapping (OpenCode)

pstack's `/setup-pstack` skill writes a Cursor rule (`~/.cursor/rules/pstack-models.mdc`) because Cursor
lets the agent pick a model per `Task` spawn. This file is the OpenCode equivalent: an always-applied
instruction that every pstack skill reads for its role → model mapping.

Replace upstream model names with the rule below. Where a pstack skill says "set `model` to the role's
default", use this mapping instead.

| role | model |
| --- | --- |
| budget | high |
| code (feature, refactor, bug fix, perf, hillclimb) | inherit-parent |
| judgment (architect, interrogate, arena panels) | inherit-parent |
| prose (unslop, technical-writing, teach) | inherit-parent |
| how explorer | inherit-parent |
| how explainer | inherit-parent |
| everything else | inherit-parent |

## Translation notes

- `inherit-parent` means: leave `model` unset on the subagent so it uses the session model.
- `generalPurpose` (Cursor's subagent type) → OpenCode subagent `general`.
- `subagent_type: "poteto-agent"` → OpenCode subagent `poteto-agent`.
- `subagent_type: "comment-sicko"` → OpenCode subagent `comment-sicko`.
- `readonly: true` (Cursor Task option) → subagent `explore`, or `general` with `edit` and `shell` denied.
- Slash commands such as `/poteto-mode` are not plugin commands here. Load the skill instead: mention
  `@poteto-mode` in the prompt, or ask the agent to load skill `poteto-mode`.
- Skills marked `disable-model-invocation: true` are hidden from the model's catalog; they only load when
  you name them with `@<skill-id>`.
- Cursor-only features (bugbot, automations/Benny, `/loop`, `.mdc` rules, `control-cli`/`control-ui`) are not
  available. Skip those steps and say so in one line.
