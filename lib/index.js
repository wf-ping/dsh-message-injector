// src/index.ts
import z from "@deepseek-ai/schemastery";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
var NS = settingsNamespace("skill-injector");
var presetGroupSchema = z.object({
  name: z.string().required(),
  description: z.string().default(""),
  skills: z.array(z.string()).default([]),
  enabled: z.boolean().default(true)
});
var Config = z.object({
  groups: z.array(presetGroupSchema).default([]),
  /** 当前选中组名称；空字符串 = 未选中（F3） */
  selected: z.string().default("")
});
var name = "dsh-skill-injector";
function apply(ctx) {
  let source = () => ({ groups: [], selected: "" });
  installSettingsSection(ctx, NS, Config, { groups: [], selected: "" }, {
    setSource(current) {
      source = current;
    },
    onChange() {
      const cfg = source();
      const target = cfg.groups.find((g) => g.name === cfg.selected);
      if (cfg.selected !== "" && (!target || !target.enabled)) {
        void ctx.get("settings")?.update(NS, { selected: "" }).catch(() => {
        });
      }
    },
    // F6 硬性校验（throw 即拒绝写入，wire 返回 settings-rejected）：
    // 原则「配置期宽容」——技能存在性属警告级（F6-1，客户端卡 UI 展示 ⚠️），此处不拦。
    validate(value) {
      const groups = value.groups ?? [];
      const seen = /* @__PURE__ */ new Set();
      for (const group of groups) {
        const n = group.name.trim();
        if (n === "") throw new Error("\u9884\u8BBE\u7EC4\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        if (seen.has(n)) throw new Error(`\u9884\u8BBE\u7EC4\u540D\u79F0\u91CD\u590D\uFF1A${n}`);
        seen.add(n);
        if (group.skills.length === 0) throw new Error(`\u9884\u8BBE\u7EC4\u300C${n}\u300D\u7684\u6280\u80FD\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A`);
        for (const s of group.skills) {
          if (s.trim() === "") throw new Error(`\u9884\u8BBE\u7EC4\u300C${n}\u300D\u5305\u542B\u7A7A\u7684\u6280\u80FD\u540D\u79F0`);
        }
      }
    }
  });
}
export {
  Config,
  NS,
  apply,
  name
};
