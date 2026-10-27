// src/host/index.ts
import z from "@deepseek-ai/schemastery";
var name = "dsh-message-injector";
var presetGroupSchema = z.object({
  name: z.string().required(),
  description: z.string().default(""),
  content: z.array(z.string()).default([]),
  enabled: z.boolean().default(true)
});
var Config = z.object({
  groups: z.array(presetGroupSchema).default([]).volatile(),
  /** 当前选中组名称；空字符串 = 未选中（F3） */
  selected: z.string().default("").volatile()
});
function apply(ctx) {
  ctx.inject(["settings"], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
  });
}
export {
  Config,
  apply,
  name
};
