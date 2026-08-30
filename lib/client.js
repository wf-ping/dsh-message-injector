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

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  NS: () => NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "message-injector";
var inject = ["slots", "locale", "sessions", "settingsScope", "connection"];
var dict = {
  zh: {
    preset: "\u9884\u8BBE",
    selectPreset: "\u9009\u62E9\u9884\u8BBE\u7EC4",
    empty: "\u6682\u65E0\u5DF2\u542F\u7528\u7684\u9884\u8BBE\u7EC4",
    groupName: "\u7EC4\u540D",
    description: "\u63CF\u8FF0",
    content: "\u5185\u5BB9\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
    enabled: "\u542F\u7528",
    addGroup: "\u6DFB\u52A0\u9884\u8BBE\u7EC4",
    save: "\u4FDD\u5B58",
    reset: "\u91CD\u7F6E",
    remove: "\u5220\u9664",
    moveUp: "\u4E0A\u79FB",
    moveDown: "\u4E0B\u79FB",
    missingSkills: "\u4EE5\u4E0B\u6280\u80FD\u4E0D\u5B58\u5728\uFF0C\u6CE8\u5165\u65F6\u5C06\u8DF3\u8FC7\uFF1A",
    saveFailed: "\u4FDD\u5B58\u5931\u8D25",
    nameRequired: "\u7EC4\u540D\u4E0D\u80FD\u4E3A\u7A7A",
    nameDuplicate: "\u7EC4\u540D\u91CD\u590D",
    contentRequired: "\u5185\u5BB9\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A",
    contentHint: "\u4EE5 / \u5F00\u5934\u7684\u884C\u89C6\u4E3A\u6280\u80FD\u8C03\u7528\u5E76\u6821\u9A8C\u5B58\u5728\u6027\uFF08\u7F3A\u5931\u65F6\u6CE8\u5165\u8DF3\u8FC7\uFF09\uFF1B\u5176\u4F59\u5185\u5BB9\u539F\u6837\u6CE8\u5165\u5230\u6BCF\u6761\u6D88\u606F",
    errorHint: "\u51FA\u9519\u8BF7\u68C0\u67E5\u8F93\u5165\u540E\u91CD\u8BD5"
  },
  en: {
    preset: "Preset",
    selectPreset: "Select a preset group",
    empty: "No enabled preset groups",
    groupName: "Name",
    description: "Description",
    content: "Content (one per line)",
    enabled: "Enabled",
    addGroup: "Add preset group",
    save: "Save",
    reset: "Reset",
    remove: "Remove",
    moveUp: "Move up",
    moveDown: "Move down",
    missingSkills: "Missing skills, skipped when injecting: ",
    saveFailed: "Save failed",
    nameRequired: "Name is required",
    nameDuplicate: "Duplicate name",
    contentRequired: "At least one content line is required",
    contentHint: "Lines starting with / are treated as skill invocations and validated (missing skills are skipped); other content is injected verbatim into every message",
    errorHint: "Check the input and retry"
  }
};
var CSS = `
.psi-trigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.psi-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.psi-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-trigger svg{width:14px;height:14px}
.psi-chevron{color:var(--dsw-alias-label-caption);transition:transform .12s}
.psi-chevron-open{transform:rotate(180deg)}
.psi-card{display:flex;flex-direction:column;gap:12px;padding:4px 0 8px}
.psi-group{display:flex;flex-direction:column;gap:6px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px}
.psi-row{display:flex;align-items:center;gap:8px}
.psi-input{flex:1;min-width:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 8px;font-size:13px;line-height:20px}
.psi-textarea{flex:1;min-width:0;min-height:64px;resize:vertical;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 8px;font-size:13px;line-height:20px;font-family:inherit}
.psi-icon-btn{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px;padding:4px;display:inline-flex;align-items:center}
.psi-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.psi-icon-btn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-check{accent-color:var(--dsw-alias-label-secondary)}
.psi-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px}
.psi-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:16px}
.psi-warn{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-caption));font-size:12px;line-height:16px}
.psi-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:16px}
.psi-actions{display:flex;gap:8px;align-items:center}
.psi-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary);border:none;border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer}
.psi-primary:hover{background:var(--dsw-alias-button-primary-hover)}
.psi-primary:disabled{opacity:.5;cursor:default}
.psi-ghost{background:0 0;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer}
.psi-ghost:hover{background:var(--dsw-alias-interactive-bg-hover)}
`;
function injectStyle(tagId, css) {
  if (typeof document === "undefined") return;
  if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-message-injector";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
injectStyle("@deepseek-ai/dsh-message-injector/PresetSelector.module.css", CSS);
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
function PresetSelector({ scope, t: tRaw }) {
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
function cloneGroup(g) {
  return { name: g.name, description: g.description, content: [...g.content], enabled: g.enabled };
}
function PresetConfigCard({ scope, fetchKnownSkillNames: fetchKnownSkillNames2, t: tRaw }) {
  const t = tRaw ?? ((k) => k);
  const snap = (0, import_react.useSyncExternalStore)(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot()
  );
  const [draft, setDraft] = (0, import_react.useState)(() => (snap.status === "ready" ? snap.value?.groups ?? [] : []).map(cloneGroup));
  const [dirty, setDirty] = (0, import_react.useState)(false);
  const [knownSkills, setKnownSkills] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (dirty) return;
    if (snap.status === "ready" && snap.value) {
      setDraft(snap.value.groups.map(cloneGroup));
    }
  }, [snap, dirty]);
  (0, import_react.useEffect)(() => {
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
  };
  const removeGroup = (i) => markDirty(draft.filter((_, j) => j !== i));
  const addGroup = () => markDirty([...draft, { name: "", description: "", content: [], enabled: true }]);
  const reset = () => {
    const s = scope.getSnapshot();
    setDraft((s.status === "ready" ? s.value?.groups ?? [] : []).map(cloneGroup));
    setDirty(false);
    setError("");
  };
  const save = async () => {
    setError("");
    const cleaned = draft.map((g) => ({
      name: g.name.trim(),
      description: g.description.trim(),
      content: normalizeContent(g.content),
      enabled: g.enabled
    }));
    const seen = /* @__PURE__ */ new Set();
    for (const g of cleaned) {
      if (g.name === "") {
        setError(t("nameRequired"));
        return;
      }
      if (seen.has(g.name)) {
        setError(`${t("nameDuplicate")}\uFF1A${g.name}`);
        return;
      }
      seen.add(g.name);
      if (g.content.length === 0) {
        setError(`${t("contentRequired")}\uFF1A${g.name}`);
        return;
      }
    }
    setSaving(true);
    try {
      await scope.set("groups", cleaned);
      setDraft(cleaned.map(cloneGroup));
      setDirty(false);
    } catch (e) {
      setError(t("saveFailed") + (e instanceof Error ? `\uFF1A${e.message}` : `\uFF1A${t("errorHint")}`));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-card", children: [
    draft.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psi-hint", children: t("empty") }),
    draft.map((g, i) => {
      const missing = knownSkills ? g.content.map((line) => line.trim()).filter((line) => isSkillLine(line) && !knownSkills.has(skillNameOf(line))) : [];
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "psi-input",
              value: g.name,
              placeholder: t("groupName"),
              onChange: (e) => patch(i, { name: e.target.value })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "psi-label", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                className: "psi-check",
                checked: g.enabled,
                onChange: (e) => patch(i, { enabled: e.target.checked })
              }
            ),
            " ",
            t("enabled")
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psi-row", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: "psi-input",
            value: g.description,
            placeholder: t("description"),
            onChange: (e) => patch(i, { description: e.target.value })
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psi-row", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            className: "psi-textarea",
            value: g.content.join("\n"),
            placeholder: t("content"),
            onChange: (e) => patch(i, { content: e.target.value.split("\n") })
          }
        ) }),
        missing.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-warn", children: [
          t("missingSkills"),
          missing.join(", ")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "psi-icon-btn", title: t("moveUp"), disabled: i === 0, onClick: () => move(i, -1), children: "\u2191" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "psi-icon-btn", title: t("moveDown"), disabled: i === draft.length - 1, onClick: () => move(i, 1), children: "\u2193" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "psi-icon-btn", title: t("remove"), onClick: () => removeGroup(i), children: "\u2715" })
        ] })
      ] }, i);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "psi-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "psi-ghost", onClick: addGroup, children: [
        "+ ",
        t("addGroup")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "psi-ghost", onClick: reset, disabled: saving, children: t("reset") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "psi-primary", onClick: () => void save(), disabled: saving, children: saving ? "\u2026" : t("save") })
    ] }),
    error !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psi-error", children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "psi-hint", children: t("contentHint") })
  ] });
}
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
function apply(ctx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), "message-injector: dictionaries");
    const scope = ctx.settingsScope.bind({ namespace: NS });
    ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
      name: "conversation.input.left",
      id: "message-injector-preset-selector",
      order: 100,
      locale: NS,
      inject: () => ({ scope })
    }, PresetSelector));
    ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
      name: "settings.plugin.item",
      key: NS,
      locale: NS,
      inject: () => ({
        scope,
        fetchKnownSkillNames: () => {
          const sessionId = ctx.sessions.list.getSnapshot().current;
          if (!sessionId) return Promise.resolve(null);
          return fetchKnownSkillNames(ctx, sessionId);
        }
      })
    }, PresetConfigCard));
    ctx.effect(() => {
      const timer = setInterval(() => {
        void tick(ctx, scope);
      }, 500);
      return () => clearInterval(timer);
    }, "message-injector: auto-inject polling");
  } catch (e) {
    console.error("[dsh-message-injector] client apply FAILED:", e);
    throw e;
  }
}

		return module.exports;
	}
});
