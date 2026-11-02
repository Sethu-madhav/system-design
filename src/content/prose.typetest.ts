import { makeCue, md } from "./prose"

const cue = makeCue<"pick">()

export const ok = () => md`Text with ${cue("pick", "a cue")}.`

// @ts-expect-error md accepts only cue tokens
export const bad1 = () => md`Text with ${"a plain string"}.`

// @ts-expect-error cue accepts only the lesson's step ids
export const bad2 = () => md`Text with ${cue("pik", "a typo")}.`
