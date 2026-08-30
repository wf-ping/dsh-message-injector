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
    openSettings: "\u8BBE\u7F6E",
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
    collapse: "\u6536\u8D77"
  },
  en: {
    preset: "Preset",
    selectPreset: "Select a preset group",
    openSettings: "Settings",
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
    collapse: "Collapse"
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
function findSettingsPanel() {
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  for (const d of dialogs) {
    if (d.querySelector("nav")) return d;
  }
  return null;
}
async function openSettingsSection(navLabel) {
  if (typeof document === "undefined") return;
  const trigger = document.querySelector('button[aria-haspopup="dialog"]');
  if (trigger && trigger.getAttribute("aria-expanded") !== "true") trigger.click();
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const panel = findSettingsPanel();
    if (!panel) continue;
    const nav = panel.querySelector("nav");
    if (!nav) return;
    const target = Array.from(nav.querySelectorAll("button")).find((b) => navLabel.test(b.textContent ?? ""));
    if (!target) return;
    if (target.getAttribute("aria-current") !== "true") target.click();
    return;
  }
}

// src/client/api/skills.ts
var skillsCache = null;
async function fetchKnownSkillNames(ctx, sessionId) {
  const now = Date.now();
  if (skillsCache && skillsCache.sessionId === sessionId && now - skillsCache.at < 3e4) {
    return skillsCache.names;
  }
  try {
    const res = await ctx.connection.api.skills.list({ sessionId });
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
  const sessionId = ctx.sessions.list.getSnapshot().current;
  if (!sessionId) return;
  const actx = ctx.sessions.scope(sessionId);
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
var import_react = require("react");
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

// src/client/components/PresetSelector.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var CSS = `
.psi-trigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.psi-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.psi-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-trigger svg{width:14px;height:14px}
.psi-chevron{color:var(--dsw-alias-label-caption);transition:transform .12s}
.psi-chevron-open{transform:rotate(180deg)}
`;
injectStyle("@deepseek-ai/dsh-message-injector/PresetSelector.module.css", CSS);
function PresetSelector({ scope, t: tRaw, onOpenSettings }) {
  const t = tRaw ?? ((k) => k);
  const snap = (0, import_react.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [open, setOpen] = (0, import_react.useState)(false);
  const config = snap.status === "ready" ? snap.value : void 0;
  const groups = (config?.groups ?? []).filter((g) => g.enabled);
  const selected = config?.selected ?? "";
  const current = groups.find((g) => g.name === selected);
  const items = groups.length === 0 ? [{ id: "__none__", label: t("empty"), disabled: true }] : groups.map((g) => ({ id: g.name, label: g.name }));
  const choose = (id) => {
    setOpen(false);
    if (id === "__settings__") {
      onOpenSettings();
      return;
    }
    if (id === "__none__") return;
    if (id === selected) {
      void scope.set("selected", "");
    } else {
      void scope.set("selected", id);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Menu,
    {
      open,
      items,
      selectedId: current ? selected : void 0,
      onSelect: choose,
      onClose: () => setOpen(false),
      side: "top",
      footer: [{ id: "__settings__", label: t("openSettings"), icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSettingsOutline16, {}) }],
      anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          className: "psi-trigger",
          "aria-label": t("selectPreset"),
          title: current?.description || t("selectPreset"),
          onClick: () => setOpen(!open),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSkillOutline16, {}),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: current ? current.name : t("preset") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "psi-chevron" + (open ? " psi-chevron-open" : "") })
          ]
        }
      )
    }
  );
}

// src/client/components/PresetConfigCard.tsx
var import_react4 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/components/ConfigCard.tsx
var import_react3 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/utils/scroll.ts
var import_react2 = require("react");
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
  const ref = (0, import_react2.useRef)(null);
  const prev = (0, import_react2.useRef)({ open, when });
  (0, import_react2.useEffect)(() => {
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
var CSS2 = `
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
injectStyle("@deepseek-ai/dsh-message-injector/ConfigCard.module.css", CSS2);
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
  const [open, setOpen] = (0, import_react3.useState)(defaultOpen);
  const [autoReveal, setAutoReveal] = (0, import_react3.useState)(false);
  const shellRef = useReveal(open, autoReveal);
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconChevronDownOutline14, { className: "psi-shellChevron" + (open ? " psi-shellChevronOpen" : "") })
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
var CSS3 = `
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
injectStyle("@deepseek-ai/dsh-message-injector/PresetConfigCard.module.css", CSS3);
function PresetConfigCard({ scope, fetchKnownSkillNames: fetchKnownSkillNames2, t: tRaw, expandSignal }) {
  const t = tRaw ?? ((k) => k);
  const snap = (0, import_react4.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [draft, setDraft] = (0, import_react4.useState)(() => (snap.status === "ready" ? snap.value?.groups ?? [] : []).map(cloneGroup));
  const [dirty, setDirty] = (0, import_react4.useState)(false);
  const [knownSkills, setKnownSkills] = (0, import_react4.useState)(null);
  const [saving, setSaving] = (0, import_react4.useState)(false);
  const [failed, setFailed] = (0, import_react4.useState)("");
  const [openMap, setOpenMap] = (0, import_react4.useState)({});
  (0, import_react4.useEffect)(() => {
    if (dirty) return;
    if (snap.status === "ready" && snap.value) {
      setDraft(snap.value.groups.map(cloneGroup));
      setOpenMap({});
    }
  }, [snap, dirty]);
  (0, import_react4.useEffect)(() => {
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
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconChevronDownOutline14, { className: "psi-groupChevron" + (isOpen ? " psi-groupChevronOpen" : "") })
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("moveUp"), disabled: i === 0, onClick: () => move(i, -1), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconChevronUpOutline14, {}) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("moveDown"), disabled: i === draft.length - 1, onClick: () => move(i, 1), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconChevronDownOutline14, {}) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "psi-iconBtn", title: t("remove"), onClick: () => removeGroup(i), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconTrashOutline16, {}) })
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

// src/client/index.tsx
var NS = "message-injector";
var inject = ["slots", "locale", "sessions", "settingsScope", "connection"];
var cardExpand = createOneShotSignal();
function openSettingsAndExpand() {
  cardExpand.request();
  void openSettingsSection(/插件|Plugins/);
}
function apply(ctx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), "message-injector: dictionaries");
    const scope = ctx.settingsScope.bind({ namespace: NS });
    ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
      name: "conversation.input.left",
      id: "message-injector-preset-selector",
      order: 100,
      locale: NS,
      inject: () => ({ scope, onOpenSettings: openSettingsAndExpand })
    }, PresetSelector));
    ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
      name: "settings.plugin.item",
      key: NS,
      locale: NS,
      inject: () => ({
        scope,
        expandSignal: cardExpand,
        fetchKnownSkillNames: () => {
          const sessionId = ctx.sessions.list.getSnapshot().current;
          if (!sessionId) return Promise.resolve(null);
          return fetchKnownSkillNames(ctx, sessionId);
        }
      })
    }, PresetConfigCard));
    ctx.effect(() => startAutoInject(ctx, scope), "message-injector: auto-inject polling");
  } catch (e) {
    console.error("[dsh-message-injector] client apply FAILED:", e);
    throw e;
  }
}

		return module.exports;
	}
});
