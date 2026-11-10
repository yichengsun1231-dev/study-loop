import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Target,
  Clock,
  Check,
  CheckCircle2,
  Code2,
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Save,
  History,
  Send,
  ChevronRight,
  Shield,
  Link as LinkIcon,
  Trash2,
  Info,
  RefreshCw,
  Lock,
  MessageSquare,
  Heart,
  PanelRightClose,
  Terminal,
  Plug,
  Monitor,
  FileCode2,
  AlertCircle,
  MapPin,
  Users,
  ClipboardCheck,
  FolderOpen,
} from "lucide-react";
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
  Loading,
} from "./lib";
import { GoalSelect } from "./pages";
export function Workspace() {
  const {
    data,
    bundle,
    goalId,
    taskId,
    setTaskId,
    nav,
    newGoal,
    ai,
    aiBusy,
    action,
    busy,
    toast,
  } = useApp();
  const [tab, setTab] = useState("brief"),
    [taskEditor, setTaskEditor] = useState(false),
    [history, setHistory] = useState(false),
    [external, setExternal] = useState(false),
    [ide, setIde] = useState(false),
    [reflection, setReflection] = useState(false);
  const tasks = bundle?.tasks || [],
    task = tasks.find((t: R) => t.id === taskId) || tasks[0],
    spec = parse(task?.spec),
    attempts = (bundle?.attempts || []).filter(
      (a: R) => a.task_id === task?.id,
    ),
    latest = attempts.find((a: R) => a.status === "submitted"),
    draft = attempts.find((a: R) => a.status === "draft");
  const [content, setContent] = useState(""),
    [explanation, setExplanation] = useState(""),
    [links, setLinks] = useState(""),
    [files, setFiles] = useState<string[]>([]),
    [kind, setKind] = useState("text"),
    [assist, setAssist] = useState("guided"),
    [dirty, setDirty] = useState(false),
    [draftId, setDraftId] = useState(""),
    [revision, setRevision] = useState(1),
    [preview, setPreview] = useState<R | null>(null),
    [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cacheKey = task ? `kleos-unsaved:${data!.user.id}:${task.id}` : "";
  useEffect(() => {
    if (!task) return;
    const cached = parse(localStorage.getItem(cacheKey), null);
    const a = cached || draft;
    setContent(a?.content || "");
    setExplanation(a?.explanation || "");
    setLinks(
      Array.isArray(a?.links)
        ? a.links.join("\n")
        : parse(a?.links, []).join("\n"),
    );
    setFiles(Array.isArray(a?.fileIds) ? a.fileIds : parse(a?.file_ids, []));
    setKind(a?.kind || spec.submission_kind || "text");
    setAssist(
      a?.assist ||
        parse(a?.assistance).declared ||
        (task.kind === "verification" ? "independent" : "guided"),
    );
    setDraftId(draft?.id || "");
    setRevision(draft?.revision || 1);
    setDirty(!!cached);
  }, [task?.id]);
  useEffect(() => {
    if (dirty && cacheKey)
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          content,
          explanation,
          links: links.split("\n").filter(Boolean),
          fileIds: files,
          kind,
          assist,
        }),
      );
  }, [content, explanation, links, files, kind, assist, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const fn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  const change = (setter: (v: any) => void, value: any) => {
    setter(value);
    setDirty(true);
  };
  async function save(submit: boolean) {
    if (!task) return;
    const r = await action(
      () =>
        api(
          "/tasks/" + task.id + "/attempts",
          json("POST", {
            kind:
              kind === "files"
                ? "files"
                : kind === "link"
                  ? "link"
                  : kind === "code"
                    ? "code"
                    : kind === "mixed"
                      ? "mixed"
                      : "text",
            content,
            explanation,
            links: links
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            fileIds: files,
            submit,
            assistance: assist,
            ...(draftId ? { draftId, revision } : {}),
          }),
        ),
      submit
        ? "You made something real. That’s worth recognizing."
        : "Your draft is saved. Your next step can wait for you.",
    );
    if (r) {
      setDirty(false);
      localStorage.removeItem(cacheKey);
      if (submit) {
        setDraftId("");
        setRevision(1);
        setTab("feedback");
      } else {
        setDraftId(r.attemptId);
        setRevision((v) => (draftId ? v + 1 : 1));
      }
    }
    return r;
  }
  async function upload(list: FileList | null) {
    if (!list) return;
    setUploading(true);
    try {
      for (const f of [...list]) {
        const form = new FormData();
        form.set("file", f);
        form.set("goalId", goalId);
        const r = await action(() =>
          api("/files", { method: "POST", body: form }),
        );
        if (r) {
          setFiles((old) => [...old, r.id]);
          setDirty(true);
          toast(
            r.inspection === "stored_not_inspected"
              ? "File saved. This file is not automatically inspected by AI."
              : "File saved. Text is available for task feedback.",
          );
        }
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  const evals = (bundle?.evaluations || []).filter(
      (e: R) => e.task_id === task?.id,
    ),
    assessment = evals[0],
    feedback = assessment ? parse(assessment.result) : null;
  const noGoal = !goalId;
  return (
    <>
      <SectionHead
        eyebrow="WHERE LEARNING BECOMES DOING"
        title="Make something. Learn something."
        description="Try an idea, explain a choice, ask for a little help. This is your space to practice."
      >
        <GoalSelect />
      </SectionHead>
      {noGoal ? (
        <Empty
          icon={Target}
          title="Your next project starts with a goal."
          action={
            <Button onClick={() => newGoal()}>
              Choose what matters to you <ArrowRight size={16} />
            </Button>
          }
        >
          Bring a skill you want to learn. We’ll make space for the work.
        </Empty>
      ) : !bundle ? (
        <Loading />
      ) : !bundle.goal.confirmed || !bundle.paths.length ? (
        <Empty
          icon={BookOpen}
          title={
            bundle.goal.confirmed
              ? "A few connected skills make a useful beginning."
              : "Let’s shape your goal before your first task."
          }
          action={
            <Button
              onClick={() => nav(bundle.goal.confirmed ? "map" : "goals")}
            >
              {bundle.goal.confirmed ? "Create my path" : "Review my goal"}
              <ArrowRight size={16} />
            </Button>
          }
        >
          Your work will connect to the direction you choose.
        </Empty>
      ) : !tasks.length ? (
        <Empty
          icon={Lightbulb}
          title="Let’s make the first step a real one."
          action={
            <div className="inline-actions">
              <Button
                disabled={aiBusy}
                onClick={() =>
                  ai("assign").then((r) => {
                    if (r) setTab("brief");
                  })
                }
              >
                <Sparkles size={16} />
                Design a task with my Agent
              </Button>
              <Button variant="secondary" onClick={() => setTaskEditor(true)}>
                Create my own task
              </Button>
            </div>
          }
        >
          Something small, useful and achievable. You’ll learn what you need as
          you go.
        </Empty>
      ) : (
        <>
          <div className="workspace-heading">
            <div>
              <Badge tone={task.kind === "verification" ? "amber" : "teal"}>
                {task.kind === "verification"
                  ? "Independent transfer challenge"
                  : task.kind === "diagnostic"
                    ? "A starting-point check"
                    : task.kind === "practice"
                      ? "Targeted practice"
                      : "A real-world project"}
              </Badge>
              <select
                aria-label="Current task"
                value={task.id}
                disabled={dirty}
                onChange={(e) => {
                  setTaskId(e.target.value);
                  setTab("brief");
                }}
              >
                {tasks.map((t: R) => (
                  <option value={t.id} key={t.id}>
                    {t.title} {t.status === "complete" ? "✓" : ""}
                  </option>
                ))}
              </select>
              {dirty && (
                <small>
                  Save this draft before switching tasks. Unsaved work is also
                  kept on this device.
                </small>
              )}
            </div>
            <div className="inline-actions">
              <button className="text-btn" onClick={() => setHistory(true)}>
                <History size={16} />
                {
                  attempts.filter((a: R) => a.status === "submitted").length
                }{" "}
                submitted versions
              </button>
              <button
                className="icon-btn"
                aria-label="Create another task"
                onClick={() => setTaskEditor(true)}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="workspace-layout">
            <section className="work-main">
              <div
                className="work-tabs"
                role="tablist"
                aria-label="Task sections"
              >
                {[
                  ["brief", "The challenge"],
                  ["work", "My work"],
                  ["feedback", "Feedback & growth"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    role="tab"
                    aria-selected={tab === v}
                    className={tab === v ? "active" : ""}
                    onClick={() => setTab(v)}
                  >
                    {v === "brief" ? (
                      <BookOpen size={16} />
                    ) : v === "work" ? (
                      <Code2 size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}{" "}
                    {l}
                    {v === "feedback" && feedback && <i />}
                  </button>
                ))}
              </div>
              {tab === "brief" ? (
                <article className="task-brief">
                  <div className="task-meta">
                    <span>
                      <Clock size={14} />
                      {spec.estimated_minutes} min
                    </span>
                    <Badge>{spec.difficulty}</Badge>
                    <span>Task v{task.version}</span>
                  </div>
                  <h2>{task.title}</h2>
                  <p className="brief-context">{spec.context}</p>
                  <section>
                    <span className="task-number">01</span>
                    <div>
                      <h3>What you’ll make</h3>
                      <p>{spec.deliverable}</p>
                    </div>
                  </section>
                  <section>
                    <span className="task-number">02</span>
                    <div>
                      <h3>What a thoughtful attempt looks like</h3>
                      <ul className="rubric-list">
                        {spec.criteria?.map((c: R, i: number) => (
                          <li key={c.id}>
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <div>
                              <strong>{c.description}</strong>
                              <p>{c.evidence_required}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                  <section>
                    <span className="task-number">03</span>
                    <div>
                      <h3>Where practice meets evidence</h3>
                      <div className="practice-facts">
                        <span>
                          <MapPin size={17} />
                          <strong>
                            {
                              (
                                {
                                  platform: "In your workspace",
                                  home: "At home / in your own environment",
                                  workplace: "In a real workplace",
                                  professional_setting:
                                    "In a professional setting",
                                  external_conversation:
                                    "In an external conversation",
                                  team_challenge: "In a team challenge",
                                } as R
                              )[spec.practice_location]
                            }
                          </strong>
                        </span>
                        <span>
                          <Users size={17} />
                          <strong>
                            {
                              (
                                {
                                  ai_rubric: "AI rubric feedback",
                                  objective: "Objective checks",
                                  mentor: "Qualified real-world reviewer",
                                  mixed: "AI and qualified real-world feedback",
                                } as R
                              )[spec.verification_method]
                            }
                          </strong>
                        </span>
                      </div>
                      <ul className="check-list">
                        {spec.required_evidence?.map((s: string) => (
                          <li key={s}>
                            <ClipboardCheck size={15} />
                            {s}
                          </li>
                        ))}
                      </ul>
                      <p className="boundary-note">
                        <Shield size={16} />
                        {spec.verification_boundary}
                      </p>
                    </div>
                  </section>
                  {spec.materials?.length > 0 && (
                    <section>
                      <span className="task-number">04</span>
                      <div>
                        <h3>A few useful resources</h3>
                        {spec.materials.map((m: R, i: number) => (
                          <div className="resource-link" key={i}>
                            <BookOpen size={18} />
                            <div>
                              {/^https?:\/\//i.test(m.url) ? (
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {m.title}
                                  <ExternalLink size={13} />
                                </a>
                              ) : (
                                <strong>{m.title}</strong>
                              )}
                              <small>{m.source}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <details className="practice-details">
                    <summary>Prepare, collaborate & keep moving</summary>
                    <h4>Before you start</h4>
                    <p>{spec.preparation}</p>
                    <h4>If the opportunity doesn’t work out</h4>
                    <p>{spec.alternative_task}</p>
                    <h4>Collaboration & your contribution</h4>
                    <p>{spec.collaboration_rules}</p>
                    <h4>Respect other people’s privacy</h4>
                    <p>{spec.privacy_notes}</p>
                  </details>
                  <div className="starting-point">
                    <Lightbulb size={20} />
                    <div>
                      <strong>Your first small move</strong>
                      <p>{spec.starting_point}</p>
                    </div>
                  </div>
                  <div className="task-bottom">
                    <span>
                      <Heart size={15} />
                      You don’t have to get it right on the first try.
                    </span>
                    <Button onClick={() => setTab("work")}>
                      Let’s give it a go <ArrowRight size={16} />
                    </Button>
                  </div>
                </article>
              ) : tab === "work" ? (
                <div className="work-editor">
                  <div className="editor-top">
                    <div>
                      <h3>Your ideas, taking shape.</h3>
                      <p>
                        {dirty
                          ? "Changes are kept on this device. Save your draft to continue on other devices."
                          : draftId
                            ? "Your draft is saved to your learning space."
                            : "Try something. Your first attempt doesn’t have to be your final one."}
                      </p>
                    </div>
                    <Badge tone={dirty ? "amber" : "neutral"}>
                      {dirty
                        ? "Unsaved changes"
                        : draftId
                          ? "Draft saved"
                          : "Ready to begin"}
                    </Badge>
                  </div>
                  <div className="editor-toolbar">
                    <label>
                      Working with{" "}
                      <select
                        value={kind}
                        aria-label="Work type"
                        onChange={(e) => change(setKind, e.target.value)}
                      >
                        <option value="text">Writing & notes</option>
                        <option value="code">Code</option>
                        <option value="files">Files & media</option>
                        <option value="link">Links</option>
                        <option value="mixed">A mix of things</option>
                      </select>
                    </label>
                    {kind === "code" && (
                      <button
                        className="text-btn"
                        onClick={() => fileInput.current?.click()}
                      >
                        <Upload size={14} />
                        Upload code files
                      </button>
                    )}
                  </div>
                  <div
                    className={
                      kind === "code" ? "code-editor" : "writing-editor"
                    }
                  >
                    {kind === "code" && (
                      <div className="code-tab">
                        <span>
                          <FileCode2 size={14} />
                          my_work.py
                        </span>
                        <small>
                          Code is stored for review · no automatic execution
                        </small>
                      </div>
                    )}
                    <textarea
                      aria-label={kind === "code" ? "Your code" : "Your work"}
                      spellCheck={kind !== "code"}
                      rows={kind === "code" ? 18 : 12}
                      placeholder={
                        kind === "code"
                          ? "# Start with your own attempt.\n# Explain what you expect it to do."
                          : "Your work goes here. A first idea, a rough draft, a small experiment…"
                      }
                      value={content}
                      onChange={(e) => change(setContent, e.target.value)}
                      onKeyDown={(e) => {
                        if (kind === "code" && e.key === "Tab") {
                          e.preventDefault();
                          const el = e.currentTarget,
                            a = el.selectionStart,
                            b = el.selectionEnd;
                          change(
                            setContent,
                            content.slice(0, a) + "    " + content.slice(b),
                          );
                          requestAnimationFrame(
                            () => (el.selectionStart = el.selectionEnd = a + 4),
                          );
                        }
                      }}
                    />
                  </div>
                  <Field
                    label="Talk us through one choice you made"
                    hint="Why this approach? What assumptions did you make? How would you check your result?"
                  >
                    <textarea
                      rows={4}
                      placeholder="I chose this approach because…"
                      value={explanation}
                      onChange={(e) => change(setExplanation, e.target.value)}
                    />
                  </Field>
                  <div className="two-col">
                    <div>
                      <Field
                        label="Files, photos or supporting material"
                        hint="Up to 5 MB per file. Text/code can be reviewed; media is stored without automatic AI analysis."
                      >
                        <div className="upload-area">
                          <Upload size={21} />
                          <span>
                            {uploading
                              ? "Saving your file…"
                              : "A little evidence can say a lot."}
                          </span>
                          <Button
                            variant="secondary"
                            disabled={uploading}
                            onClick={() => fileInput.current?.click()}
                          >
                            Choose files
                          </Button>
                          <input
                            ref={fileInput}
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => upload(e.target.files)}
                          />
                        </div>
                      </Field>
                      {files.map((fid) => {
                        const f = bundle.files.find((f: R) => f.id === fid);
                        return (
                          <div className="file-row" key={fid}>
                            <FileText size={16} />
                            <a href={"/api/files/" + fid} download>
                              {f?.name || "Saved file"}
                            </a>
                            <small>{f ? bytes(f.size) : ""}</small>
                            <button
                              className="icon-btn"
                              aria-label={
                                "Remove " +
                                (f?.name || "file") +
                                " from this draft"
                              }
                              onClick={() => {
                                setFiles(files.filter((x) => x !== fid));
                                setDirty(true);
                              }}
                            >
                              <XIcon />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Field
                      label="Links to your work"
                      hint="One http or https link per line. Linked pages are not automatically fetched."
                    >
                      <textarea
                        rows={4}
                        placeholder="https://…"
                        value={links}
                        onChange={(e) => change(setLinks, e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field
                    label="What help went into this attempt?"
                    hint="Help is part of learning. Recording it makes your progress more meaningful."
                  >
                    <select
                      value={assist}
                      onChange={(e) => change(setAssist, e.target.value)}
                      disabled={task.kind === "verification"}
                    >
                      <option value="guided">
                        I used guidance or learning resources
                      </option>
                      <option value="external">
                        I used help from another person or AI
                      </option>
                      <option value="independent">
                        I completed this independently
                      </option>
                    </select>
                  </Field>
                  {task.kind === "verification" && (
                    <div className="gentle-note">
                      <Lock size={17} />
                      This is a new transfer challenge. Submit independently;
                      use guided practice if you need substantive help. We can’t
                      observe activity outside this workspace.
                    </div>
                  )}
                  <div className="save-actions">
                    <Button
                      variant="secondary"
                      disabled={busy || uploading}
                      onClick={() => save(false)}
                    >
                      <Save size={16} />
                      Save draft
                    </Button>
                    <Button
                      disabled={busy || uploading}
                      onClick={() => save(true)}
                    >
                      Submit this version <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="feedback-pane">
                  {!latest ? (
                    <Empty
                      icon={Sparkles}
                      title="First, give it a try."
                      action={
                        <Button onClick={() => setTab("work")}>
                          Start my attempt <ArrowRight size={16} />
                        </Button>
                      }
                    >
                      Feedback starts with your actual work. You don’t have to
                      make it perfect.
                    </Empty>
                  ) : (
                    <>
                      <div className="submission-celebration">
                        <span>
                          <CheckCircle2 size={25} />
                        </span>
                        <div>
                          <span className="eyebrow">
                            YOU MADE SOMETHING REAL
                          </span>
                          <h3>One attempt. More to build on.</h3>
                          <p>
                            Version {latest.version} is saved with your
                            explanation and assistance record. That’s a tangible
                            step forward.
                          </p>
                        </div>
                      </div>
                      {feedback ? (
                        <Feedback result={feedback} assessment={assessment} />
                      ) : (
                        <div className="assessment-empty">
                          <h3>Your work is ready for a closer look.</h3>
                          <p>
                            The Agent can highlight specific strengths, explain
                            gaps, and suggest a useful next step. Your work
                            stays saved if guidance isn’t connected yet.
                          </p>
                          <Button
                            disabled={aiBusy}
                            onClick={() =>
                              ai("evaluate", {
                                taskId: task.id,
                                attemptId: latest.id,
                              })
                            }
                          >
                            <Sparkles size={16} />
                            Find my strengths & next steps
                          </Button>
                        </div>
                      )}
                      <div className="feedback-actions">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setContent(latest.content);
                            setExplanation(latest.explanation);
                            setLinks(parse(latest.links, []).join("\n"));
                            setFiles(parse(latest.file_ids, []));
                            setDraftId("");
                            setRevision(1);
                            setDirty(true);
                            setTab("work");
                          }}
                        >
                          <RefreshCw size={16} />
                          Build on this attempt
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            action(
                              () =>
                                api(
                                  "/portfolio",
                                  json("POST", { attemptId: latest.id }),
                                ),
                              "Your project has a place in your portfolio. A piece of your progress, kept.",
                            )
                          }
                        >
                          <FolderOpen size={16} />
                          Keep in my portfolio
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setReflection(true)}
                        >
                          <Heart size={16} />
                          Notice my progress
                        </Button>
                      </div>
                      <div className="real-world-feedback">
                        <div>
                          <Users size={23} />
                          <span>
                            <h3>Learning happens beyond this screen.</h3>
                            <p>
                              Bring feedback from a mentor, a kitchen, a
                              workplace or someone who saw your practice.
                            </p>
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => setExternal(true)}
                        >
                          Add real-world feedback <Plus size={15} />
                        </Button>
                      </div>
                      {bundle.external_feedback
                        ?.filter((f: R) => f.task_id === task.id)
                        .map((f: R) => (
                          <div className="external-review" key={f.id}>
                            <Badge>
                              Reported by learner · identity not authenticated
                            </Badge>
                            <h4>
                              {f.reviewer} · {f.role}
                            </h4>
                            <p>{f.feedback}</p>
                            <small>
                              {f.context} · {date(f.created_at)}
                            </small>
                          </div>
                        ))}
                      {bundle.events
                        .filter(
                          (e: R) =>
                            e.kind === "reflection_saved" &&
                            parse(e.data).taskId === task.id,
                        )
                        .map((e: R) => (
                          <div className="reflection-card" key={e.id}>
                            <Heart size={19} />
                            <div>
                              <strong>Something I can see more clearly</strong>
                              <p>{parse(e.data).learned}</p>
                              {parse(e.data).next && (
                                <small>
                                  Next, I want to: {parse(e.data).next}
                                </small>
                              )}
                            </div>
                          </div>
                        ))}
                      {feedback && (
                        <div className="next-learning-actions">
                          <h3>Where would you like to go from here?</h3>
                          <p>
                            A little focused practice, or a new context to see
                            what you can do independently.
                          </p>
                          <div className="inline-actions">
                            <Button
                              disabled={aiBusy}
                              onClick={() =>
                                ai("adapt", {
                                  taskId: task.id,
                                  attemptId: latest.id,
                                }).then((r) => {
                                  if (r) setTab("brief");
                                })
                              }
                            >
                              <Lightbulb size={16} />
                              Shape my next practice
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={aiBusy}
                              onClick={() =>
                                ai("verify", { taskId: task.id }).then((r) => {
                                  if (r) setTab("brief");
                                })
                              }
                            >
                              <Shield size={16} />
                              Try independently
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
            <AgentPanel task={task} onWork={() => setTab("work")} />
          </div>
        </>
      )}
      {taskEditor && <TaskEditor onClose={() => setTaskEditor(false)} />}{" "}
      {history && task && (
        <Modal
          title="Every attempt is part of the story."
          subtitle="Submitted versions stay unchanged. You can build a new attempt from any version."
          onClose={() => setHistory(false)}
          wide
        >
          {attempts.length ? (
            attempts.map((a: R) => (
              <div className="version-card" key={a.id}>
                <div className="card-top">
                  <h3>Version {a.version}</h3>
                  <Badge tone={a.status === "submitted" ? "teal" : "neutral"}>
                    {a.status}
                  </Badge>
                  <small>{date(a.created_at)}</small>
                </div>
                <pre>{a.content}</pre>
                <p>
                  <strong>Your reasoning:</strong> {a.explanation}
                </p>
                <p className="small-text">
                  Assistance: {parse(a.assistance).declared} ·{" "}
                  {parse(a.assistance).platform_hints} in-platform hints
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setContent(a.content);
                    setExplanation(a.explanation);
                    setLinks(parse(a.links, []).join("\n"));
                    setFiles(parse(a.file_ids, []));
                    setDraftId(a.status === "draft" ? a.id : "");
                    setRevision(a.status === "draft" ? a.revision : 1);
                    setDirty(true);
                    setHistory(false);
                    setTab("work");
                  }}
                >
                  Build from this version <ArrowRight size={15} />
                </Button>
              </div>
            ))
          ) : (
            <p>Your first attempt belongs here whenever you’re ready.</p>
          )}
        </Modal>
      )}
      {external && task && (
        <ExternalFeedback task={task} onClose={() => setExternal(false)} />
      )}{" "}
      {reflection && task && (
        <Reflection task={task} onClose={() => setReflection(false)} />
      )}{" "}
      {ide && task && (
        <IdeConnect
          task={task}
          onClose={() => setIde(false)}
          onImport={(source: string) => {
            change(setContent, source);
            setKind("code");
            setTab("work");
            setIde(false);
            toast(
              "Your chosen code snapshot is in your draft. Save it before asking for guidance.",
            );
          }}
        />
      )}
    </>
  );
}
function XIcon() {
  return <span aria-hidden="true">×</span>;
}
function AgentPanel({ task, onWork }: { task: R; onWork: () => void }) {
  const { data, bundle, ai, aiBusy } = useApp();
  const [question, setQuestion] = useState(""),
    [level, setLevel] = useState(1);
  const hints = (bundle?.hints || [])
    .filter((h: R) => h.task_id === task.id)
    .slice()
    .reverse();
  return (
    <aside className="agent-panel">
      <div className="agent-head">
        <span className="agent-mark">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>Your learning companion</strong>
          <small>
            <i className={data!.services.ai ? "connected" : ""} />
            {data!.services.ai ? "Here to help you think" : "Not connected yet"}
          </small>
        </div>
        <Badge>kleos</Badge>
      </div>
      {task.kind === "verification" ? (
        <div className="independent-notice">
          <Shield size={27} />
          <h3>This moment is yours.</h3>
          <p>
            This challenge is a chance to see what you can do in a new context,
            independently.
          </p>
          <p>
            For teaching or hints, return to a guided task. You can always
            practice more before trying again.
          </p>
          <Badge tone="amber">Independent help rules</Badge>
        </div>
      ) : (
        <>
          <div className="agent-welcome">
            <span className="eyebrow">A LITTLE GUIDANCE, WHEN YOU NEED IT</span>
            <h3>
              You do the thinking.
              <br />
              You don’t have to do it alone.
            </h3>
            <p>
              Bring a question, a confusing result, or a choice you’re unsure
              about. Your actual work gives the conversation context.
            </p>
          </div>
          {!data!.services.ai && (
            <div className="agent-offline">
              <Info size={17} />
              <p>
                AI guidance isn’t connected yet. Your work, drafts and
                reflections are still saved. You can use the task resources and
                bring real-world feedback.
              </p>
            </div>
          )}
          <div className="agent-conversation">
            {hints.map((h: R) => {
              const a = parse(h.answer);
              return (
                <React.Fragment key={h.id}>
                  <div className="user-bubble">{h.question}</div>
                  <div className="agent-bubble">
                    <Badge tone="teal">Level {h.level} guidance</Badge>
                    <p>{a.answer}</p>
                    {a.decision_question && (
                      <div className="decision-question">
                        <Lightbulb size={15} />
                        {a.decision_question}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <form
            className="agent-composer"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await ai("hint", {
                taskId: task.id,
                message: question,
                level,
              });
              if (r) setQuestion("");
            }}
          >
            <label className="hint-select-label">
              How much help feels useful?
            </label>
            <div className="hint-levels">
              {["A nudge", "A concept", "A method", "Show steps"].map(
                (s, i) => (
                  <button
                    type="button"
                    className={level === i + 1 ? "active" : ""}
                    key={s}
                    onClick={() => setLevel(i + 1)}
                    title={"Level " + (i + 1) + ": " + s}
                  >
                    {i + 1}
                    <small>{s}</small>
                  </button>
                ),
              )}
            </div>
            <textarea
              aria-label="Ask for task guidance"
              placeholder="Here’s what I tried. I’m wondering why…"
              rows={4}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="agent-send-row">
              <small>Save your draft first for context.</small>
              <Button
                disabled={aiBusy || !question.trim()}
                aria-label="Ask for guidance"
              >
                <Send size={16} />
              </Button>
            </div>
          </form>
        </>
      )}
      <div className="agent-footer">
        <Shield size={14} />
        <p>
          Help is recorded as part of your learning. Asking is a useful step,
          not a setback.
        </p>
      </div>
    </aside>
  );
}
export function Feedback({
  result: r,
  assessment,
}: {
  result: R;
  assessment: R;
}) {
  return (
    <div className="assessment">
      <div className="assessment-heading">
        <Badge
          tone={
            r.verification_passed
              ? "teal"
              : r.requires_human_review
                ? "amber"
                : "neutral"
          }
        >
          {r.verification_passed
            ? "Independent evidence recorded"
            : r.requires_human_review
              ? "Qualified review needed"
              : r.is_demo
                ? "Scripted demo feedback"
                : "AI rubric feedback"}
        </Badge>
        <small>{date(assessment.created_at)}</small>
      </div>
      <h3>
        {r.is_demo
          ? "An example of specific, constructive feedback."
          : r.verification_passed
            ? "You brought your ability into a new context."
            : "Here’s what your work gives you to build on."}
      </h3>
      <p>{r.summary}</p>
      {r.strengths?.length > 0 && (
        <section>
          <h4>
            <Heart size={17} />
            Worth recognizing
          </h4>
          {r.strengths.map((s: R, i: number) => (
            <div className="strength" key={i}>
              <CheckCircle2 size={19} />
              <div>
                <strong>{s.observation}</strong>
                <blockquote>{s.quote}</blockquote>
                <p>{s.why_it_matters}</p>
              </div>
            </div>
          ))}
        </section>
      )}
      <section>
        <h4>Looking at each standard</h4>
        {r.criteria?.map((c: R) => (
          <div className="criterion" key={c.criterion_id}>
            <Badge tone={c.status === "met" ? "teal" : "neutral"}>
              {c.status === "met"
                ? "Demonstrated here"
                : c.status === "partial"
                  ? "Developing"
                  : "Not yet demonstrated"}
            </Badge>
            <p>{c.explanation}</p>
            {c.quote && <blockquote>{c.quote}</blockquote>}
          </div>
        ))}
      </section>
      {r.gaps?.length > 0 && (
        <section className="next-step-feedback">
          <h4>
            <Lightbulb size={17} />A useful place to focus
          </h4>
          <ul>
            {r.gaps.map((g: string) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p>{r.next_step}</p>
        </section>
      )}
      <details className="form-details">
        <summary>
          Evidence, checks & limits <ChevronRight size={15} />
        </summary>
        <h4>Objective checks</h4>
        {r.objective_checks?.map((c: R) => (
          <p key={c.name}>
            {c.passed === true ? "✓ " : c.passed === false ? "○ " : "— "}
            {c.name}
            {c.note ? " · " + c.note : ""}
          </p>
        ))}
        <h4>What has not yet been demonstrated</h4>
        <ul>
          {r.not_demonstrated?.map((s: string) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>{r.uncertainty}</p>
        <p>{r.domain_boundary}</p>
        <p className="small-text">
          Assistance: {r.assistance?.declared}; {r.assistance?.platform_hints}{" "}
          in-platform hints. External activity cannot be observed. This is an
          internal assessment, not an external certification.
        </p>
      </details>
    </div>
  );
}
export function TaskEditor({ onClose }: { onClose: () => void }) {
  const { bundle, goalId, action, busy, setTaskId } = useApp();
  const path = bundle!.paths[0],
    skills = bundle!.skills.filter((s: R) => s.path_id === path?.id);
  const [title, setTitle] = useState(""),
    [context, setContext] = useState(""),
    [deliverable, setDeliverable] = useState(""),
    [keys, setKeys] = useState<string[]>(skills[0] ? [skills[0].key] : []),
    [criteria, setCriteria] = useState(
      "Explain my key choices and assumptions\nShow the actual result and how I checked it",
    ),
    [minutes, setMinutes] = useState(45),
    [place, setPlace] = useState("platform"),
    [reviewer, setReviewer] = useState("ai_rubric"),
    [first, setFirst] = useState("");
  return (
    <Modal
      title="Make the next step useful."
      subtitle="A concrete project is often the best way to discover what you need to learn."
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const lines = criteria.split("\n").filter(Boolean);
          const task = {
            preparation: "Review the brief and collect appropriate materials.",
            alternative_task:
              "If a real-world opportunity is unavailable, rehearse the same skill or analyze a public example. Label any simulation clearly.",
            collaboration_rules:
              "Record my own contribution and comply with event and competition AI rules.",
            privacy_notes:
              "Use voluntary notes and permissioned evidence. No default recording or private contact information.",
            title,
            context,
            deliverable,
            skill_keys: keys,
            prerequisites: [],
            difficulty: "foundation",
            estimated_minutes: Number(minutes),
            materials: [],
            criteria: lines.map((description, i) => ({
              id: "criterion-" + (i + 1),
              description,
              evidence_required:
                "A specific excerpt, artifact, process record or real-world feedback supporting this standard.",
            })),
            submission_kind: "mixed",
            help_rules:
              "Use guidance and resources, and record the help you receive.",
            independence: "guided",
            starting_point:
              first || "Make a small first attempt and explain one decision.",
            practice_location: place,
            verification_method: reviewer,
            verification_boundary:
              reviewer === "mentor" || reviewer === "mixed"
                ? "Qualified real-world review is needed for practical performance. AI cannot verify unseen results, taste, safety or professional recognition."
                : "AI can review submitted text; it cannot verify unobserved external behavior, physical performance or formal qualifications.",
            required_evidence: [
              "Your actual work or a record of practice",
              "Your reasoning and relevant reviewer feedback",
            ],
            dimensions: {
              complexity: "A focused first task",
              support: "Guided",
              unfamiliarity: "Learner-selected context",
              synthesis: "The selected skills",
              autonomy: "Your choices, explained",
            },
          };
          const r = await action(
            () =>
              api(
                "/goals/" + goalId + "/tasks",
                json("POST", {
                  task,
                  rationale:
                    "A learner-designed task connected to the current goal.",
                  kind: "project",
                }),
              ),
            "Something real to try. Your next project is ready.",
          );
          if (r) {
            setTaskId(r.taskId);
            onClose();
          }
        }}
      >
        <Field label="Give this project a name">
          <input
            required
            minLength={3}
            maxLength={200}
            placeholder="Build, make, analyze, explain, practice…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Why is this a useful challenge?">
          <textarea
            required
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </Field>
        <Field label="What will you produce or demonstrate?">
          <textarea
            required
            rows={3}
            placeholder="A concrete artifact, practice record, performance or explanation."
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
          />
        </Field>
        <fieldset>
          <legend>Skills you’ll practice</legend>
          <div className="checkbox-row">
            {skills.map((s: R) => (
              <label key={s.key}>
                <input
                  type="checkbox"
                  checked={keys.includes(s.key)}
                  onChange={(e) =>
                    setKeys(
                      e.target.checked
                        ? [...keys, s.key]
                        : keys.filter((k) => k !== s.key),
                    )
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="What would a thoughtful attempt demonstrate?"
          hint="One concrete standard per line. This becomes the task rubric."
        >
          <textarea
            required
            rows={4}
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
        </Field>
        <div className="three-col">
          <Field label="Practice happens…">
            <select value={place} onChange={(e) => setPlace(e.target.value)}>
              <option value="platform">In my workspace</option>
              <option value="home">At home</option>
              <option value="workplace">In a workplace</option>
              <option value="professional_setting">
                In a professional setting
              </option>
              <option value="external_conversation">
                An interview or coffee chat
              </option>
              <option value="team_challenge">
                A team project or competition
              </option>
            </select>
          </Field>
          <Field label="Useful verification from…">
            <select
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            >
              <option value="ai_rubric">AI rubric feedback</option>
              <option value="mentor">Qualified real-world reviewer</option>
              <option value="mixed">AI + real-world feedback</option>
            </select>
          </Field>
          <Field label="Estimated minutes">
            <input
              type="number"
              min="5"
              max="2400"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="The first small move">
          <input
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="What can you try first?"
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep exploring
          </Button>
          <Button disabled={busy || !keys.length}>
            Create my task <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ExternalFeedback({ task, onClose }: { task: R; onClose: () => void }) {
  const { action, busy } = useApp();
  const [form, setForm] = useState({
    reviewer: "",
    role: "",
    context: "",
    feedback: "",
    evidenceUrl: "",
  });
  return (
    <Modal
      title="Bring the real world into your learning."
      subtitle="Record feedback from someone who observed, tasted, reviewed or supervised your practice."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await action(
            () => api("/tasks/" + task.id + "/feedback", json("POST", form)),
            "Real feedback, saved. A useful next practice can start here.",
          );
          if (r) onClose();
        }}
      >
        {[
          ["reviewer", "Who gave the feedback?"],
          ["role", "Their role or relationship"],
          ["context", "What did they observe?"],
          ["feedback", "What did they say?"],
          ["evidenceUrl", "Supporting link (optional)"],
        ].map(([k, l]) => (
          <Field label={l} key={k}>
            {k === "feedback" ? (
              <textarea
                required
                rows={5}
                value={(form as R)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            ) : (
              <input
                required={k !== "evidenceUrl"}
                type={k === "evidenceUrl" ? "url" : "text"}
                value={(form as R)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            )}
          </Field>
        ))}
        <p className="small-text">
          This is learner-reported feedback. The reviewer’s identity and
          credentials are not independently authenticated by Kleos.
        </p>
        <div className="modal-actions">
          <Button disabled={busy}>
            Save real-world feedback <Check size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function Reflection({ task, onClose }: { task: R; onClose: () => void }) {
  const { action, busy } = useApp();
  const [learned, setLearned] = useState(""),
    [next, setNext] = useState("");
  return (
    <Modal
      title="Pause to notice what changed."
      subtitle="Progress can be a clearer idea, a better question, or something you can do that was hard before."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await action(
            () =>
              api(
                "/tasks/" + task.id + "/reflections",
                json("POST", { learned, next }),
              ),
            "Your progress has a place in your story. Keep that with you.",
          );
          if (r) onClose();
        }}
      >
        <Field label="Something I can see more clearly now…">
          <textarea
            required
            minLength={3}
            rows={4}
            value={learned}
            onChange={(e) => setLearned(e.target.value)}
          />
        </Field>
        <Field label="One thing I’d like to try next…">
          <textarea
            rows={3}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <div className="modal-actions">
          <Button disabled={busy}>
            Keep this reflection <Heart size={16} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function IdeConnect({
  task,
  onClose,
  onImport,
}: {
  task: R;
  onClose: () => void;
  onImport: (s: string) => void;
}) {
  const [code, setCode] = useState(""),
    [files, setFiles] = useState<R[]>([]),
    [chosen, setChosen] = useState<string[]>([]),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false),
    [connected, setConnected] = useState(false);
  const [info, setInfo] = useState<R | null>(null);
  async function local(path: string, body?: R) {
    const r = await fetch("http://127.0.0.1:8765" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + code.trim(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const d: any = await r.json();
    if (!r.ok)
      throw new Error(
        d.error || "The local workspace could not complete this action.",
      );
    return d;
  }
  return (
    <Modal
      title="Learn with the code you’re really writing."
      subtitle="Connect a local PyCharm, VS Code or terminal project. You choose the files; nothing is imported automatically."
      onClose={onClose}
      wide
    >
      <div className="ide-intro">
        <span>
          <Terminal size={27} />
        </span>
        <div>
          <h3>Your IDE. Your project. Your control.</h3>
          <p>
            The companion reads supported source files inside the folder you
            choose. It cannot run code, install packages or access files outside
            that folder.
          </p>
        </div>
      </div>
      <ol className="setup-steps">
        <li>
          <strong>Download the local companion</strong>
          <a className="text-btn" href="/kleos_bridge.py" download>
            kleos_bridge.py <Download size={14} />
          </a>
          <small>No extra Python packages required. Python 3.10+.</small>
        </li>
        <li>
          <strong>Start it in your chosen project</strong>
          <code>
            python kleos_bridge.py --root /path/to/project --origin{" "}
            {location.origin}
          </code>
          <small>
            In PyCharm, run it in Terminal or configure it as an External Tool.
            A temporary pairing code is printed locally.
          </small>
        </li>
        <li>
          <strong>Pair this browser session</strong>
          <div className="pairing-row">
            <input
              aria-label="Local IDE pairing code"
              type="password"
              autoComplete="off"
              placeholder="Paste the code from your local terminal"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              disabled={!code.trim() || working}
              onClick={async () => {
                setWorking(true);
                setError("");
                try {
                  const d = await local("/files");
                  setFiles(d.files);
                  setInfo(d);
                  setConnected(true);
                } catch (e) {
                  setError(
                    (e as Error).message +
                      " Make sure the companion is running. Your browser may ask for local-network access.",
                  );
                } finally {
                  setWorking(false);
                }
              }}
            >
              <Plug size={16} />
              Connect
            </Button>
          </div>
        </li>
      </ol>
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}
      {connected && (
        <>
          <div className="connection-row">
            <span className="connection-dot ready" />
            <strong>{info?.project || "Local project"} is connected</strong>
            <Badge tone="teal">Loopback only</Badge>
          </div>
          <div className="ide-files">
            {files.length ? (
              files.map((f) => (
                <label className="check-label" key={f.path}>
                  <input
                    type="checkbox"
                    checked={chosen.includes(f.path)}
                    onChange={(e) =>
                      setChosen(
                        e.target.checked
                          ? [...chosen, f.path]
                          : chosen.filter((x) => x !== f.path),
                      )
                    }
                  />
                  <FileCode2 size={16} />
                  <strong>{f.path}</strong>
                  <small>{bytes(f.size)}</small>
                </label>
              ))
            ) : (
              <p>No supported source files found in the selected folder.</p>
            )}
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={async () => {
                setError("");
                try {
                  await local("/task", {
                    task: {
                      id: task.id,
                      title: task.title,
                      spec: parse(task.spec),
                    },
                  });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Save this task to my project
            </Button>
            <Button
              disabled={!chosen.length || working}
              onClick={async () => {
                setWorking(true);
                setError("");
                try {
                  const d = await local("/snapshot", { paths: chosen });
                  onImport(
                    d.files
                      .map((f: R) => "# File: " + f.path + "\n" + f.content)
                      .join("\n\n"),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setWorking(false);
                }
              }}
            >
              Import selected snapshot <ArrowRight size={16} />
            </Button>
          </div>
        </>
      )}
      <p className="small-text">
        Your pairing code stays in memory for this dialog and is never sent to
        the Kleos server. Importing a snapshot adds the selected code to your
        task draft; you can review it before saving or requesting AI guidance.
        Hosted code execution is not configured.
      </p>
    </Modal>
  );
}
