import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Target,
  Network,
  PanelsTopLeft,
  Compass,
  FolderCheck,
  Settings,
  Shield,
  ArrowUpRight,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogOut,
  ArrowRight,
  Bell,
  Loader2,
} from "lucide-react";
import {
  AppContext,
  api,
  json,
  parse,
  R,
  ApiError,
  Button,
  Modal,
  Field,
  Loading,
  Badge,
} from "./lib";
import {
  HomePage,
  GoalsPage,
  MapPage,
  ChallengesPage,
  PortfolioPage,
  SettingsPage,
  AdminPage,
  LegalPage,
} from "./pages";
import { Workspace } from "./workspace";
import { starters } from "../../shared/starters";
const navigation = [
  ["home", "My space", Home],
  ["goals", "Learning goals", Target],
  ["map", "Skill map", Network],
  ["workspace", "Workspace", PanelsTopLeft],
  ["challenges", "Challenges", Compass],
  ["portfolio", "My portfolio", FolderCheck],
] as const;
export default function App() {
  const [data, setData] = useState<R | null>(null),
    [bundle, setBundle] = useState<R | null>(null),
    [goalId, setGoalId] = useState(localStorage.getItem("kleos-goal") || ""),
    [view, setView] = useState(
      new URLSearchParams(location.search).get("view") || "home",
    ),
    [taskId, setTaskId] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<ApiError | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [create, setCreate] = useState<R | null>(null),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [searchTerm, setSearchTerm] = useState(""),
    [aiBusy, setAiBusy] = useState(false),
    [aiStatus, setAiStatus] = useState(""),
    [shared, setShared] = useState<R | null>(null);
  const abortRef = useRef<AbortController | null>(null),
    jobRef = useRef("");
  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((n) => (n === message ? "" : n)), 6500);
  };
  const nav = (v: string) => {
    setView(v);
    setMobile(false);
    const u = new URL(location.href);
    u.searchParams.set("view", v);
    history.replaceState({}, "", u);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setGoal = (gid: string) => {
    setGoalId(gid);
    setTaskId("");
    localStorage.setItem("kleos-goal", gid);
  };
  async function refresh() {
    const d = await api("/bootstrap");
    setData(d);
    const gid = d.goals.some((g: R) => g.id === goalId)
      ? goalId
      : d.goals[0]?.id || "";
    if (gid) {
      if (gid !== goalId) setGoal(gid);
      setBundle(await api("/goals/" + gid));
    } else setBundle(null);
  }
  useEffect(() => {
    const token = new URLSearchParams(location.search).get("shared");
    (token
      ? api("/shared/" + encodeURIComponent(token)).then(setShared)
      : refresh()
    )
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!goalId || !data) return;
    setBundle(null);
    let active = true;
    api("/goals/" + goalId)
      .then((b) => {
        if (active) setBundle(b);
      })
      .catch(setError);
    return () => {
      active = false;
    };
  }, [goalId]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  async function action(fn: () => Promise<any>, message?: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await fn();
      await refresh();
      if (message) toast(message);
      return r;
    } catch (e) {
      setError(e as ApiError);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function ai(kind: string, options: R = {}) {
    if (!goalId) return;
    setError(null);
    setAiBusy(true);
    setAiStatus("Preparing your learning context…");
    jobRef.current = "";
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/ai", {
        ...json("POST", {
          goalId,
          kind,
          ...options,
          idempotencyKey: crypto.randomUUID(),
        }),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        const d: any = await response.json();
        throw new ApiError(d.error?.code, d.error?.message, response.status);
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const d: any = await response.json();
        if (d.job?.status === "succeeded") {
          await refresh();
          return parse(d.job.result);
        }
        throw new Error(d.job?.error || "This action is still in progress.");
      }
      const reader = response.body!.getReader(),
        decoder = new TextDecoder();
      let buffer = "",
        result: R | null = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index;
        while ((index = buffer.indexOf("\n\n")) >= 0) {
          const raw = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          const event = raw.match(/^event: ?(.+)$/m)?.[1],
            payload = raw
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.slice(5).trimStart())
              .join("\n");
          if (!payload) continue;
          const d = parse(payload);
          if (d.jobId) jobRef.current = d.jobId;
          if (event === "status") setAiStatus(d.message);
          if (event === "delta")
            setAiStatus(
              kind === "evaluate"
                ? "Finding useful feedback in your work…"
                : kind === "hint"
                  ? "Shaping a helpful next step…"
                  : "Building something around your goal…",
            );
          if (event === "result") result = d;
          if (event === "error") throw new ApiError(d.code, d.message, 500);
        }
      }
      if (!result)
        throw new Error(
          "The connection ended. Your work is safe; check the learning history before retrying.",
        );
      await refresh();
      if (result.taskId) setTaskId(result.taskId);
      toast(
        kind === "evaluate"
          ? "Your feedback is ready. Every iteration gives you more to work with."
          : kind === "map"
            ? "Your path is ready. One step at a time."
            : kind === "hint"
              ? "A little guidance can open a new way forward."
              : "Your next learning step is ready.",
      );
      return result;
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e as ApiError);
      else {
        toast("Action stopped. Your saved work is safe.");
        await refresh();
      }
      return null;
    } finally {
      setAiBusy(false);
      setAiStatus("");
      abortRef.current = null;
    }
  }
  function cancelAI() {
    if (jobRef.current)
      api("/jobs/" + jobRef.current + "/cancel", json("POST", {}))
        .then(() => abortRef.current?.abort())
        .catch(setError);
    else abortRef.current?.abort();
  }
  const state = {
    data,
    bundle,
    goalId,
    view,
    taskId,
    setTaskId,
    setGoal,
    nav,
    refresh,
    action,
    ai,
    aiBusy,
    aiStatus,
    cancelAI,
    busy,
    toast,
    newGoal: (starter?: R) => setCreate(starter || {}),
  };
  if (loading) return <Loading />;
  if (shared)
    return (
      <div className="shared-project">
        <img
          src="/kleos-logo.png"
          alt="Kleos — Build the skills to answer it yourself."
        />
        <Badge tone="teal">Shared learning project</Badge>
        <h1>{shared.project.title}</h1>
        <p>
          Version {shared.project.version} ·{" "}
          {new Date(shared.project.created_at).toLocaleDateString("en")}
        </p>
        <article className="paper">
          <h3>The work</h3>
          <pre>{shared.project.content}</pre>
          <h3>Decisions & reflection</h3>
          <p>{shared.project.explanation}</p>
        </article>
        <p>{shared.notice}</p>
        <p>
          Only information in this shared project is shown. An AI assessment is
          not an external qualification.
        </p>
      </div>
    );
  if (!data)
    return (
      <div className="auth-page">
        <img src="/kleos-logo.png" alt="Kleos" />
        <span className="eyebrow">YOUR PERSONAL LEARNING AGENT</span>
        <h1>
          Your curiosity.
          <br />A world of possibility.
        </h1>
        <p>
          Turn what you love into something you can do.
          <br />
          Real projects. Thoughtful guidance. Progress you can see.
        </p>
        {error?.status === 401 ? (
          <a
            className="btn primary"
            target="_top"
            href="/signin-with-chatgpt?return_to=%2F"
          >
            Continue with ChatGPT <ArrowRight size={17} />
          </a>
        ) : (
          <>
            <p className="error-text">
              {error?.message ||
                "Your workspace is taking a little longer to load."}
            </p>
            <Button
              onClick={() => {
                setLoading(true);
                refresh()
                  .catch(setError)
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </Button>
          </>
        )}
        <small>Your learning data belongs to you.</small>
      </div>
    );
  const active = data.goals.filter((g: R) => g.status === "active"),
    current = data.goals.find((g: R) => g.id === goalId);
  return (
    <AppContext.Provider value={state}>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {mobile && (
          <div className="sidebar-scrim" onClick={() => setMobile(false)} />
        )}
        <aside className={"sidebar " + (mobile ? "open" : "")}>
          <a className="brand" href="/?view=home" aria-label="Kleos home">
            <img
              src="/kleos-logo.png"
              alt="Kleos — Build the skills to answer it yourself."
            />
          </a>
          <div className="sidebar-label">YOUR LEARNING SPACE</div>
          <nav aria-label="Main navigation">
            {navigation.map(([v, label, Icon]) => (
              <button
                className={"nav-item " + (view === v ? "active" : "")}
                key={v}
                onClick={() => nav(v)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {view === v && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-goals">
            <div className="sidebar-label">
              YOUR GOALS{" "}
              <button
                aria-label="Add learning goal"
                onClick={() => setCreate({})}
              >
                <Plus size={15} />
              </button>
            </div>
            {active.slice(0, 4).map((g: R) => (
              <button
                key={g.id}
                className={"mini-goal " + (g.id === goalId ? "selected" : "")}
                onClick={() => {
                  setGoal(g.id);
                  nav("goals");
                }}
              >
                <i />
                {g.title}
              </button>
            ))}
            {!active.length && (
              <button className="mini-goal muted" onClick={() => setCreate({})}>
                <Plus size={14} />
                Start with a curiosity
              </button>
            )}
          </div>
          <div className="sidebar-bottom">
            <div className="side-note">
              <Sparkles size={18} />
              <p>
                You don’t have to know it all.
                <br />
                <strong>Just take the next step.</strong>
              </p>
            </div>
            <button
              className={"nav-item " + (view === "settings" ? "active" : "")}
              onClick={() => nav("settings")}
            >
              <Settings size={18} />
              Settings & plan
            </button>
            {data.admin && (
              <button className="nav-item" onClick={() => nav("admin")}>
                <Shield size={18} />
                Administration
              </button>
            )}
            <button className="profile" onClick={() => nav("settings")}>
              <span className="avatar">
                {(data.user.name || "L").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{data.user.name}</strong>
                <small>{data.access.plan.name} plan</small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-btn mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobile(true)}
              >
                <Menu size={20} />
              </button>
              <span>My learning space</span>
              <ChevronRight size={13} />
              <strong>
                {navigation.find((n) => n[0] === view)?.[1] ||
                  (
                    {
                      settings: "Settings",
                      admin: "Administration",
                      privacy: "Privacy",
                      terms: "Terms",
                    } as R
                  )[view] ||
                  "My space"}
              </strong>
            </div>
            <div className="top-actions">
              <button
                className="search-trigger"
                onClick={() => setSearch(true)}
              >
                <Search size={16} />
                <span>Find something</span>
                <kbd>⌘ K</kbd>
              </button>
              <span className="top-divider" />
              <span className="live-indicator">
                <i />
                All yours to explore
              </span>
              <button
                className="top-avatar"
                onClick={() => nav("settings")}
                aria-label="Your account"
              >
                {(data.user.name || "L").slice(0, 1).toUpperCase()}
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle size={20} />
                <div>
                  <strong>
                    {error.code === "AI_NOT_CONFIGURED"
                      ? "AI guidance is not connected yet"
                      : "Let’s give that another try"}
                  </strong>
                  <p>{error.message}</p>
                </div>
                {error.code === "AI_NOT_CONFIGURED" && (
                  <Button variant="secondary" onClick={() => nav("settings")}>
                    Connection details
                  </Button>
                )}
                <button
                  className="icon-btn"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {aiBusy && (
              <div className="ai-progress" role="status">
                <Sparkles className="pulse" size={19} />
                {aiStatus}
                <button onClick={cancelAI}>Stop</button>
              </div>
            )}
            {bundle?.goal.details.is_demo && (
              <div className="demo-notice">
                <Sparkles size={18} />
                <span>
                  <strong>Illustrative demo</strong> — Sample work and scripted
                  feedback. This is not your capability evidence or a live AI
                  response.
                </span>
              </div>
            )}
            {view === "home" ? (
              <HomePage />
            ) : view === "goals" ? (
              <GoalsPage />
            ) : view === "map" ? (
              <MapPage />
            ) : view === "workspace" ? (
              <Workspace />
            ) : view === "challenges" ? (
              <ChallengesPage />
            ) : view === "portfolio" ? (
              <PortfolioPage />
            ) : view === "settings" ? (
              <SettingsPage />
            ) : view === "admin" ? (
              <AdminPage />
            ) : view === "privacy" || view === "terms" ? (
              <LegalPage type={view} />
            ) : (
              <HomePage />
            )}
            <footer className="page-footer">
              <span>
                KLEOS <i />
                Made for your next possibility.
              </span>
              <div>
                <button onClick={() => nav("privacy")}>Privacy</button>
                <button onClick={() => nav("terms")}>Terms</button>
                <span>Build the skills to answer it yourself.</span>
              </div>
            </footer>
          </main>
        </div>
        {notice && (
          <div className="toast" role="status">
            <CheckCircle2 size={20} />
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {create && (
          <CreateGoal
            starter={create}
            onClose={() => setCreate(null)}
            onCreated={(gid) => {
              setCreate(null);
              setGoal(gid);
              nav("goals");
            }}
          />
        )}
        {search && (
          <Modal
            title="Follow your curiosity"
            subtitle="Find your goals, tasks and projects."
            onClose={() => setSearch(false)}
          >
            <div className="search-field">
              <Search size={19} />
              <input
                aria-label="Search your workspace"
                placeholder="What are you looking for?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-results">
              {[
                ...data.goals.map((g: R) => ({
                  id: g.id,
                  title: g.title,
                  type: "Learning goal",
                  view: "goals",
                  goal: g.id,
                })),
                ...(bundle?.tasks || []).map((t: R) => ({
                  id: t.id,
                  title: t.title,
                  type: "Task",
                  view: "workspace",
                  goal: t.goal_id,
                })),
              ]
                .filter((x) =>
                  x.title.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((x) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      setGoal(x.goal);
                      if (x.type === "Task") setTaskId(x.id);
                      nav(x.view);
                      setSearch(false);
                    }}
                  >
                    <Target size={19} />
                    <span>
                      <strong>{x.title}</strong>
                      <small>{x.type}</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
            </div>
          </Modal>
        )}
      </div>
    </AppContext.Provider>
  );
}
function CreateGoal({
  starter,
  onClose,
  onCreated,
}: {
  starter: R;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { action, busy } = React.useContext(AppContext);
  const [entryType, setEntryType] = useState("skill");
  const [idea, setIdea] = useState(starter.title || ""),
    [why, setWhy] = useState(starter.description || "");
  return (
    <Modal
      title="What would you love to learn?"
      subtitle="A skill, a project, a big ambition, or a little curiosity. Start anywhere."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await action(
            () =>
              api(
                "/goals",
                json("POST", {
                  title: idea.slice(0, 160),
                  description: why || idea,
                  starterId: starter.id,
                  entryType,
                }),
              ),
            "You’ve given your curiosity a direction. That’s a real first step.",
          );
          if (r) onCreated(r.id);
        }}
      >
        <div className="entry-types">
          {[
            ["direction", "Explore a direction"],
            ["project", "Build a project"],
            ["skill", "Learn a skill"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              className={entryType === v ? "active" : ""}
              onClick={() => setEntryType(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <Field label="I want to…">
          <textarea
            required
            minLength={3}
            maxLength={160}
            rows={3}
            placeholder="Learn Python, cook with more confidence, understand finance…"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </Field>
        <Field
          label="What makes this meaningful to you?"
          hint="Optional. Your goal can be a little fuzzy for now."
        >
          <textarea
            rows={3}
            maxLength={5000}
            placeholder="Something I want to make, a problem I want to solve, or just something I love."
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
        </Field>
        <div className="gentle-note">
          <Sparkles size={17} />
          <span>
            You don’t need a perfect plan. We’ll build the next steps around
            you.
          </span>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Maybe later
          </Button>
          <Button type="submit" disabled={busy}>
            Create my goal <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
