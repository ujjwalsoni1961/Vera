"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { ReasoningSteps } from "./ReasoningSteps";
import { ActionCard } from "./ActionCard";
import { ReferenceProvider } from "./ReferenceChip";
import { reason, type Decision, type ReasoningStep } from "@/lib/engine";

const EXAMPLE_TASKS = [
  "Port of Rotterdam is on strike until Thursday — handle today's affected shipments.",
  "Which deliveries violate thermal constraints today?",
  "Is Cargo Voyage-402 feasible on its current route?",
  "Show all affected customers if Route Alpha becomes unavailable.",
];

type Phase = "idle" | "working" | "done" | "error";

interface ThreadItem {
  role: "user" | "agent";
  text: string;
  decision?: Decision;
}

const STREAM_INTERVAL_MS = 950;

export function AgentWorkspace() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [visibleSteps, setVisibleSteps] = useState<ReasoningStep[]>([]);
  const [activeTask, setActiveTask] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, phase]);

  useEffect(
    () => () => timersRef.current.forEach(clearTimeout),
    []
  );

  const submit = useCallback(
    async (raw?: string) => {
      const task = (raw ?? input).trim();
      if (!task || phase === "working") return;

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setInput("");
      setActiveTask(task);
      setVisibleSteps([]);
      setPhase("working");
      setThread((t) => [
        ...t,
        { role: "user", text: task },
        {
          role: "agent",
          text: "On it. Pulling the affected entities and applicable rules.",
        },
      ]);

      try {
        const decision = await reason(task);
        decision.steps.forEach((step, i) => {
          const timer = setTimeout(() => {
            setVisibleSteps((s) => [...s, step]);
            if (i === decision.steps.length - 1) {
              const doneTimer = setTimeout(() => {
                setThread((t) => [
                  ...t,
                  { role: "agent", text: "", decision },
                ]);
                setPhase("done");
              }, 500);
              timersRef.current.push(doneTimer);
            }
          }, i * STREAM_INTERVAL_MS);
          timersRef.current.push(timer);
        });
      } catch {
        setPhase("error");
        setThread((t) => [
          ...t,
          {
            role: "agent",
            text: "The engine did not respond. Check the engine connection in Settings and try again.",
          },
        ]);
      }
    },
    [input, phase]
  );

  const modify = useCallback(() => {
    setInput(activeTask);
  }, [activeTask]);

  return (
    <ReferenceProvider>
      <div className="flex h-full">
        {/* ── Left: task thread ── */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-line">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {thread.length === 0 ? (
              <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
                <h1 className="text-xl font-semibold tracking-tight text-ink">
                  What should the agent handle?
                </h1>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
                  Describe an operational task in plain language. Vera pulls
                  the relevant shipments, applies your rules, and shows every
                  step of its reasoning.
                </p>
                <div className="mt-6 flex flex-col items-start gap-2">
                  {EXAMPLE_TASKS.map((t) => (
                    <button
                      key={t}
                      onClick={() => submit(t)}
                      className="rounded-md border border-line bg-surface px-3 py-1.5 text-left text-[13px] text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-xl space-y-4">
                {thread.map((item, i) =>
                  item.decision ? (
                    <ActionCard
                      key={i}
                      task={activeTask}
                      decision={item.decision}
                      onModify={modify}
                    />
                  ) : item.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] rounded-card bg-accent-soft px-4 py-2.5 text-[13px] leading-relaxed text-ink">
                        {item.text}
                      </p>
                    </div>
                  ) : (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[13px] leading-relaxed text-ink-secondary"
                    >
                      {item.text}
                    </motion.p>
                  )
                )}
                <div ref={threadEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-line bg-surface px-6 py-4">
            <div className="mx-auto max-w-xl">
              <div className="relative">
                <Textarea
                  rows={2}
                  value={input}
                  placeholder="Describe an operational task in plain language…"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  className="pr-11"
                />
                <button
                  onClick={() => submit()}
                  disabled={!input.trim() || phase === "working"}
                  aria-label="Run task"
                  className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white transition-colors hover:bg-zinc-700 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: reasoning panel ── */}
        <section className="flex w-[44%] max-w-2xl shrink-0 flex-col max-lg:hidden">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-5">
            <span className="text-[13px] font-medium text-ink">Reasoning</span>
            {phase === "working" && (
              <span className="text-xxs text-ink-muted">Working</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-2">
            <AnimatePresence>
              {visibleSteps.length === 0 ? (
                <p className="py-4 text-[13px] leading-relaxed text-ink-muted">
                  Submit a task to see the agent&apos;s reasoning here, step by
                  step, with references to the exact rules and facts used.
                </p>
              ) : (
                <ReasoningSteps steps={visibleSteps} animated />
              )}
            </AnimatePresence>
          </div>
          <p className="shrink-0 border-t border-line px-5 py-3 text-xxs leading-relaxed text-ink-muted">
            Decisions are derived by a symbolic solver over your rules; the
            language model only reads and explains.
          </p>
        </section>
      </div>
    </ReferenceProvider>
  );
}
