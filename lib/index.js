// src/host/index.ts
import z from "@deepseek-ai/schemastery";
var name = "dsh-message-injector";
var GroupSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  content: z.array(z.string()).default([]),
  enabled: z.boolean().default(true)
});
var Config = z.object({
  /** 预设组列表；前端整组读写（一次 mutate 写整个数组） */
  groups: z.array(GroupSchema).default([]).volatile(),
  /** 当前选中组名称；空字符串 = 未选中 */
  selected: z.string().default("").volatile()
});
function apply(_ctx) {
}
export {
  Config,
  apply,
  name
};
