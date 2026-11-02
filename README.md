# system-design
## Setup

```bash
pnpm install
./scripts/sync-pstack.sh   # vendor pstack agent skills into vendor/pstack (gitignored)
pnpm dev
```

`opencode.jsonc` registers `vendor/pstack/skills` as an extra skill source. Load the pstack workflow with
`@poteto-mode <your task>`; individual skills load the same way (`@how ...`, `@tdd ...`, `@unslop`).
