window.__ModuleLoader__.load({
	id: "dsh-message-injector",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  ENTRY_ID: () => ENTRY_ID,
  NS: () => NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/locales/index.ts
var dict = {
  zh: {
    preset: "\u9884\u8BBE",
    selectPreset: "\u9009\u62E9\u9884\u8BBE\u7EC4",
    openSettings: "\u914D\u7F6E",
    empty: "\u6682\u65E0\u5DF2\u542F\u7528\u7684\u9884\u8BBE\u7EC4",
    groupName: "\u7EC4\u540D",
    description: "\u63CF\u8FF0",
    content: "\u5185\u5BB9\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
    enabled: "\u542F\u7528",
    addGroup: "\u6DFB\u52A0\u9884\u8BBE\u7EC4",
    save: "\u4FDD\u5B58",
    remove: "\u5220\u9664",
    moveUp: "\u4E0A\u79FB",
    moveDown: "\u4E0B\u79FB",
    missingSkills: "\u4EE5\u4E0B\u6280\u80FD\u4E0D\u5B58\u5728\uFF0C\u6CE8\u5165\u65F6\u5C06\u8DF3\u8FC7\uFF1A",
    saveFailed: "\u4FDD\u5B58\u5931\u8D25",
    nameRequired: "\u7EC4\u540D\u4E0D\u80FD\u4E3A\u7A7A",
    nameDuplicate: "\u7EC4\u540D\u91CD\u590D",
    contentRequired: "\u5185\u5BB9\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A",
    errorHint: "\u51FA\u9519\u8BF7\u68C0\u67E5\u8F93\u5165\u540E\u91CD\u8BD5",
    cardTitle: "\u6D88\u606F\u6CE8\u5165",
    cardDesc: "\u9884\u8BBE\u6CE8\u5165\u5185\u5BB9\u7EC4\u5408\uFF0C\u9009\u4E2D\u540E\u6BCF\u6761\u6D88\u606F\u81EA\u52A8\u6CE8\u5165\u8F93\u5165\u6846\u9996\u884C",
    unsaved: "\u672A\u4FDD\u5B58",
    discard: "\u653E\u5F03",
    expand: "\u5C55\u5F00",
    collapse: "\u6536\u8D77",
    close: "\u5173\u95ED"
  },
  en: {
    preset: "Preset",
    selectPreset: "Select a preset group",
    openSettings: "Configure",
    empty: "No enabled preset groups",
    groupName: "Name",
    description: "Description",
    content: "Content (one per line)",
    enabled: "Enabled",
    addGroup: "Add preset group",
    save: "Save",
    remove: "Remove",
    moveUp: "Move up",
    moveDown: "Move down",
    missingSkills: "Missing skills, skipped when injecting: ",
    saveFailed: "Save failed",
    nameRequired: "Name is required",
    nameDuplicate: "Duplicate name",
    contentRequired: "At least one content line is required",
    errorHint: "Check the input and retry",
    cardTitle: "Message Injector",
    cardDesc: "Preset content combos; the active one is injected into the input first line on every message",
    unsaved: "Unsaved",
    discard: "Discard",
    expand: "Expand",
    collapse: "Collapse",
    close: "Close"
  }
};

// src/client/utils/signal.ts
function createOneShotSignal() {
  let pending = false;
  const listeners = /* @__PURE__ */ new Set();
  return {
    request() {
      pending = true;
      for (const fn of listeners) fn();
    },
    consumePending() {
      if (!pending) return false;
      pending = false;
      return true;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }
  };
}

// src/client/utils/settings.ts
function openPluginPage(ctx, packageName) {
  try {
    const nav = ctx.reflect.get("pluginNavigation");
    nav?.openBundle(packageName);
  } catch {
  }
}

// src/client/utils/form.ts
function configFormsOf(ctx) {
  try {
    const fromGet = ctx.get("configForms");
    if (fromGet && typeof fromGet.get === "function") return fromGet;
    const fromReflect = ctx.reflect?.get("configForms");
    if (fromReflect && typeof fromReflect.get === "function") return fromReflect;
  } catch {
  }
  return void 0;
}
var LOCAL_KEY = "dsh-message-injector:config";
function createLocalForm() {
  const listeners = /* @__PURE__ */ new Set();
  let cache = read();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== null && event.key !== LOCAL_KEY) return;
      cache = read();
      emit();
    });
  }
  return {
    getSnapshot: () => ({
      status: "ready",
      value: cache,
      writable: true,
      revision: 0
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mutate: async (ops) => {
      let next = cache;
      for (const op of ops) {
        if (op.path.length !== 1) continue;
        const field = op.path[0];
        if (op.op === "unset") next = { ...next };
        else next = { ...next, [field]: op.value };
      }
      cache = normalize(next);
      write(cache);
      emit();
      return true;
    }
  };
}
function read() {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(LOCAL_KEY);
    return normalize(raw === null ? void 0 : JSON.parse(raw));
  } catch {
    return { groups: [], selected: "" };
  }
}
function write(config) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LOCAL_KEY, JSON.stringify(config));
  } catch {
  }
}
function normalize(value) {
  const source = value ?? {};
  const groups = Array.isArray(source.groups) ? source.groups.flatMap((item) => {
    const group = item ?? {};
    if (typeof group.name !== "string") return [];
    return [{
      name: group.name,
      description: typeof group.description === "string" ? group.description : "",
      content: Array.isArray(group.content) ? group.content.filter((line) => typeof line === "string") : [],
      enabled: group.enabled !== false
    }];
  }) : [];
  return { groups, selected: typeof source.selected === "string" ? source.selected : "" };
}
function pickForm(ctx) {
  const forms = configFormsOf(ctx);
  if (forms) {
    try {
      return { form: forms.get("dsh-message-injector"), remote: true, forms };
    } catch {
    }
  }
  return { form: createLocalForm(), remote: false };
}
function scopeOf(form) {
  let lastRaw;
  let lastWrapped;
  return {
    getSnapshot: () => {
      const snap = form.getSnapshot();
      if (snap !== lastRaw || lastWrapped === void 0) {
        lastRaw = snap;
        lastWrapped = { status: snap.status, value: snap.value };
      }
      return lastWrapped;
    },
    subscribe: (listener) => form.subscribe(listener),
    set: async (field, value) => {
      const accepted = await form.mutate([{ op: "set", path: [field], value }]);
      if (!accepted) throw new Error("\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u5199\u5165\uFF08\u914D\u7F6E\u53EF\u80FD\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF09");
    }
  };
}
function keepSelectionValid(form) {
  const check = () => {
    const snap = form.getSnapshot();
    const config = snap.value;
    if (snap.status !== "ready" || !config || config.selected === "") return;
    const target = config.groups.find((group) => group.name === config.selected);
    if (target && target.enabled) return;
    void form.mutate([{ op: "set", path: ["selected"], value: "" }]).catch(() => {
    });
  };
  check();
  return form.subscribe(check);
}

// src/client/api/skills.ts
var skillsCache = null;
async function fetchKnownSkillNames(ctx, sessionId) {
  const now = Date.now();
  if (skillsCache && skillsCache.sessionId === sessionId && now - skillsCache.at < 3e4) {
    return skillsCache.names;
  }
  try {
    const connection = ctx.get("connection");
    if (!connection) return null;
    const res = await connection.api.skills.list({ sessionId });
    const list = res?.value?.skills;
    if (!Array.isArray(list)) return null;
    const names = /* @__PURE__ */ new Set();
    for (const sk of list) {
      if (sk && typeof sk.name === "string" && sk.name !== "") names.add(sk.name);
    }
    skillsCache = { sessionId, names, at: now };
    return names;
  } catch {
    return null;
  }
}

// src/client/logic/index.ts
function normalizeContent(raw) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const r of raw) {
    const line = r.trim();
    if (line === "" || seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}
function isSkillLine(line) {
  return line.startsWith("/") && line.length > 1;
}
function skillNameOf(line) {
  return line.replace(/^\//, "");
}
function cloneGroup(g) {
  return { name: g.name, description: g.description, content: [...g.content], enabled: g.enabled };
}

// src/client/services/injector.ts
function startAutoInject(ctx, scope) {
  const timer = setInterval(() => {
    void tick(ctx, scope);
  }, 500);
  return () => clearInterval(timer);
}
async function tick(ctx, scope) {
  const snap = scope.getSnapshot();
  if (snap.status !== "ready" || !snap.value) return;
  const { groups, selected } = snap.value;
  if (selected === "") return;
  const group = groups.find((g) => g.name === selected);
  if (!group || !group.enabled) return;
  const sessions = ctx.get("sessions");
  if (!sessions) return;
  const sessionId = sessions.list.getSnapshot().current;
  if (!sessionId) return;
  const actx = sessions.scope(sessionId);
  if (!actx) return;
  const conversation = actx.get("conversation");
  const input = conversation?.input?.for(actx);
  if (!input) return;
  const s = input.state.getSnapshot();
  if (s.phase !== "plain") return;
  if (s.draft.trim() !== "") return;
  if (typeof document !== "undefined") {
    const ta = document.querySelector("[data-input-scroll] textarea");
    if (ta && ta.value.trim() !== "") return;
  }
  let lines = normalizeContent(group.content);
  if (lines.length === 0) return;
  const known = await fetchKnownSkillNames(ctx, sessionId);
  if (known) {
    lines = lines.filter((line) => !isSkillLine(line) || known.has(skillNameOf(line)));
  }
  if (lines.length === 0) return;
  input.setDraft(lines.join(" ") + " ");
}

// src/client/components/PresetSelector.tsx
var import_react5 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/utils/css.ts
function injectStyle(tagId, css) {
  if (typeof document === "undefined") return;
  if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-message-injector";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}

// src/client/components/icons.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function Icon({ className, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      className,
      viewBox: "0 0 16 16",
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children
    }
  );
}
function ChevronDownIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 6.5 8 10.5 12 6.5" }) });
}
function ChevronUpIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 9.5 8 5.5 12 9.5" }) });
}
function TrashIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2h5.8l.6-8.2M6.8 7v3.2M9.2 7v3.2" }) });
}
function SettingsIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Icon, { className, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "2.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 2v1.6M8 12.4V14M2 8h1.6M12.4 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1" })
  ] });
}
function SkillIcon({ className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 2.5 9.4 6.6 13.5 8 9.4 9.4 8 13.5 6.6 9.4 2.5 8 6.6 6.6Z" }) });
}

// src/client/components/PresetDialog.tsx
var import_react4 = require("react");
var import_react_dom = require("react-dom");

// src/client/components/PresetConfigCard.tsx
var import_react3 = require("react");

// src/client/components/ConfigCard.tsx
var import_react2 = require("react");

// src/client/utils/scroll.ts
var import_react = require("react");
function findScrollContainer(el) {
  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}
function scrollElementIntoView(el, opts = {}) {
  const { pad = 8, align = "start" } = opts;
  const container = findScrollContainer(el);
  if (!container) {
    el.scrollIntoView({ block: align === "nearest" ? "nearest" : "start" });
    return;
  }
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  if (er.top >= cr.top && er.bottom <= cr.bottom) return;
  if (align === "center") {
    container.scrollTop += er.top - cr.top - (cr.height - er.height) / 2;
  } else if (align === "nearest") {
    if (er.top < cr.top) container.scrollTop += er.top - cr.top - pad;
    else if (er.bottom > cr.bottom) container.scrollTop += er.bottom - cr.bottom + pad;
  } else {
    container.scrollTop += er.top - cr.top - pad;
  }
}
function useReveal(open, when, opts) {
  const ref = (0, import_react.useRef)(null);
  const prev = (0, import_react.useRef)({ open, when });
  (0, import_react.useEffect)(() => {
    const wasWhen = prev.current.when;
    prev.current = { open, when };
    if (when && !wasWhen && open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) scrollElementIntoView(ref.current, opts);
        });
      });
    }
  }, [open, when]);
  return ref;
}

// src/client/components/ConfigCard.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var CSS = `
.psi-shell{list-style:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;transition:border-color .16s,background .16s}
.psi-shell:hover{border-color:var(--dsw-alias-label-dimmed)}
.psi-shellOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.psi-shellHeader{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.psi-shellHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.psi-shellHeadText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.psi-shellName{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.psi-shellDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.psi-shellChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.psi-shellChevronOpen{transform:rotate(180deg)}
.psi-shellPending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}
.psi-shellBody{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
.psi-shellFooter{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
.psi-shellFailed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
.psi-shellDiscard,.psi-shellSave{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.psi-shellDiscard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
.psi-shellDiscard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.psi-shellSave{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.psi-shellDiscard:disabled,.psi-shellSave:disabled{opacity:.4;cursor:default}
.psi-shellDiscard:focus-visible,.psi-shellSave:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.psi-field+.psi-field{border-top:1px solid var(--dsw-alias-border-l2)}
.psi-head{align-items:center;gap:8px;display:flex}
.psi-label{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.psi-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.psi-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.psi-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.psi-inputInvalid{border-color:var(--dsw-alias-label-error)}
.psi-textarea{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:13px;line-height:1.5;min-height:64px;resize:vertical}
.psi-textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.psi-check{accent-color:var(--dsw-alias-label-secondary)}
.psi-checkLabel{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;cursor:pointer;white-space:nowrap}
.psi-iconBtn{appearance:none;font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px;display:inline-flex;align-items:center}
.psi-iconBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-iconBtn:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.psi-iconBtn svg{width:14px;height:14px}
.psi-add{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.psi-add:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.psi-addRow{align-items:flex-start}
.psi-warn{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-caption));margin:0;font-size:12px;line-height:1.5}
.psi-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.psi-invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
`;
injectStyle("@deepseek-ai/dsh-message-injector/ConfigCard.module.css", CSS);
var DEFAULT_LABELS = {
  save: "Save",
  discard: "Discard",
  unsaved: "Unsaved",
  expand: "Expand",
  collapse: "Collapse"
};
function ConfigCard(props) {
  const {
    title,
    description,
    children,
    dirty,
    saving,
    invalid = false,
    failed = "",
    onSave,
    onDiscard,
    labels,
    expandSignal,
    revealOnExpand = true,
    defaultOpen = false
  } = props;
  const t = (key) => labels?.[key] ?? DEFAULT_LABELS[key];
  const [open, setOpen] = (0, import_react2.useState)(defaultOpen);
  const [autoReveal, setAutoReveal] = (0, import_react2.useState)(false);
  const shellRef = useReveal(open, autoReveal);
  (0, import_react2.useEffect)(() => {
    if (!expandSignal) return;
    if (expandSignal.consumePending()) {
      setOpen(true);
      if (revealOnExpand) setAutoReveal(true);
    }
    return expandSignal.subscribe(() => {
      setOpen(true);
      if (revealOnExpand) setAutoReveal(true);
    });
  }, [expandSignal]);
  (0, import_react2.useEffect)(() => {
    if (autoReveal) setAutoReveal(false);
  }, [autoReveal]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { ref: shellRef, className: "psi-shell" + (open ? " psi-shellOpen" : ""), children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        className: "psi-shellHeader",
        "aria-expanded": open,
        "aria-label": `${t(open ? "collapse" : "expand")}\uFF1A${title}`,
        onClick: () => setOpen(!open),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "psi-shellHeadText", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "psi-shellName", children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "psi-shellDesc", children: description })
          ] }),
          dirty && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "psi-shellPending", children: t("unsaved") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronDownIcon, { className: "psi-shellChevron" + (open ? " psi-shellChevronOpen" : "") })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "psi-shellBody", children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "psi-shellFooter", children: [
        failed !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "psi-shellFailed", role: "status", children: failed }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "psi-shellDiscard", disabled: !dirty || saving, onClick: onDiscard, children: t("discard") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "psi-shellSave", disabled: !dirty || saving || invalid, onClick: onSave, children: saving ? "\u2026" : t("save") })
      ] })
    ] })
  ] });
}

// src/client/components/PresetConfigCard.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var CSS2 = `
.psi-group{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.psi-group+.psi-group{border-top:1px solid var(--dsw-alias-border-l2)}
.psi-groupHead{align-items:center;gap:8px;display:flex}
.psi-groupToggle{appearance:none;min-width:0;flex:1;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px 6px;align-items:center;gap:8px;display:flex}
.psi-groupToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}
.psi-groupToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-groupName{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.psi-groupNameEmpty{color:var(--dsw-alias-label-tertiary)}
.psi-groupChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.psi-groupChevronOpen{transform:rotate(180deg)}
.psi-groupBody{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;margin-top:6px;padding-top:10px;display:flex}
.psi-groupField{flex-direction:column;gap:6px;display:flex}
.psi-groupField+.psi-groupField{border-top:1px solid var(--dsw-alias-border-l2);padding-top:8px}
`;
injectStyle("@deepseek-ai/dsh-message-injector/PresetConfigCard.module.css", CSS2);
function PresetConfigCard({ scope, fetchKnownSkillNames: fetchKnownSkillNames2, t: tRaw, expandSignal }) {
  const t = tRaw ?? ((k) => k);
  const snap = (0, import_react3.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [draft, setDraft] = (0, import_react3.useState)(() => (snap.status === "ready" ? snap.value?.groups ?? [] : []).map(cloneGroup));
  const [dirty, setDirty] = (0, import_react3.useState)(false);
  const [knownSkills, setKnownSkills] = (0, import_react3.useState)(null);
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const [failed, setFailed] = (0, import_react3.useState)("");
  const [openMap, setOpenMap] = (0, import_react3.useState)({});
  (0, import_react3.useEffect)(() => {
    if (dirty) return;
    if (snap.status === "ready" && snap.value) {
      setDraft(snap.value.groups.map(cloneGroup));
      setOpenMap({});
    }
  }, [snap, dirty]);
  (0, import_react3.useEffect)(() => {
    let cancelled = false;
    void fetchKnownSkillNames2().then((names) => {
      if (!cancelled) setKnownSkills(names);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKnownSkillNames2]);
  const markDirty = (next) => {
    setDraft(next);
    setDirty(true);
  };
  const patch = (i, p) => markDirty(draft.map((g, j) => j === i ? { ...g, ...p } : g));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    const copy = draft.slice();
    const [g] = copy.splice(i, 1);
    copy.splice(j, 0, g);
    markDirty(copy);
    setOpenMap((m) => {
      const next = { ...m };
      const a = next[i] ?? false;
      const b = next[j] ?? false;
      next[i] = b;
      next[j] = a;
      return next;
    });
  };
  const removeGroup = (i) => {
    markDirty(draft.filter((_, j) => j !== i));
    setOpenMap((m) => {
      const next = {};
      for (const [k, v] of Object.entries(m)) {
        const n = Number(k);
        if (n === i) continue;
        next[n > i ? n - 1 : n] = v;
      }
      return next;
    });
  };
  const toggleGroup = (i) => setOpenMap((m) => ({ ...m, [i]: !(m[i] ?? false) }));
  const addGroup = () => {
    markDirty([{ name: "", description: "", content: [], enabled: true }, ...draft]);
    setOpenMap((m) => {
      const next = { 0: true };
      for (const [k, v] of Object.entries(m)) next[Number(k) + 1] = v;
      return next;
    });
    revealFirstGroup();
  };
  const revealFirstGroup = () => {
    if (typeof document === "undefined") return;
    requestAnimationFrame(() => {
      const el = document.querySelector(".psi-group");
      if (el) scrollElementIntoView(el);
    });
  };
  const discard = () => {
    const s = scope.getSnapshot();
    setDraft((s.status === "ready" ? s.value?.groups ?? [] : []).map(cloneGroup));
    setDirty(false);
    setFailed("");
  };
  const nameError = (g, i) => {
    const name = g.name.trim();
    if (name === "") return t("nameRequired");
    if (draft.some((h, j) => j !== i && h.name.trim() === name)) return `${t("nameDuplicate")}\uFF1A${name}`;
    return "";
  };
  const contentError = (g) => normalizeContent(g.content).length === 0 ? t("contentRequired") : "";
  const invalid = draft.some((g, i) => nameError(g, i) !== "" || contentError(g) !== "");
  const save = async () => {
    setFailed("");
    const cleaned = draft.map((g) => ({
      name: g.name.trim(),
      description: g.description.trim(),
      content: normalizeContent(g.content),
      enabled: g.enabled
    }));
    setSaving(true);
    try {
      await scope.set("groups", cleaned);
      setDraft(cleaned.map(cloneGroup));
      setDirty(false);
    } catch (e) {
      setFailed(t("saveFailed") + (e instanceof Error ? `\uFF1A${e.message}` : `\uFF1A${t("errorHint")}`));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    ConfigCard,
    {
      title: t("cardTitle"),
      description: t("cardDesc"),
      dirty,
      saving,
      invalid,
      failed,
      onSave: () => void save(),
      onDiscard: discard,
      labels: {
        save: t("save"),
        discard: t("discard"),
        unsaved: t("unsaved"),
        expand: t("expand"),
        collapse: t("collapse")
      },
      expandSignal,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "psi-field psi-addRow", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "psi-add", onClick: addGroup, children: [
          "+ ",
          t("addGroup")
        ] }) }),
        draft.map((g, i) => {
          const nErr = nameError(g, i);
          const cErr = contentError(g);
          const isOpen = openMap[i] ?? false;
          const missing = knownSkills ? g.content.map((line) => line.trim()).filter((line) => isSkillLine(line) && !knownSkills.has(skillNameOf(line))) : [];
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-groupHead", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                "button",
                {
                  type: "button",
                  className: "psi-groupToggle",
                  "aria-expanded": isOpen,
                  "aria-label": `${t(isOpen ? "collapse" : "expand")}\uFF1A${g.name.trim() || t("groupName")}`,
                  onClick: () => toggleGroup(i),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "psi-groupName" + (g.name.trim() === "" ? " psi-groupNameEmpty" : ""), children: g.name.trim() || t("groupName") }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronDownIcon, { className: "psi-groupChevron" + (isOpen ? " psi-groupChevronOpen" : "") })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "psi-checkLabel", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    className: "psi-check",
                    checked: g.enabled,
                    onChange: (e) => patch(i, { enabled: e.target.checked })
                  }
                ),
                t("enabled")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("moveUp"), disabled: i === 0, onClick: () => move(i, -1), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronUpIcon, {}) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("moveDown"), disabled: i === draft.length - 1, onClick: () => move(i, 1), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ChevronDownIcon, {}) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("remove"), onClick: () => removeGroup(i), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TrashIcon, {}) })
            ] }),
            isOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-groupBody", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-groupField", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "psi-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "psi-label", children: t("groupName") }) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    className: "psi-input" + (nErr !== "" ? " psi-inputInvalid" : ""),
                    value: g.name,
                    placeholder: t("groupName"),
                    onChange: (e) => patch(i, { name: e.target.value })
                  }
                ),
                nErr !== "" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "psi-invalid", children: nErr })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-groupField", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "psi-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "psi-label", children: t("description") }) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    className: "psi-input",
                    value: g.description,
                    placeholder: t("description"),
                    onChange: (e) => patch(i, { description: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "psi-groupField", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "psi-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "psi-label", children: t("content") }) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "textarea",
                  {
                    className: "psi-textarea" + (cErr !== "" ? " psi-inputInvalid" : ""),
                    value: g.content.join("\n"),
                    placeholder: t("content"),
                    onChange: (e) => patch(i, { content: e.target.value.split("\n") })
                  }
                ),
                cErr !== "" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "psi-invalid", children: cErr }),
                missing.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "psi-warn", children: [
                  t("missingSkills"),
                  missing.join(", ")
                ] })
              ] })
            ] })
          ] }, i);
        })
      ]
    }
  );
}

// src/client/components/PresetDialog.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var alwaysExpand = createOneShotSignal();
alwaysExpand.request();
var CSS3 = `
.psi-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.38);align-items:flex-start;justify-content:center;padding:64px 16px 24px;display:flex;overflow:auto}
.psi-dialog{width:100%;max-width:720px;max-height:calc(100vh - 96px);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.28);flex-direction:column;display:flex;overflow:hidden}
.psi-dialogHead{align-items:center;gap:8px;padding:14px 16px 10px;display:flex}
.psi-dialogTitle{flex:1;min-width:0;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.psi-dialogClose{appearance:none;cursor:pointer;background:0 0;border:0;border-radius:8px;color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;justify-content:center;width:28px;height:28px;display:inline-flex;padding:0}
.psi-dialogClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.psi-dialogClose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-dialogBody{flex-direction:column;gap:12px;padding:0 16px 16px;display:flex;overflow:auto}
.psi-dialogHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.6}
`;
injectStyle("@deepseek-ai/dsh-message-injector/PresetDialog.module.css", CSS3);
function PresetDialog({ scope, fetchKnownSkillNames: fetchKnownSkillNames2, t, onClose }) {
  (0, import_react4.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        className: "psi-overlay",
        role: "presentation",
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose();
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "psi-dialog", role: "dialog", "aria-modal": "true", "aria-label": t("cardTitle"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "psi-dialogHead", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "psi-dialogTitle", children: t("cardTitle") }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "psi-dialogClose", "aria-label": t("close"), title: t("close"), onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { "aria-hidden": "true", children: "\xD7" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "psi-dialogBody", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            PresetConfigCard,
            {
              scope,
              fetchKnownSkillNames: fetchKnownSkillNames2,
              t,
              expandSignal: alwaysExpand
            }
          ) })
        ] })
      }
    ),
    document.body
  );
}

// src/client/components/PresetSelector.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var CSS4 = `
.psi-trigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.psi-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.psi-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-trigger svg{width:14px;height:14px}
.psi-chevron{color:var(--dsw-alias-label-caption);transition:transform .12s}
.psi-chevron-open{transform:rotate(180deg)}
`;
injectStyle("@deepseek-ai/dsh-message-injector/PresetSelector.module.css", CSS4);
function PresetSelector({ scope, t: tRaw, fetchKnownSkillNames: fetchKnownSkillNames2 }) {
  const t = tRaw ?? ((k) => k);
  const snap = (0, import_react5.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [open, setOpen] = (0, import_react5.useState)(false);
  const [configOpen, setConfigOpen] = (0, import_react5.useState)(false);
  const config = snap.status === "ready" ? snap.value : void 0;
  const groups = (config?.groups ?? []).filter((g) => g.enabled);
  const selected = config?.selected ?? "";
  const current = groups.find((g) => g.name === selected);
  const items = groups.length === 0 ? [{ id: "__none__", label: t("empty"), disabled: true }] : groups.map((g) => ({ id: g.name, label: g.name }));
  const choose = (id) => {
    setOpen(false);
    if (id === "__settings__") {
      setConfigOpen(true);
      return;
    }
    if (id === "__none__") return;
    if (id === selected) {
      void scope.set("selected", "");
    } else {
      void scope.set("selected", id);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        items,
        selectedId: current ? selected : void 0,
        onSelect: choose,
        onClose: () => setOpen(false),
        side: "top",
        footer: [{ id: "__settings__", label: t("openSettings"), icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SettingsIcon, {}) }],
        anchor: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "button",
          {
            type: "button",
            className: "psi-trigger",
            "aria-label": t("selectPreset"),
            title: current?.description || t("selectPreset"),
            onClick: () => setOpen(!open),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SkillIcon, {}),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: current ? current.name : t("preset") }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChevronDownIcon, { className: "psi-chevron" + (open ? " psi-chevron-open" : "") })
            ]
          }
        )
      }
    ),
    configOpen && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      PresetDialog,
      {
        scope,
        fetchKnownSkillNames: fetchKnownSkillNames2,
        t,
        onClose: () => setConfigOpen(false)
      }
    )
  ] });
}

// src/client/index.tsx
var NS = "message-injector";
var ENTRY_ID = "dsh-message-injector";
var inject = ["slots", "locale"];
var cardExpand = createOneShotSignal();
function apply(ctx) {
  console.info("[dsh-message-injector] client loaded");
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), "message-injector: dictionaries");
    const picked = pickForm(ctx);
    const scope = scopeOf(picked.form);
    if (!picked.remote) {
      console.warn("[dsh-message-injector] configForms \u4E0D\u53EF\u7528\uFF0C\u914D\u7F6E\u6682\u5B58\u6D4F\u89C8\u5668\u672C\u5730\uFF08localStorage\uFF09");
    }
    ctx.effect(() => keepSelectionValid(picked.form), "message-injector: selection validity");
    const knownSkillNames = () => {
      try {
        const sessions = ctx.get("sessions");
        const sessionId = sessions?.list.getSnapshot().current;
        if (!sessionId) return Promise.resolve(null);
        return fetchKnownSkillNames(ctx, sessionId);
      } catch {
        return Promise.resolve(null);
      }
    };
    let selectorRegistered = false;
    ctx.slots.inject("conversation.input.left", () => {
      selectorRegistered = true;
      console.info("[dsh-message-injector] selector registered into conversation.input.left");
      return ctx.slots.register({
        name: "conversation.input.left",
        id: "message-injector-preset-selector",
        order: 100,
        locale: NS,
        inject: () => ({
          scope,
          fetchKnownSkillNames: knownSkillNames,
          onOpenSettings: () => openPluginPage(ctx, ENTRY_ID)
        })
      }, PresetSelector);
    });
    if (typeof setTimeout === "function") {
      setTimeout(() => {
        if (!selectorRegistered) {
          console.warn("[dsh-message-injector] conversation.input.left \u69FD\u4F4D 5s \u5185\u672A\u51FA\u73B0\uFF0C\u9009\u62E9\u5668\u672A\u6CE8\u518C");
        }
      }, 5e3);
    }
    const forms = picked.forms;
    if (forms?.whileServed) {
      ctx.effect(() => forms.whileServed([ENTRY_ID], () => ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
        name: "plugins.row.config",
        key: `${ENTRY_ID}#${ENTRY_ID}`,
        locale: NS,
        inject: () => ({
          scope,
          expandSignal: cardExpand,
          fetchKnownSkillNames: knownSkillNames
        })
      }, PresetConfigCard))), "message-injector: config page");
    }
    ctx.effect(() => startAutoInject(ctx, scope), "message-injector: auto-inject polling");
  } catch (e) {
    console.error("[dsh-message-injector] client apply FAILED:", e);
    throw e;
  }
}

		return module.exports;
	}
});
