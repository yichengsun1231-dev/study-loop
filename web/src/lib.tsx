import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  X,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  Sparkles,
} from "lucide-react";
export type R = Record<string, any>;
export const parse = (s: any, f: any = {}) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : (s ?? f);
  } catch {
    return f;
  }
};
export const date = (s: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(s),
  );
export const bytes = (n: number) =>
  n < 1048576 ? Math.round(n / 1024) + " KB" : (n / 1048576).toFixed(1) + " MB";
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const r = await fetch("/api" + path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const data: any = await r.json();
  if (!r.ok)
    throw new ApiError(
      data.error?.code || "ERROR",
      data.error?.message || "Please try again.",
      r.status,
    );
  return data;
}
export const json = (method: string, body: any) => ({
  method,
  body: JSON.stringify(body),
});
type AppState = {
  data: R | null;
  bundle: R | null;
  goalId: string;
  view: string;
  taskId: string;
  setTaskId: (id: string) => void;
  setGoal: (id: string) => void;
  nav: (view: string) => void;
  refresh: () => Promise<void>;
  action: (fn: () => Promise<any>, message?: string) => Promise<any>;
  ai: (kind: string, options?: R) => Promise<any>;
  aiBusy: boolean;
  aiStatus: string;
  cancelAI: () => void;
  busy: boolean;
  toast: (message: string) => void;
  newGoal: (starter?: R) => void;
};
export const AppContext = createContext<AppState>(null!);
export const useApp = () => useContext(AppContext);
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Empty({
  icon: Icon = Sparkles,
  title,
  children,
  action,
}: {
  icon?: any;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const fieldId = React.useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            id: fieldId,
          })
        : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const node = ref.current;
    node?.querySelector<HTMLElement>("input,textarea,button,select")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && node) {
        const els = [
          ...node.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,textarea,select,a[href]",
          ),
        ];
        if (!els.length) return;
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="modal-heading">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function SectionHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <Loader2 className="spin" size={24} />
      <span>Getting your learning space ready…</span>
    </div>
  );
}
export function Steps({ stage }: { stage: string }) {
  const stages = [
    "discover",
    "map",
    "assign",
    "teach",
    "monitor",
    "adapt",
    "verify",
  ];
  const current = stages.indexOf(stage);
  return (
    <div className="loop-steps" aria-label={"Current learning stage: " + stage}>
      {stages.map((s, i) => (
        <div
          key={s}
          className={i === current ? "current" : i < current ? "past" : ""}
        >
          <span>{i < current ? <Check size={11} /> : i + 1}</span>
          <small>{s}</small>
          {i < 6 && <i />}
        </div>
      ))}
    </div>
  );
}
export function SaveButton({
  children = "Save",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { busy } = useApp();
  return (
    <Button {...props} disabled={busy || props.disabled}>
      {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}{" "}
      {children}
    </Button>
  );
}
