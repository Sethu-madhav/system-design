import { useId, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Confetti } from "@/components/ui/confetti"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { H2 } from "@/components/ui/typography"
import { grade, shuffledOrder, type Answer, type Question, type Quiz, type QuizResult } from "@/content"
import { useSceneCue } from "@/scene"

type QuizState =
  | { readonly phase: "answering"; readonly index: number; readonly answers: readonly (Answer | null)[] }
  | { readonly phase: "result"; readonly answers: readonly (Answer | null)[]; readonly result: QuizResult }

function firstState(slug: string, quiz: Quiz): QuizState {
  return {
    phase: "answering",
    index: 0,
    answers: quiz.map((question, index) =>
      question.kind === "order" ? shuffledOrder(question.items.length, `${slug}:${index}`) : null,
    ),
  }
}

function ShowMe({ step }: { step: string }) {
  const { play } = useSceneCue(step)
  return <Button variant="outline" onClick={play}>Show me in the diagram</Button>
}

function QuestionInput({
  question,
  answer,
  onAnswer,
  onMove,
}: {
  question: Question
  answer: Answer | null
  onAnswer: (answer: Answer | null) => void
  onMove: (from: number, to: number) => void
}) {
  const id = `quiz-${useId()}`

  return (
    <fieldset data-testid="quiz-question" data-kind={question.kind} className="space-y-4">
      <legend className="font-hand text-xl font-bold">{question.prompt}</legend>
      {question.kind === "choice" ? (
        <RadioGroup
          value={typeof answer === "number" ? String(answer) : ""}
          onValueChange={(value) => onAnswer(Number(value))}
        >
          {question.options.map((option, index) => (
            <div key={option.text} className="flex items-center gap-3">
              <RadioGroupItem value={String(index)} id={`${id}-${index}`} />
              <label htmlFor={`${id}-${index}`} className="font-hand text-base">{option.text}</label>
            </div>
          ))}
        </RadioGroup>
      ) : null}
      {question.kind === "multi" ? (
        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const selected = answer !== null && typeof answer !== "number" ? answer : []
            return (
              <div key={option.text} className="flex items-center gap-3">
                <Checkbox
                  id={`${id}-${index}`}
                  checked={selected.includes(index)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...selected, index].sort((a, b) => a - b)
                      : selected.filter((item) => item !== index)
                    onAnswer(next.length ? next : null)
                  }}
                />
                <label htmlFor={`${id}-${index}`} className="font-hand text-base">{option.text}</label>
              </div>
            )
          })}
        </div>
      ) : null}
      {question.kind === "order" ? (
        <ol data-testid="quiz-order" className="grid gap-2">
          {(Array.isArray(answer) ? answer : []).map((itemIndex, position, items) => {
            const text = question.items[itemIndex]
            return (
              <li key={itemIndex} data-item={itemIndex} className="flex items-center gap-3 font-hand text-base">
                <span className="flex-1">{text}</span>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Move "${text}" up`}
                  disabled={position === 0}
                  onClick={() => onMove(position, position - 1)}
                >↑</Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Move "${text}" down`}
                  disabled={position === items.length - 1}
                  onClick={() => onMove(position, position + 1)}
                >↓</Button>
              </li>
            )
          })}
        </ol>
      ) : null}
    </fieldset>
  )
}

function ResultCard({ quiz, result }: { quiz: Quiz; result: QuizResult }) {
  return (
    <Card data-testid="quiz-result" className="relative gap-5 p-6">
      <p data-testid="quiz-score" className="font-script text-3xl font-bold">{result.correct}/{result.total}</p>
      <p data-testid="quiz-verdict" data-passed={String(result.passed)} className="font-hand text-lg font-bold">
        {result.passed ? "Passed" : `Not passed yet. You need ${result.needed} of ${result.total}.`}
      </p>
      <ol className="grid gap-5">
        {quiz.map((question, index) => {
          const questionResult = result.perQuestion[index]
          const picked = questionResult?.picked
          const pickedIndices = typeof picked === "number" ? [picked] : Array.isArray(picked) ? picked : []
          const correct = questionResult?.correct ?? false

          return (
            <li
              key={question.prompt}
              data-testid="quiz-answer"
              data-index={index}
              data-correct={String(correct)}
              className="space-y-2 font-hand"
            >
              <p className="font-bold">{question.prompt}</p>
              <p>{correct ? "Right" : "Wrong"}</p>
              {(question.kind === "choice" || question.kind === "multi")
                ? question.options.map((option, optionIndex) =>
                    pickedIndices.includes(optionIndex) && option.correct !== true && option.why
                      ? <p key={option.text}>{option.why}</p>
                      : null,
                  )
                : null}
              {question.kind === "order" && !correct ? (
                <div>
                  <p>The right order:</p>
                  <ol className="list-decimal ps-6">
                    {question.items.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>
              ) : null}
              <p>{question.explain}</p>
              {question.replay ? <ShowMe step={question.replay} /> : null}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export function QuizView({ slug, quiz }: { slug: string; quiz: Quiz }) {
  const [state, setState] = useState<QuizState>(() => firstState(slug, quiz))

  const updateAnswer = (index: number, answer: Answer | null) => {
    setState((current) => current.phase === "answering"
      ? { ...current, answers: current.answers.map((item, itemIndex) => itemIndex === index ? answer : item) }
      : current,
    )
  }

  const moveOrderItem = (index: number, from: number, to: number) => {
    setState((current) => {
      if (current.phase !== "answering") return current
      const answer = current.answers[index]
      if (!Array.isArray(answer)) return current
      const items = [...answer]
      const moving = items[from]
      const neighbor = items[to]
      if (moving === undefined || neighbor === undefined) return current
      items[from] = neighbor
      items[to] = moving
      return { ...current, answers: current.answers.map((item, itemIndex) => itemIndex === index ? items : item) }
    })
  }

  const question = state.phase === "answering" ? quiz[state.index] : null
  const answer = state.phase === "answering" ? state.answers[state.index] ?? null : null
  const hasAnswer = question?.kind === "order" || typeof answer === "number" || (Array.isArray(answer) && answer.length > 0)
  const lastQuestion = state.phase === "answering" && state.index === quiz.length - 1

  return (
    <section id="quiz" data-testid="quiz" data-phase={state.phase} className="relative space-y-5">
      <H2>Quiz</H2>
      {state.phase === "answering" && question ? (
        <div className="space-y-5">
          <p data-testid="quiz-count" className="font-hand">Question {state.index + 1} of {quiz.length}</p>
          <Progress value={state.index + 1} max={quiz.length} aria-label="Quiz progress" />
          <QuestionInput
            key={state.index}
            question={question}
            answer={answer}
            onAnswer={(next) => updateAnswer(state.index, next)}
            onMove={(from, to) => moveOrderItem(state.index, from, to)}
          />
          <Button
            disabled={!hasAnswer}
            onClick={() => {
              if (lastQuestion) {
                setState({ phase: "result", answers: state.answers, result: grade(quiz, state.answers) })
              } else {
                setState({ ...state, index: state.index + 1 })
              }
            }}
          >{lastQuestion ? "Submit" : "Next"}</Button>
        </div>
      ) : null}
      {state.phase === "result" ? (
        <div className="space-y-5">
          <ResultCard quiz={quiz} result={state.result} />
          <Button onClick={() => setState(firstState(slug, quiz))}>Retake</Button>
          <Confetti active={state.result.passed} />
        </div>
      ) : null}
    </section>
  )
}
