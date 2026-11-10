import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Target,
  Compass,
  Clock,
  Check,
  CheckCircle2,
  Code2,
  Camera,
  Mic,
  Globe,
  BookOpen,
  Sparkles,
  Network,
  Lightbulb,
  FileText,
  FolderCheck,
  ChevronRight,
  Pause,
  Play,
  ExternalLink,
  Download,
  Shield,
  Settings,
  LogOut,
  Heart,
  Flag,
  Layers,
  Milestone,
  MessageSquare,
  Link as LinkIcon,
  Trash2,
  Info,
  RefreshCw,
  Lock,
  Eye,
  CheckCheck,
  Send,
  Search,
  Utensils,
  Briefcase,
} from "lucide-react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  NodeProps,
  Node,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import {
  useApp,
  api,
  json,
  parse,
  R,
  date,
  bytes,
  Button,
  Badge,
  Empty,
  Field,
  Modal,
  SectionHead,
  Steps,
  SaveButton,
  Loading,
} from "./lib";
import { demos } from "../../shared/demos";
import { starters } from "../../shared/starters";
import { defaultDetails } from "../../worker/contracts";
const icons: R = {
  code: Code2,
  camera: Camera,
  mic: Mic,
  globe: Globe,
  finance: Briefcase,
  cooking: Utensils,
};
export const starterIcon = (s: R) => icons[s.icon] || Compass;
export function GoalSelect() {
  const { data, goalId, setGoal } = useApp();
  return data?.goals.length ? (
    <select
      aria-label="Current learning goal"
      className="goal-select"
      value={goalId}
      onChange={(e) => setGoal(e.target.value)}
    >
      {data.goals.map((g: R) => (
        <option key={g.id} value={g.id}>
          {g.title}
          {g.status === "paused" ? " (paused)" : ""}
        </option>
      ))}
    </select>
  ) : null;
}
function OrbitArt() {
  return (
    <div className="orbit-art" aria-hidden="true">
      <svg viewBox="0 0 400 270">
        <defs>
          <radialGradient id="wash">
            <stop stopColor="#beddd1" stopOpacity=".8" />
            <stop offset="1" stopColor="#e7efe8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="138" r="125" fill="url(#wash)" />
        <g stroke="#abc5b7" fill="none" strokeWidth=".8">
          <ellipse
            cx="215"
            cy="133"
            rx="145"
            ry="66"
            transform="rotate(-35 215 133)"
          />
          <ellipse
            cx="215"
            cy="133"
            rx="120"
            ry="85"
            transform="rotate(30 215 133)"
          />
          <ellipse
            cx="215"
            cy="133"
            rx="78"
            ry="124"
            transform="rotate(22 215 133)"
          />
          <path
            d="M87 180L194 90 304 72 325 182 215 206 87 180 182 130 325 182M194 90l21 116M304 72L182 130"
            strokeDasharray="3 5"
          />
        </g>
        <g fill="#f9fcf8" stroke="#adc7b7">
          <circle cx="194" cy="90" r="18" />
          <circle cx="304" cy="72" r="11" />
          <circle cx="87" cy="180" r="10" />
          <circle cx="325" cy="182" r="13" />
          <circle cx="215" cy="206" r="8" />
        </g>
        <circle cx="182" cy="130" r="34" fill="#184d40" />
        <path
          d="m173 130 7 7 12-15"
          fill="none"
          stroke="#aff0ca"
          strokeWidth="2"
        />
        <path
          d="m189 90 4 4 7-9"
          fill="none"
          stroke="#397259"
          strokeWidth="1.5"
        />
        <g fill="#2b7057">
          <circle cx="92" cy="94" r="3" />
          <circle cx="274" cy="225" r="3" />
          <circle cx="337" cy="118" r="2" />
        </g>
        <g
          fill="#4b6b57"
          fontFamily="sans-serif"
          fontSize="9"
          letterSpacing="1"
        >
          <text x="217" y="36">
            CURIOSITY
          </text>
          <text x="25" y="226">
            PRACTICE
          </text>
          <text x="297" y="243">
            CAPABILITY
          </text>
        </g>
      </svg>
      <div className="art-label">
        <span>
          <Sparkles size={12} />
        </span>{" "}
        A path that grows with you
      </div>
    </div>
  );
}
export function HomePage() {
  const { data, bundle, newGoal, nav, setGoal, setTaskId } = useApp();
  const active = data!.goals.filter(
      (g: R) => g.status === "active" && !parse(g.details).is_demo,
    ),
    goal = bundle?.goal,
    next = bundle?.tasks.find((t: R) => t.status !== "complete"),
    first = (data!.user.name || "there").split(" ")[0];
  return (
    <>
      <SectionHead
        eyebrow="A LITTLE CURIOSITY GOES A LONG WAY"
        title={`Make room for what’s next, ${first}.`}
        description="Your interests are the beginning. What you build is the proof."
      >
        <span className="date-pill">
          {new Intl.DateTimeFormat("en", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(new Date())}
        </span>
      </SectionHead>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">
            <i /> BUILT AROUND YOU
          </span>
          <h2>
            What if “I wish I could”
            <br />
            became <em>“I can”?</em>
          </h2>
          <p>
            Learn the skills you care about through real projects,
            <br className="desktop-br" /> a little guidance, and one meaningful
            step at a time.
          </p>
          <Button onClick={() => newGoal()}>
            Explore a new goal <ArrowUpRight size={17} />
          </Button>
          <small>No perfect plan required. Just a starting point.</small>
        </div>
        <OrbitArt />
      </section>
      <div className="stats-row">
        <div>
          <span className="stat-icon">
            <Target size={20} />
          </span>
          <div>
            <strong>
              {active.length.toString().padStart(2, "0")}
              <small>Active goals</small>
            </strong>
            <p>A direction for your curiosity</p>
          </div>
        </div>
        <div>
          <span className="stat-icon">
            <Layers size={20} />
          </span>
          <div>
            <strong>
              {String(data!.stats.submissions || 0).padStart(2, "0")}
              <small>Real attempts</small>
            </strong>
            <p>Every attempt gives you something to build on</p>
          </div>
        </div>
        <div>
          <span className="stat-icon">
            <FolderCheck size={20} />
          </span>
          <div>
            <strong>
              {String(data!.stats.verified_skills || 0).padStart(2, "0")}
              <small>Skills independently verified</small>
            </strong>
            <p>Capability supported by evidence</p>
          </div>
        </div>
      </div>
      <div className="dashboard-columns">
        <section>
          <div className="block-heading">
            <h2>
              Your learning, in motion <span>{active.length}</span>
            </h2>
            <button className="text-btn" onClick={() => nav("goals")}>
              View all goals <ArrowRight size={15} />
            </button>
          </div>
          {!active.length ? (
            <div className="first-goal-card">
              <span className="round-icon">
                <Target size={24} />
              </span>
              <div>
                <span className="eyebrow">THE FIRST STEP IS YOURS</span>
                <h3>
                  Something you’ve always
                  <br />
                  wanted to be able to do?
                </h3>
                <p>Give it a name. We’ll make space for it.</p>
                <Button variant="secondary" onClick={() => newGoal()}>
                  Start my first goal <Plus size={16} />
                </Button>
              </div>
              <div className="first-goal-lines" />
            </div>
          ) : (
            <div className="goal-grid">
              {active.slice(0, 2).map((g: R, i: number) => (
                <button
                  className="goal-card"
                  key={g.id}
                  onClick={() => {
                    setGoal(g.id);
                    nav("goals");
                  }}
                >
                  <div className="card-top">
                    <span className={"goal-symbol tone-" + i}>
                      <Target size={21} />
                    </span>
                    <Badge tone="teal">
                      {g.stage === "discover"
                        ? "Finding direction"
                        : "In progress"}
                    </Badge>
                    <ArrowUpRight size={17} />
                  </div>
                  <h3>{g.title}</h3>
                  <p>{g.description}</p>
                  <div className="goal-card-bottom">
                    <span>
                      <i />
                      {g.confirmed
                        ? "Goal confirmed"
                        : "Ready for a little clarity"}
                    </span>
                    <small>Updated {date(g.updated_at)}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="block-heading spacing">
            <h2>A spark for your next chapter</h2>
            <button className="text-btn" onClick={() => nav("challenges")}>
              Try a demo <ArrowRight size={15} />
            </button>
          </div>
          <div className="starter-list">
            {starters.slice(0, 3).map((s, i) => {
              const Icon = starterIcon(s);
              return (
                <button
                  key={s.id}
                  onClick={() => newGoal(s)}
                  className="starter-row"
                >
                  <span className={"starter-icon color-" + i}>
                    <Icon size={21} />
                  </span>
                  <span>
                    <small>{s.category}</small>
                    <strong>{s.title}</strong>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              );
            })}
          </div>
        </section>
        <aside className="dashboard-rail">
          <div className="next-card">
            <div className="rail-heading">
              <span className="mini-spark">
                <Sparkles size={17} />
              </span>
              <span>YOUR NEXT SMALL STEP</span>
            </div>
            <h3>
              {next
                ? next.title
                : goal
                  ? "Give your goal a little shape."
                  : "Start with what matters to you."}
            </h3>
            <p>
              {next
                ? parse(next.spec).starting_point
                : goal
                  ? "What would you love to make, understand, or do? A clear outcome makes the next step easier."
                  : "You can learn a practical skill, explore a new field, or build something you’ve been imagining."}
            </p>
            <Button
              onClick={() => {
                if (next) {
                  setTaskId(next.id);
                  nav("workspace");
                } else if (goal) nav("goals");
                else newGoal();
              }}
            >
              {next
                ? "Open workspace"
                : goal
                  ? "Shape my goal"
                  : "Find my starting point"}
              <ArrowRight size={16} />
            </Button>
            <div className="next-note">
              <Heart size={14} />
              <span>Learning is a practice, not a race.</span>
            </div>
          </div>
          <div className="progress-note">
            <span className="eyebrow">A DIFFERENT KIND OF PROGRESS</span>
            <h3>
              More capable.
              <br />
              Not just more completed.
            </h3>
            <p>
              A thoughtful question. A better explanation. An idea you can now
              bring to life. That’s the progress we look for.
            </p>
            <div className="signature-mark">
              kleos <span>↗</span>
            </div>
          </div>
        </aside>
      </div>
      <section className="activity-section">
        <div className="block-heading">
          <h2>Little steps, real momentum</h2>
          <span className="muted-text">Your recent learning moments</span>
        </div>
        <Activity events={data!.activity.slice(0, 4)} />
      </section>
    </>
  );
}
const eventText: R = {
  goal_created: [
    "You found a direction",
    "A new learning goal is a meaningful beginning.",
  ],
  goal_confirmed: [
    "You made your goal clearer",
    "Knowing what you want to build helps you choose your next step.",
  ],
  map_created: [
    "You gave your curiosity a path",
    "A starting point and a next step, with room to grow.",
  ],
  task_assigned: [
    "A real project is ready",
    "Something useful to make, explore or explain.",
  ],
  draft_saved: [
    "You kept an idea moving",
    "Your draft is saved. Come back whenever you’re ready.",
  ],
  work_submitted: [
    "You turned an idea into something real",
    "Your work and your reasoning are part of your learning story.",
  ],
  assessment_completed: [
    "You have something new to build on",
    "Specific feedback helps you make a purposeful next attempt.",
  ],
  independent_verification_passed: [
    "You demonstrated independent capability",
    "A new challenge provided evidence you can carry forward.",
  ],
  hint_used: [
    "You opened another way forward",
    "Asking for guidance is a useful learning choice.",
  ],
  portfolio_added: [
    "You kept a piece of your progress",
    "Your project now has a place in your portfolio.",
  ],
  external_feedback_added: [
    "You brought the real world into your learning",
    "Feedback from practice can help shape the next task.",
  ],
  goal_paused: [
    "You made space",
    "Your work is saved for when you want to return.",
  ],
  goal_resumed: ["You found your way back", "Pick up from where you left off."],
};
export function Activity({ events }: { events: R[] }) {
  if (!events.length)
    return (
      <div className="activity-empty">
        <span className="activity-dot" />
        <p>
          Your story starts with your first goal. There’s no catching up to do.
        </p>
        <span>Ready when you are</span>
      </div>
    );
  return (
    <div className="activity-list">
      {events.map((e) => {
        const t = eventText[e.kind] || [
          "Your learning moved forward",
          "Your change has been saved.",
        ];
        return (
          <div className="activity-row" key={e.id}>
            <span className="activity-dot">
              <Check size={12} />
            </span>
            <div>
              <strong>{t[0]}</strong>
              <p>{t[1]}</p>
            </div>
            <small>{date(e.created_at)}</small>
          </div>
        );
      })}
    </div>
  );
}
export function GoalsPage() {
  const {
    data,
    bundle,
    goalId,
    setGoal,
    newGoal,
    action,
    ai,
    aiBusy,
    busy,
    nav,
  } = useApp();
  const [edit, setEdit] = useState(false);
  return (
    <>
      <SectionHead
        eyebrow="FOLLOW YOUR CURIOSITY"
        title="Your goals. Your direction."
        description="A goal can be ambitious or a little uncertain. It just has to mean something to you."
      >
        <Button onClick={() => newGoal()}>
          <Plus size={17} />
          New goal
        </Button>
      </SectionHead>
      {!data!.goals.length ? (
        <Empty
          icon={Target}
          title="What would you love to become capable of?"
          action={
            <Button onClick={() => newGoal()}>
              Give it a starting point <ArrowRight size={16} />
            </Button>
          }
        >
          You don’t need to choose a course. Start with an interest, a question,
          or a project.
        </Empty>
      ) : (
        <>
          <div className="goal-tabs" role="tablist" aria-label="Learning goals">
            {data!.goals.map((g: R) => (
              <button
                key={g.id}
                role="tab"
                aria-selected={g.id === goalId}
                onClick={() => setGoal(g.id)}
              >
                {g.title}
                <Badge>{g.status}</Badge>
              </button>
            ))}
          </div>
          {!bundle ? (
            <Loading />
          ) : (
            <>
              <div className="paper goal-detail">
                <div className="card-top">
                  <Badge tone="teal">
                    {bundle.goal.confirmed
                      ? "Your confirmed direction"
                      : "Let’s find a little clarity"}
                  </Badge>
                  <div className="inline-actions">
                    <button className="text-btn" onClick={() => setEdit(true)}>
                      Edit goal <ArrowUpRight size={14} />
                    </button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        action(
                          () =>
                            api(
                              "/goals/" + goalId,
                              json("PATCH", {
                                version: bundle.goal.version,
                                status:
                                  bundle.goal.status === "active"
                                    ? "paused"
                                    : "active",
                              }),
                            ),
                          bundle.goal.status === "active"
                            ? "Your journey is saved. There’s room to pause."
                            : "Welcome back. Pick up where you left off.",
                        )
                      }
                    >
                      {bundle.goal.status === "active" ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} />
                      )}{" "}
                      {bundle.goal.status === "active" ? "Pause" : "Resume"}
                    </Button>
                  </div>
                </div>
                <h2>{bundle.goal.title}</h2>
                <p className="goal-description">{bundle.goal.description}</p>
                <Steps stage={bundle.goal.stage} />
                {bundle.goal.confirmed ? (
                  <>
                    <div className="goal-facts">
                      <div>
                        <span>WHAT YOU’RE WORKING TOWARD</span>
                        <p>{bundle.goal.details.outcome}</p>
                      </div>
                      <div>
                        <span>YOUR RHYTHM</span>
                        <p>
                          {bundle.goal.details.weekly_hours} hours a week ·{" "}
                          {bundle.goal.details.preference === "both"
                            ? "Theory & practice"
                            : bundle.goal.details.preference === "theory"
                              ? "Understanding deeply"
                              : "Learning by doing"}
                        </p>
                      </div>
                      <div>
                        <span>WHAT SUCCESS LOOKS LIKE</span>
                        <ul>
                          {(bundle.goal.details.success_criteria || []).map(
                            (s: string) => (
                              <li key={s}>
                                <Check size={14} />
                                {s}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <span>YOUR STARTING POINT</span>
                        <p>
                          {bundle.goal.details.background ||
                            "Still to explore together."}
                        </p>
                        <Badge>Self-reported · not yet assessed</Badge>
                      </div>
                    </div>
                    <div className="goal-next">
                      <div>
                        <Sparkles size={20} />
                        <span>
                          <strong>
                            {bundle.paths.length
                              ? "Your next step has a place."
                              : "Let’s turn this goal into a path."}
                          </strong>
                          <small>
                            {bundle.paths.length
                              ? "Explore your skills or continue with your project."
                              : "A few connected skills make an ambitious goal more approachable."}
                          </small>
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          nav(bundle.paths.length ? "workspace" : "map")
                        }
                      >
                        {bundle.paths.length
                          ? "Open workspace"
                          : "Build my skill map"}
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <GoalForm goal={bundle.goal} onDone={() => {}} />
                )}
              </div>
              {bundle.goal.confirmed && (
                <div className="two-col">
                  <div className="paper">
                    <h3>What we know so far</h3>
                    <p>
                      Your learning twin keeps a record of what your work
                      actually demonstrates.
                    </p>
                    <div className="mini-stats">
                      <span>
                        <strong>
                          {
                            bundle.evidence.filter(
                              (e: R) => e.independent && e.valid,
                            ).length
                          }
                        </strong>
                        Independent evidence
                      </span>
                      <span>
                        <strong>
                          {
                            bundle.evidence.filter(
                              (e: R) => !e.independent && e.valid,
                            ).length
                          }
                        </strong>
                        Observed in practice
                      </span>
                    </div>
                    <button className="text-btn" onClick={() => nav("map")}>
                      Explore your evidence <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="paper">
                    <h3>Your recent learning moments</h3>
                    <Activity events={bundle.events.slice(0, 3)} />
                  </div>
                </div>
              )}
            </>
          )}
          {edit && bundle && (
            <Modal
              title="Let your goal evolve"
              subtitle="Your previous tasks and valid evidence stay with you. Review the path after a change."
              onClose={() => setEdit(false)}
              wide
            >
              <GoalForm goal={bundle.goal} onDone={() => setEdit(false)} />
            </Modal>
          )}
        </>
      )}
    </>
  );
}
function GoalForm({ goal, onDone }: { goal: R; onDone: () => void }) {
  const { action, ai, aiBusy, busy, data } = useApp();
  const [d, setD] = useState({ ...defaultDetails, ...goal.details }),
    [title, setTitle] = useState(goal.title),
    [description, setDescription] = useState(goal.description),
    [message, setMessage] = useState("");
  const set = (k: string, v: any) => setD((old: R) => ({ ...old, [k]: v }));
  return (
    <form
      className="goal-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await action(
          () =>
            api(
              "/goals/" + goal.id,
              json("PATCH", {
                version: goal.version,
                title,
                description,
                details: {
                  outcome: d.outcome,
                  background: d.background,
                  background_source: d.background_source,
                  weekly_hours: Number(d.weekly_hours),
                  deadline: d.deadline,
                  constraints: d.constraints,
                  success_criteria: d.success_criteria,
                  preference: d.preference,
                },
                confirmed: true,
              }),
            ),
          "A clearer goal. A more meaningful next step.",
        );
        if (r) onDone();
      }}
    >
      <div className="form-intro">
        <Lightbulb size={21} />
        <p>
          Let’s make this useful to you. Start with the result you’d love to
          achieve. You can change your mind as you learn.
        </p>
      </div>
      <div className="two-col">
        <Field label="Your goal">
          <input
            required
            minLength={3}
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Something you want to make, do, or understand">
          <input
            required
            maxLength={2000}
            placeholder="e.g. Build and explain my first Python app"
            value={d.outcome}
            onChange={(e) => set("outcome", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Why it matters to you">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="two-col">
        <Field
          label="Where are you starting?"
          hint="Your own view of your experience. We’ll keep this separate from demonstrated ability."
        >
          <textarea
            rows={3}
            placeholder="No experience is a perfectly good starting point."
            value={d.background}
            onChange={(e) => set("background", e.target.value)}
          />
        </Field>
        <Field
          label="How will you know you’re making progress?"
          hint="One observable outcome per line."
        >
          <textarea
            required
            rows={3}
            placeholder="Create a small working project&#10;Explain the choices I made"
            value={d.success_criteria.join("\n")}
            onChange={(e) =>
              set(
                "success_criteria",
                e.target.value.split("\n").filter(Boolean),
              )
            }
          />
        </Field>
      </div>
      <details className="form-details">
        <summary>
          Your time, resources & learning style <ChevronRight size={15} />
        </summary>
        <div className="three-col">
          <Field label="Hours each week">
            <input
              type="number"
              min="0"
              max="168"
              step="0.5"
              value={d.weekly_hours}
              onChange={(e) => set("weekly_hours", Number(e.target.value))}
            />
          </Field>
          <Field label="What matters most?">
            <select
              value={d.preference}
              onChange={(e) => set("preference", e.target.value)}
            >
              <option value="practice">Practical ability</option>
              <option value="theory">Deep understanding</option>
              <option value="both">Both together</option>
            </select>
          </Field>
          <Field label="A deadline, if you have one">
            <input
              type="date"
              value={d.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Any constraints or resources?">
          <input
            placeholder="Equipment, budget, accessibility, available support…"
            value={d.constraints}
            onChange={(e) => set("constraints", e.target.value)}
          />
        </Field>
      </details>
      <div className="form-bottom">
        <p>
          <Heart size={15} />
          This is a starting point, not a commitment to perfection.
        </p>
        <Button disabled={busy} type="submit">
          {goal.confirmed ? "Save my direction" : "This is my goal"}
          <Check size={17} />
        </Button>
      </div>
      {!goal.confirmed && (
        <div className="discovery-assist">
          <span>
            <Sparkles size={17} />
            Want a little help finding direction?
          </span>
          <div>
            <input
              aria-label="Ask the discovery agent"
              placeholder="Tell the Agent what still feels unclear…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={aiBusy || !message.trim()}
              onClick={() =>
                ai("discover", { message }).then((r) => {
                  if (r?.details) setD(r.details);
                })
              }
            >
              Explore together <Send size={15} />
            </Button>
          </div>
          <small>
            {data!.services.ai
              ? "The Agent asks only what will help shape your path."
              : "AI is not connected yet. You can confirm your goal yourself and start learning."}
          </small>
        </div>
      )}
    </form>
  );
}
type SkillFlowNode = Node<{ skill: R; onSelect: (s: R) => void }>;
function SkillNode({ data }: NodeProps<SkillFlowNode>) {
  const s = data.skill;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <button
        className={"skill-node " + s.status}
        onClick={() => data.onSelect(s)}
      >
        <span className="skill-node-status">
          {s.status === "verified" ? (
            <CheckCircle2 size={15} />
          ) : s.status === "practicing" ? (
            <Play size={14} />
          ) : (
            <span className="node-circle" />
          )}
          {s.status === "verified"
            ? "Independent evidence"
            : s.status === "practicing"
              ? "Developing through practice"
              : "Ready to explore"}
        </span>
        <strong>{s.name}</strong>
        <small>
          {parse(s.standards, []).length} observable standards{" "}
          <ArrowUpRight size={13} />
        </small>
      </button>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
const nodeTypes = { skill: SkillNode };
export function MapPage() {
  const { data, bundle, goalId, newGoal, ai, aiBusy, action, nav } = useApp();
  const [inspect, setInspect] = useState<R | null>(null),
    [edit, setEdit] = useState(false);
  const path = bundle?.paths[0],
    skills = (bundle?.skills || []).filter((s: R) => s.path_id === path?.id);
  const graph = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 35, ranksep: 65 });
    g.setDefaultEdgeLabel(() => ({}));
    skills.forEach((s: R) => g.setNode(s.id, { width: 230, height: 125 }));
    const deps = (bundle?.dependencies || []).filter(
      (d: R) =>
        skills.some((s: R) => s.id === d.skill_id) &&
        skills.some((s: R) => s.id === d.prerequisite_id),
    );
    deps.forEach((d: R) => g.setEdge(d.prerequisite_id, d.skill_id));
    dagre.layout(g);
    return {
      nodes: skills.map((s: R) => ({
        id: s.id,
        type: "skill",
        data: { skill: s, onSelect: setInspect },
        position: { x: g.node(s.id).x - 115, y: g.node(s.id).y - 62 },
      })),
      edges: deps.map((d: R) => ({
        id: d.id,
        source: d.prerequisite_id,
        target: d.skill_id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8fa99c" },
        style: { stroke: "#adc1b5", strokeWidth: 1.6 },
      })),
    };
  }, [bundle]);
  return (
    <>
      <SectionHead
        eyebrow="YOUR PERSONAL LEARNING COMPILER"
        title="See the connections. Find your next step."
        description="A map of what your goal calls for, and the evidence you build along the way."
      >
        <GoalSelect />
        {bundle?.goal.confirmed && (
          <Button variant="secondary" onClick={() => setEdit(true)}>
            <Plus size={16} />
            {skills.length ? "Edit my path" : "Build my own path"}
          </Button>
        )}
      </SectionHead>
      {!goalId ? (
        <Empty
          icon={Network}
          title="Every good path starts with your goal."
          action={
            <Button onClick={() => newGoal()}>
              Choose a direction <ArrowRight size={16} />
            </Button>
          }
        >
          Your skill map will connect what you want to do with the abilities you
          need.
        </Empty>
      ) : !bundle ? (
        <Loading />
      ) : !bundle.goal.confirmed ? (
        <Empty
          icon={Target}
          title="Give your goal a little clarity first."
          action={<Button onClick={() => nav("goals")}>Review my goal</Button>}
        >
          A meaningful map starts with knowing what you want to achieve.
        </Empty>
      ) : !skills.length ? (
        <>
          <Empty
            icon={Network}
            title="There’s more than one way to get there."
            action={
              <div className="inline-actions">
                <Button disabled={aiBusy} onClick={() => ai("map")}>
                  <Sparkles size={16} />
                  Build with my Agent
                </Button>
                <Button variant="secondary" onClick={() => setEdit(true)}>
                  Make my own path
                </Button>
              </div>
            }
          >
            Connect the skills you want to develop. Start small; the path can
            evolve.
          </Empty>
          {bundle.goal.details.starter_id && (
            <StarterChoice starterId={bundle.goal.details.starter_id} />
          )}
        </>
      ) : (
        <>
          <div className="map-toolbar">
            <div>
              <Badge tone="teal">Path v{path.version}</Badge>
              <span>{skills.length} connected skills</span>
              <span>Click a skill to explore its evidence</span>
            </div>
            <Button
              variant="ghost"
              disabled={aiBusy}
              onClick={() =>
                ai("map", {
                  message:
                    "Review the current path and explain any changes. Preserve valid evidence.",
                })
              }
            >
              <RefreshCw size={15} />
              Review path
            </Button>
          </div>
          <div className="map-canvas">
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.3}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={22} size={1} color="#d2ddd5" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <div className="map-legend">
            <span>
              <i />
              Not yet demonstrated
            </span>
            <span>
              <i className="practicing" />
              Observed in practice
            </span>
            <span>
              <i className="verified" />
              Independent evidence
            </span>
            <p>Progress comes from evidence, never an invented percentage.</p>
          </div>
          <div className="two-col">
            <div className="paper">
              <span className="eyebrow">WHY THIS PATH</span>
              <h3>A few connected skills. A meaningful direction.</h3>
              <p>{path.rationale}</p>
              <Button variant="secondary" onClick={() => nav("workspace")}>
                Put it into practice <ArrowRight size={16} />
              </Button>
            </div>
            <div className="paper">
              <span className="eyebrow">YOUR LEARNING TWIN</span>
              <h3>Your work tells the story.</h3>
              <p>
                {bundle.evidence.filter((e: R) => e.valid).length
                  ? `${bundle.evidence.filter((e: R) => e.valid).length} evidence records connect your actual work to this goal. Open a skill to inspect or correct them.`
                  : "No capability has been verified yet. As you build, explain and independently apply your skills, your evidence will grow here."}
              </p>
              <p className="subtle-note">
                <Shield size={16} />
                Self-reported experience stays separate from demonstrated
                capability.
              </p>
            </div>
          </div>
        </>
      )}
      {edit && bundle && (
        <MapEditor skills={skills} onClose={() => setEdit(false)} />
      )}{" "}
      {inspect && bundle && (
        <Modal
          title={inspect.name}
          subtitle={inspect.definition}
          onClose={() => setInspect(null)}
        >
          <Badge tone={inspect.status === "verified" ? "teal" : "neutral"}>
            {inspect.status === "verified"
              ? "Independent evidence"
              : inspect.status === "practicing"
                ? "Observed in practice"
                : "Not yet independently verified"}
          </Badge>
          <h4>Why it matters to your goal</h4>
          <p>{inspect.relevance}</p>
          <h4>What this skill looks like in practice</h4>
          <ul className="check-list">
            {parse(inspect.standards, []).map((s: string) => (
              <li key={s}>
                <Check size={15} />
                {s}
              </li>
            ))}
          </ul>
          <h4>What the estimate is based on</h4>
          <p>{inspect.basis}</p>
          <p className="small-text">Confidence: {inspect.confidence}</p>
          <h4>The evidence</h4>
          {bundle.evidence.filter((e: R) => e.skill_key === inspect.key)
            .length ? (
            bundle.evidence
              .filter((e: R) => e.skill_key === inspect.key)
              .map((e: R) => <Evidence key={e.id} evidence={e} />)
          ) : (
            <p className="muted-text">
              No observed evidence yet. That’s a starting point, not a judgment.
            </p>
          )}
          <div className="gentle-note">
            <Lightbulb size={18} />
            <span>
              <strong>A next step</strong>
              <br />
              {inspect.next_practice}
            </span>
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              disabled={aiBusy}
              onClick={() => {
                ai("diagnose", {
                  message:
                    "Please reassess my starting point for " + inspect.name,
                });
                setInspect(null);
              }}
            >
              Reassess with a task
            </Button>
            <Button
              onClick={() => {
                setInspect(null);
                nav("workspace");
              }}
            >
              Keep building <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Evidence({ evidence: e }: { evidence: R }) {
  const { action } = useApp();
  const [correct, setCorrect] = useState(false),
    [reason, setReason] = useState("");
  return (
    <div className={"evidence-item " + (!e.valid ? "disputed" : "")}>
      <div>
        <Badge tone={e.independent ? "teal" : "neutral"}>
          {!e.valid
            ? "Correction recorded"
            : e.independent
              ? "Independently demonstrated"
              : "Practice observation"}
        </Badge>
        <small>
          {date(e.created_at)} · {e.confidence} confidence
        </small>
      </div>
      <p>{e.claim}</p>
      <blockquote>{e.quote}</blockquote>
      {e.correction && <p>Correction: {e.correction}</p>}
      {e.valid && !correct && (
        <button className="text-btn" onClick={() => setCorrect(true)}>
          This record needs a correction
        </button>
      )}
      {correct && (
        <div>
          <textarea
            aria-label="Evidence correction"
            placeholder="What should we understand differently?"
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
          />
          <Button
            variant="secondary"
            disabled={reason.length < 3}
            onClick={async () => {
              const r = await action(
                () =>
                  api(
                    "/evidence/" + e.id,
                    json("PATCH", { correction: reason }),
                  ),
                "Your perspective is part of the record. This claim is marked for reassessment.",
              );
              if (r) setCorrect(false);
            }}
          >
            Record correction
          </Button>
        </div>
      )}
    </div>
  );
}
function StarterChoice({ starterId }: { starterId: string }) {
  const { action, goalId, nav, setTaskId } = useApp(),
    s = starters.find((s) => s.id === starterId);
  if (!s) return null;
  return (
    <div className="starter-choice">
      <BookOpen size={25} />
      <div>
        <span className="eyebrow">YOUR SELECTED STARTER</span>
        <h3>{s.title}</h3>
        <p>
          A curated starting path and a real first project. You can make it your
          own.
        </p>
      </div>
      <Button
        onClick={async () => {
          const r = await action(
            () =>
              api(
                "/goals/" + goalId + "/starter",
                json("POST", { starterId: s.id }),
              ),
            "Your first project is ready. Start small and make it yours.",
          );
          if (r) {
            setTaskId(r.taskId);
            nav("workspace");
          }
        }}
      >
        Use this starting path <ArrowRight size={16} />
      </Button>
    </div>
  );
}
function MapEditor({ skills, onClose }: { skills: R[]; onClose: () => void }) {
  const { bundle, goalId, action, busy } = useApp();
  const blank = () => ({
    key: "skill-" + crypto.randomUUID().slice(0, 8),
    name: "",
    definition: "",
    relevance: "",
    prerequisites: [] as string[],
    standards: [""],
    basis: "Learner-defined; not yet verified.",
    next_practice: "",
  });
  const [items, setItems] = useState<R[]>(
    skills.length
      ? skills.map((s) => ({
          ...s,
          standards: parse(s.standards, []),
          prerequisites: bundle!.dependencies
            .filter((d: R) => d.skill_id === s.id)
            .map((d: R) => skills.find((x) => x.id === d.prerequisite_id)?.key)
            .filter(Boolean),
        }))
      : [blank()],
  );
  const [rationale, setRationale] = useState(
    "A path I chose to support my goal. I can refine it as I practice.",
  );
  const update = (i: number, k: string, v: any) =>
    setItems((old) => old.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  return (
    <Modal
      title="Make a path that feels like yours"
      subtitle="Define a few concrete skills. Connect only what really depends on something else."
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await action(
            () =>
              api(
                "/goals/" + goalId + "/map",
                json("POST", {
                  rationale,
                  skills: items.map((s) => ({
                    key: s.key,
                    name: s.name,
                    definition: s.definition,
                    relevance: s.relevance,
                    prerequisites: s.prerequisites,
                    standards: s.standards.filter(Boolean),
                    basis: s.basis,
                    next_practice: s.next_practice,
                  })),
                }),
              ),
            "Your path is saved. You don’t have to see every step to start.",
          );
          if (r) onClose();
        }}
      >
        {items.map((s, i) => (
          <div className="skill-edit" key={s.key}>
            <div className="block-heading">
              <h3>Skill {String(i + 1).padStart(2, "0")}</h3>
              {items.length > 1 && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={"Remove " + (s.name || "skill")}
                  onClick={() =>
                    setItems((old) =>
                      old
                        .filter((_, j) => j !== i)
                        .map((x) => ({
                          ...x,
                          prerequisites: x.prerequisites.filter(
                            (k: string) => k !== s.key,
                          ),
                        })),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="two-col">
              <Field label="A specific skill">
                <input
                  required
                  placeholder="e.g. Write reusable Python functions"
                  value={s.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                />
              </Field>
              <Field label="What does this mean in practice?">
                <input
                  required
                  placeholder="Define a concrete ability"
                  value={s.definition}
                  onChange={(e) => update(i, "definition", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Why does it matter to your goal?">
              <input
                required
                value={s.relevance}
                onChange={(e) => update(i, "relevance", e.target.value)}
              />
            </Field>
            <div className="two-col">
              <Field
                label="What would show this ability?"
                hint="One observable standard per line."
              >
                <textarea
                  required
                  rows={2}
                  value={s.standards.join("\n")}
                  onChange={(e) =>
                    update(i, "standards", e.target.value.split("\n"))
                  }
                />
              </Field>
              <Field label="A useful next exercise">
                <textarea
                  rows={2}
                  value={s.next_practice}
                  onChange={(e) => update(i, "next_practice", e.target.value)}
                />
              </Field>
            </div>
            {items.length > 1 && (
              <fieldset>
                <legend>Builds on</legend>
                <div className="checkbox-row">
                  {items
                    .filter((x) => x.key !== s.key && x.name)
                    .map((x) => (
                      <label key={x.key}>
                        <input
                          type="checkbox"
                          checked={s.prerequisites.includes(x.key)}
                          onChange={(e) =>
                            update(
                              i,
                              "prerequisites",
                              e.target.checked
                                ? [...s.prerequisites, x.key]
                                : s.prerequisites.filter(
                                    (k: string) => k !== x.key,
                                  ),
                            )
                          }
                        />
                        {x.name}
                      </label>
                    ))}
                </div>
              </fieldset>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={items.length >= 24}
          onClick={() => setItems([...items, blank()])}
        >
          <Plus size={16} />
          Add a connected skill
        </Button>
        <Field label="Why this path?">
          <textarea
            required
            rows={2}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep exploring
          </Button>
          <Button disabled={busy}>
            Save my skill map <Check size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function ChallengesPage() {
  const {
    data,
    bundle,
    goalId,
    newGoal,
    action,
    ai,
    aiBusy,
    nav,
    setGoal,
    setTaskId,
  } = useApp();
  const [filter, setFilter] = useState("All"),
    [query, setQuery] = useState("");
  return (
    <>
      <SectionHead
        eyebrow="A LITTLE BEYOND WHAT YOU KNOW"
        title="Find something worth trying."
        description="Real problems, new perspectives, and room to surprise yourself."
      >
        <GoalSelect />
        {goalId && (
          <Button disabled={aiBusy} onClick={() => ai("design")}>
            <Sparkles size={16} />
            Find challenges for me
          </Button>
        )}
      </SectionHead>
      <div className="block-heading">
        <h2>Try a complete learning scenario</h2>
        <Badge>3 interactive demos</Badge>
      </div>
      <div className="demo-grid">
        {demos.map((s) => (
          <div className="demo-card" key={s.id}>
            <span className="eyebrow">
              ILLUSTRATIVE DEMO · {s.label.toUpperCase()}
            </span>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <Button
              onClick={async () => {
                const r = await action(
                  () => api("/demos/" + s.id, json("POST", {})),
                  "Demo ready. Explore the map, work and feedback — all clearly labelled as examples.",
                );
                if (r) {
                  setGoal(r.goalId);
                  setTaskId(r.taskId);
                  nav("workspace");
                }
              }}
            >
              Open this demo <ArrowRight size={16} />
            </Button>
          </div>
        ))}
      </div>
      {bundle?.suggestions.some((s: R) => s.status === "suggested") && (
        <section>
          <div className="block-heading">
            <h2>Designed around your direction</h2>
            <Badge tone="teal">Agent suggestions</Badge>
          </div>
          <div className="challenge-grid">
            {bundle.suggestions
              .filter((s: R) => s.status === "suggested")
              .map((s: R) => {
                const d = parse(s.details);
                return (
                  <div className="paper challenge-card" key={s.id}>
                    <Badge tone="teal">{d.difficulty}</Badge>
                    <h3>{s.title}</h3>
                    <p>{d.why}</p>
                    <h4>What you’ll make</h4>
                    <p>{d.outcome}</p>
                    <h4>Why this fits</h4>
                    <p>{d.relevance}</p>
                    <p className="small-text">
                      {d.estimated_minutes} minutes · {d.foundations.join(", ")}
                    </p>
                    <div className="gentle-note">
                      <Lightbulb size={17} />
                      {d.starting_point}
                    </div>
                    <div className="inline-actions">
                      <Button
                        onClick={() =>
                          action(
                            () =>
                              api(
                                "/suggestions/" + s.id,
                                json("PATCH", { status: "accepted" }),
                              ),
                            "A new direction to explore. Turn it into a task when you’re ready.",
                          )
                        }
                      >
                        I’m curious <ArrowRight size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          action(
                            () =>
                              api(
                                "/suggestions/" + s.id,
                                json("PATCH", { status: "rejected" }),
                              ),
                            "Your direction is yours to choose.",
                          )
                        }
                      >
                        Not for me
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}
      {bundle?.suggestions
        .filter((s: R) => s.status === "accepted")
        .map((s: R) => (
          <div key={s.id} className="accepted-challenge">
            <CheckCircle2 size={21} />
            <div>
              <strong>{s.title}</strong>
              <p>
                You chose this direction. The Agent can shape a task around it,
                or you can design your own.
              </p>
            </div>
            <Button
              disabled={aiBusy}
              onClick={() =>
                ai("assign", {
                  message:
                    "Design my next task around this accepted challenge: " +
                    s.title +
                    ". " +
                    parse(s.details).outcome,
                }).then((r) => {
                  if (r) nav("workspace");
                })
              }
            >
              Make it a task <ArrowRight size={15} />
            </Button>
          </div>
        ))}
      <div className="library-heading">
        <div>
          <span className="eyebrow">A STARTING POINT, NOT A BOX</span>
          <h2>Where could your curiosity take you?</h2>
          <p>
            Choose a curated starting path, or bring a completely different
            skill.
          </p>
        </div>
        <div className="search-field compact">
          <Search size={17} />
          <input
            aria-label="Search starting paths"
            placeholder="Find an interest…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="filter-tabs">
        {[
          "All",
          "Technology",
          "Creative",
          "Communication",
          "Career & finance",
          "Career & craft",
        ].map((f) => (
          <button
            className={filter === f ? "selected" : ""}
            onClick={() => setFilter(f)}
            key={f}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="challenge-grid">
        {starters
          .filter(
            (s) =>
              (filter === "All" || s.category === filter) &&
              (s.title + " " + s.tags.join(" "))
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((s, i) => {
            const Icon = starterIcon(s);
            return (
              <button
                className="path-card"
                key={s.id}
                onClick={() => newGoal(s)}
              >
                <div className={"path-visual visual-" + i}>
                  <div className="path-visual-grid" />
                  <span>
                    <Icon size={38} strokeWidth={1.25} />
                  </span>
                  <small>{String(i + 1).padStart(2, "0")} / EXPLORE</small>
                  <ArrowUpRight size={22} />
                </div>
                <div className="path-card-copy">
                  <span className="eyebrow">{s.category}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="tag-row">
                    {s.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                  <div className="path-bottom">
                    <span>
                      <Clock size={14} />
                      {s.time}
                    </span>
                    <span>
                      Make it yours <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        <button className="path-card own-path" onClick={() => newGoal()}>
          <div className="own-path-icon">
            <Plus size={35} strokeWidth={1} />
          </div>
          <span className="eyebrow">SOMETHING ENTIRELY YOURS</span>
          <h3>
            Your interests don’t
            <br />
            have to fit a category.
          </h3>
          <p>Bring the skill you’ve been thinking about. We’ll start there.</p>
          <span className="text-btn">
            Create my own direction <ArrowUpRight size={16} />
          </span>
        </button>
      </div>
      <div className="gentle-note">
        <BookOpen size={18} />
        <p>
          These are human-authored starting paths, not AI-generated assessments.
          You choose the direction and can change any step. No template implies
          a hiring guarantee or formal qualification.
        </p>
      </div>
    </>
  );
}
export function PortfolioPage() {
  const { data, bundle, action, nav, toast, goalId, setGoal, setTaskId } =
    useApp();
  const [selected, setSelected] = useState<R | null>(null);
  const [copy, setCopy] = useState("");
  return (
    <>
      <SectionHead
        eyebrow="THINGS YOU CAN POINT TO"
        title="Your capability, made visible."
        description="A collection of real work, thoughtful decisions, and the skills they demonstrate."
      >
        <a className="btn secondary" href="/api/export" download>
          <Download size={16} />
          Export my learning
        </a>
      </SectionHead>
      <div className="portfolio-banner">
        <span>
          <FolderCheck size={28} />
        </span>
        <div>
          <h3>More than a finished project. A piece of your growth.</h3>
          <p>
            Every submitted version has a story. Independent verification adds
            evidence; the work matters before that, too.
          </p>
        </div>
        <Badge tone="teal">Private by default</Badge>
      </div>
      {!data!.portfolio.length ? (
        <Empty
          icon={FolderCheck}
          title="Your next “I made this” belongs here."
          action={
            <Button onClick={() => nav("workspace")}>
              Build something meaningful <ArrowRight size={16} />
            </Button>
          }
        >
          Submit a task, then keep a version in your portfolio. Independent
          challenges can add demonstrated skills.
        </Empty>
      ) : (
        <div className="portfolio-grid">
          {data!.portfolio.map((p: R, i: number) => {
            const result = parse(p.result),
              verified = result.verification_passed;
            return (
              <div className="portfolio-card" key={p.id}>
                <button
                  className={"portfolio-preview visual-" + i}
                  onClick={async () => {
                    const r = await action(() => api("/portfolio/" + p.id));
                    if (r) setSelected(r);
                  }}
                >
                  <FileText size={43} strokeWidth={1} />
                  <span>PROJECT / {String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight size={20} />
                </button>
                <div className="portfolio-copy">
                  <div className="tag-row">
                    <Badge tone={verified ? "teal" : "neutral"}>
                      {verified
                        ? "Independent evidence"
                        : "Project work · not verified"}
                    </Badge>
                    <Badge>
                      {p.visibility === "shared" ? "Shared" : "Private"}
                    </Badge>
                  </div>
                  <h3>{p.title}</h3>
                  <p>
                    {verified
                      ? result.summary
                      : "A real artifact from your learning journey. Keep building, reflecting and testing your ability."}
                  </p>
                  <small>
                    Version {p.version} · {date(p.created_at)} ·{" "}
                    {parse(p.assistance).declared || "Assistance recorded"}
                  </small>
                  <div className="portfolio-actions">
                    <button
                      className="text-btn"
                      onClick={async () => {
                        const r = await action(() => api("/portfolio/" + p.id));
                        if (r) setSelected(r);
                      }}
                    >
                      Explore the work <ArrowRight size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={"Share settings for " + p.title}
                      onClick={async () => {
                        const r = await action(
                          () =>
                            api(
                              "/portfolio/" + p.id,
                              json("PATCH", {
                                visibility:
                                  p.visibility === "private"
                                    ? "shared"
                                    : "private",
                              }),
                            ),
                          p.visibility === "private"
                            ? "Sharing enabled within this site’s access rules."
                            : "Your project is private again.",
                        );
                        if (r?.shareUrl) {
                          await navigator.clipboard
                            .writeText(r.shareUrl)
                            .catch(() => {});
                          toast(
                            "Share link copied. Site access rules still apply.",
                          );
                        }
                      }}
                    >
                      {p.visibility === "shared" ? (
                        <Lock size={16} />
                      ) : (
                        <LinkIcon size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected && (
        <Modal
          title={selected.title}
          subtitle={`Version ${selected.version} · ${date(selected.created_at)}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="gentle-note">
            <Shield size={19} />
            <span>
              {parse(selected.result).verification_passed
                ? "This project has evidence from an independent transfer task."
                : "This is a learning project. Independent capability has not been verified."}{" "}
              Kleos records are not external certification.
            </span>
          </div>
          <h4>The submitted work</h4>
          <pre>
            {selected.content ||
              "This version contains linked or uploaded work."}
          </pre>
          <h4>Your decisions & reflection</h4>
          <p>{selected.explanation}</p>
          <p>
            {parse(selected.result).summary ||
              "Explore this project in its learning goal to see the submission and reflection."}
          </p>
          {parse(selected.result).strengths?.map((s: R, i: number) => (
            <div className="strength" key={i}>
              <CheckCircle2 size={18} />
              <div>
                <strong>{s.observation}</strong>
                <blockquote>{s.quote}</blockquote>
                <p>{s.why_it_matters}</p>
              </div>
            </div>
          ))}
          <div className="modal-actions">
            <Button
              onClick={() => {
                setGoal(selected.goal_id);
                setTaskId(selected.task_id);
                setSelected(null);
                nav("workspace");
              }}
            >
              Open my workspace <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      <div className="small-print">
        <Shield size={16} />
        <p>
          AI feedback, learner-declared independence and externally verified
          qualifications are different kinds of evidence. Your portfolio keeps
          those distinctions visible.
        </p>
      </div>
    </>
  );
}

export function SettingsPage() {
  const { data, action, busy, nav, toast } = useApp();
  const settings = parse(data!.user.settings);
  const [name, setName] = useState(data!.user.name),
    [timezone, setTimezone] = useState(
      settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    [notify, setNotify] = useState(!!settings.notifications),
    [preference, setPreference] = useState(settings.teaching_preference || ""),
    [deleteOpen, setDeleteOpen] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [feedback, setFeedback] = useState("");
  const { plan, usage, subscription, storageBytes } = data!.access;
  return (
    <>
      <SectionHead
        eyebrow="A SPACE THAT WORKS FOR YOU"
        title="Make yourself at home."
        description="Your account, learning preferences, privacy, and plan."
      />
      <div className="settings-grid">
        <section className="paper">
          <h3>Your profile</h3>
          <p>The practical details behind your personal learning space.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(
                () =>
                  api(
                    "/settings",
                    json("PATCH", {
                      name,
                      language: "en",
                      timezone,
                      notifications: notify,
                      teaching_preference: preference,
                    }),
                  ),
                "Your space feels a little more like you. Preferences saved.",
              );
            }}
          >
            <Field label="What should we call you?">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Account email">
              <input value={data!.user.email} disabled />
            </Field>
            <div className="two-col">
              <Field label="Language">
                <select value="en" onChange={() => {}}>
                  <option value="en">English</option>
                </select>
              </Field>
              <Field label="Your time zone">
                <input
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </Field>
            </div>
            <Field label="What helps you learn?">
              <textarea
                rows={3}
                placeholder="Examples first? A visual explanation? A little time to try before a hint?"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
              />
            </Field>
            <label className="check-label">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              I’d like gentle learning reminders when notifications become
              available.
            </label>
            <p className="small-text">
              Preference only. No emails or notifications are sent by this
              release.
            </p>
            <SaveButton>Save my preferences</SaveButton>
          </form>
        </section>
        <section className="paper plan-card">
          <div className="card-top">
            <span className="eyebrow">YOUR CURRENT PLAN</span>
            <Badge tone="teal">
              {data!.services.billingMode === "test"
                ? "Test billing"
                : "Billing"}
            </Badge>
          </div>
          <h2>
            {plan.name}
            <span>
              {plan.id === "free" ? "Free learning space" : "Subscription"}
            </span>
          </h2>
          <ul className="check-list">
            {parse(plan.features, []).map((s: string) => (
              <li key={s}>
                <Check size={16} />
                {s}
              </li>
            ))}
          </ul>
          <div className="usage-line">
            <strong>AI guidance</strong>
            <span>
              {usage.used} / {plan.ai_limit} actions
            </span>
          </div>
          <div className="usage-bar">
            <i
              style={{
                width:
                  Math.min(
                    100,
                    ((usage.used + usage.reserved) /
                      Math.max(1, plan.ai_limit)) *
                      100,
                  ) + "%",
              }}
            />
          </div>
          <p className="small-text">
            {Math.max(0, plan.ai_limit - usage.used - usage.reserved)} available
            this month · {usage.reserved} in progress
          </p>
          <div className="usage-line">
            <strong>Project files</strong>
            <span>
              {bytes(storageBytes)} / {bytes(plan.storage_limit)}
            </span>
          </div>
          <div className="usage-bar">
            <i
              style={{
                width:
                  Math.min(
                    100,
                    (storageBytes / Math.max(1, plan.storage_limit)) * 100,
                  ) + "%",
              }}
            />
          </div>
          <p className="small-text">
            Failed AI actions and safe retries do not consume your
            successful-action allowance.
          </p>
          {subscription && (
            <p>
              Subscription: {subscription.status}
              {subscription.cancel_at_end ? " · Cancels at period end" : ""}
            </p>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              action(async () => {
                const r = await api(
                  subscription?.customer_id
                    ? "/billing/portal"
                    : "/billing/checkout",
                  json("POST", {}),
                );
                if (r.url) location.assign(r.url);
                return r;
              })
            }
          >
            {subscription?.customer_id
              ? "Manage subscription"
              : "Explore Builder plan"}
            <ArrowUpRight size={16} />
          </Button>
          <p className="small-text">
            {data!.services.billing
              ? "Prices and payment details are shown in the secure checkout."
              : "Paid plans are not enabled yet. No payment will be taken."}
          </p>
        </section>
        <section className="paper">
          <h3>Your learning Agent</h3>
          <p>
            Guidance rooted in your goals, your attempts, and your actual work.
          </p>
          <div className="connection-row">
            <span
              className={"connection-dot " + (data!.services.ai ? "ready" : "")}
            />
            <div>
              <strong>
                {data!.services.ai
                  ? "AI guidance is connected"
                  : "AI guidance is not connected yet"}
              </strong>
              <small>
                {data!.services.ai
                  ? "Ready to help you explore, practice and reflect."
                  : "Your goals, maps, drafts and projects still work and are saved."}
              </small>
            </div>
            <Badge tone={data!.services.ai ? "teal" : "neutral"}>
              {data!.services.ai ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <details className="form-details">
            <summary>
              Connection information for the site owner{" "}
              <ChevronRight size={15} />
            </summary>
            <p>
              Configure <code>OPENAI_API_KEY</code> in the hosting environment,
              then deploy a new version. Never paste a key into a goal, chat or
              browser form. Model selection uses <code>OPENAI_MODEL</code>.
            </p>
            <p>
              Real-world performance may need a qualified reviewer. AI cannot
              infer taste, professional certification or hiring eligibility from
              uploaded work.
            </p>
          </details>
        </section>
        <section className="paper">
          <h3>Your data. Your control.</h3>
          <p>
            Your work is private unless you explicitly share a portfolio
            project. Sharing always follows the site’s visitor access rules.
          </p>
          <a className="btn secondary" href="/api/export" download>
            <Download size={16} />
            Download my learning data
          </a>
          <div className="account-actions">
            <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
              <LogOut size={16} />
              Sign out of this session
            </a>
            <button className="danger-text" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              Delete my learning data
            </button>
          </div>
          <p className="small-text">
            Sign-in security, email verification and other active sessions are
            managed by your ChatGPT account.
          </p>
        </section>
        <section className="paper settings-feedback">
          <h3>Help shape a better learning space.</h3>
          <p>
            Something that helped, something missing, or an idea you’d love to
            see.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await action(
                () => api("/feedback", json("POST", { content: feedback })),
                "Thank you. Your feedback has been saved for the site team.",
              );
              if (r) setFeedback("");
            }}
          >
            <Field label="Your feedback">
              <textarea
                required
                minLength={3}
                maxLength={5000}
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </Field>
            <SaveButton>Save feedback</SaveButton>
          </form>
        </section>
      </div>
      {deleteOpen && (
        <Modal
          title="Delete your learning data?"
          subtitle="This permanently removes your goals, work, evidence and uploaded files. Export a copy first if you want to keep them."
          onClose={() => setDeleteOpen(false)}
        >
          <Field label="Type DELETE MY LEARNING DATA to confirm">
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Field>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Keep my learning space
            </Button>
            <Button
              variant="danger"
              disabled={confirmation !== "DELETE MY LEARNING DATA" || busy}
              onClick={async () => {
                const r = await action(() =>
                  api("/account", json("DELETE", { confirmation })),
                );
                if (r) location.assign("/signout-with-chatgpt?return_to=%2F");
              }}
            >
              Permanently delete
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function AdminPage() {
  const { data, action } = useApp();
  const [state, setState] = useState<R | null>(null),
    [error, setError] = useState(""),
    [content, setContent] = useState(""),
    [title, setTitle] = useState(""),
    [kind, setKind] = useState("task");
  const load = () =>
    api("/admin/overview")
      .then(setState)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (data!.admin) load();
  }, []);
  if (!data!.admin)
    return (
      <Empty icon={Shield} title="This area is for the site team.">
        Administration needs an explicitly authorized account.
      </Empty>
    );
  return (
    <>
      <SectionHead
        eyebrow="RESTRICTED ADMINISTRATION"
        title="Keep the learning space healthy."
        description="User records, model calls, content and reported feedback."
      >
        <Button variant="secondary" onClick={load}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </SectionHead>
      {error && <p className="error-text">{error}</p>}
      {!state ? (
        <Loading />
      ) : (
        <>
          <div className="stats-row">
            {[
              ["Users", state.users.length],
              ["AI calls shown", state.calls.length],
              ["Pending reviews", state.reviews.length],
            ].map(([k, v]) => (
              <div key={k}>
                <strong>
                  {v}
                  <small>{k}</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="two-col">
            <section className="paper">
              <h3>Reported feedback</h3>
              {state.feedback.length ? (
                state.feedback.map((f: R) => (
                  <div className="review-row" key={f.id}>
                    <Badge>{f.status}</Badge>
                    <p>{f.content}</p>
                    <small>{date(f.created_at)}</small>
                  </div>
                ))
              ) : (
                <p>No feedback yet.</p>
              )}
            </section>
            <section className="paper">
              <h3>Manual review queue</h3>
              {state.reviews.length ? (
                state.reviews.map((r: R) => (
                  <div className="review-row" key={r.id}>
                    <Badge tone="amber">Qualified review required</Badge>
                    <p>{parse(r.result).summary}</p>
                    <p>{parse(r.result).domain_boundary}</p>
                    <small>
                      No automatic approval. Review the underlying evidence with
                      an appropriate qualified reviewer.
                    </small>
                  </div>
                ))
              ) : (
                <p>No assessments waiting for a reviewer.</p>
              )}
            </section>
            <section className="paper">
              <h3>Create a reusable resource</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await action(
                    () =>
                      api(
                        "/admin/templates",
                        json("POST", { kind, title, content }),
                      ),
                    "Resource saved with an audit record.",
                  );
                  if (r) {
                    setContent("");
                    setTitle("");
                    load();
                  }
                }}
              >
                <Field label="Type">
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {["task", "skill", "resource", "rubric"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Title">
                  <input
                    required
                    minLength={3}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field>
                <Field label="Content">
                  <textarea
                    required
                    rows={5}
                    minLength={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </Field>
                <SaveButton>Save resource</SaveButton>
              </form>
            </section>
            <section className="paper">
              <h3>Runtime recovery</h3>
              <p>
                Safely release interrupted AI actions older than five minutes.
                Saved submissions remain unchanged.
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  action(
                    () => api("/admin/recover", json("POST", {})),
                    "Interrupted actions reconciled.",
                  )
                }
              >
                <RefreshCw size={16} />
                Recover interrupted actions
              </Button>
              <h4>Entitlements</h4>
              {state.plans.map((p: R) => (
                <div className="review-row" key={p.id}>
                  <strong>{p.name}</strong>
                  <p>
                    {p.ai_limit} AI actions · {p.goal_limit} goals ·{" "}
                    {bytes(p.storage_limit)}
                  </p>
                </div>
              ))}
            </section>
          </div>
          <section className="paper">
            <h3>AI call observability</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Time",
                      "Workflow job",
                      "Model",
                      "Status",
                      "Latency",
                      "Tokens",
                      "Estimated cost",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.calls.map((r: R) => (
                    <tr key={r.id}>
                      <td>{date(r.created_at)}</td>
                      <td>{r.job_id.slice(0, 8)}</td>
                      <td>{r.model}</td>
                      <td>
                        <Badge
                          tone={r.status === "succeeded" ? "teal" : "amber"}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td>{r.latency_ms} ms</td>
                      <td>{r.input_tokens + r.output_tokens}</td>
                      <td>
                        {r.cost === null
                          ? "Unknown"
                          : "$" + Number(r.cost).toFixed(5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!state.calls.length && (
                <p>No model calls yet. No simulated usage is recorded.</p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function LegalPage({ type }: { type: string }) {
  const privacy = type === "privacy";
  return (
    <>
      <SectionHead
        eyebrow="CLEAR EXPECTATIONS"
        title={
          privacy
            ? "Your learning stays yours."
            : "A thoughtful learning agreement."
        }
        description="Product information for the current private release. Commercial launch requires operator legal review."
      />
      <article className="paper legal-copy">
        {privacy ? (
          <>
            <h2>What your workspace stores</h2>
            <p>
              Kleos saves the learning goals, maps, drafts, submissions,
              explanations, uploads and feedback you choose to provide. It
              records in-platform attempts and hint use to support your
              learning. It cannot observe activity outside the platform unless
              you explicitly import it.
            </p>
            <h3>AI and external services</h3>
            <p>
              When connected, AI guidance sends relevant goal and task context,
              submitted text and extracted text files to the configured OpenAI
              service. Media without extraction is stored but not automatically
              analyzed. Payments, when enabled, are processed by Stripe; card
              data is not stored in this application. ChatGPT sign-in manages
              authentication.
            </p>
            <h3>Control and sharing</h3>
            <p>
              Projects are private by default. You can export records, correct
              evidence, revoke project sharing or delete learning data. Shared
              links remain subject to site access rules. Local IDE snapshots are
              imported only after you choose files and confirm the import.
            </p>
            <h3>Retention and contact</h3>
            <p>
              Learning records remain until deleted. Administrative audit and
              payment-provider retention follow the operator and provider
              policies. This private release has no configured operator privacy
              contact or public commercial retention policy; those must be
              supplied before public launch.
            </p>
          </>
        ) : (
          <>
            <h2>Learn by doing. Keep your judgment.</h2>
            <p>
              Kleos helps organize learning, design tasks and collect evidence.
              AI assessments can be wrong and do not confer formal
              qualifications, guarantee employment, certify safety or replace
              qualified professional supervision.
            </p>
            <h3>Real-world practice</h3>
            <p>
              For medical, safety-critical, physical, culinary and regulated
              skills, use appropriate qualified guidance. Photographs cannot
              establish taste, texture, safety or professional performance. A
              mentor record entered by a learner is labelled as reported
              feedback, not an authenticated qualification.
            </p>
            <h3>Your work</h3>
            <p>
              Submit work you have the right to use, acknowledge sources and
              accurately describe assistance. You control project sharing. Never
              upload credentials, highly sensitive records or content you are
              not authorized to share.
            </p>
            <h3>Commercial availability</h3>
            <p>
              Paid services are disabled until a payment provider, prices and
              operator information are configured. This release uses test
              billing by default. Public commercial terms, support contact,
              refund rules and applicable consumer rights need operator review
              before paid launch.
            </p>
          </>
        )}
      </article>
    </>
  );
}
