// 本地模拟回复：暂时顶替后端，接入 DeepSeek API 后整个文件删除。
// 只按关键词命中几条预设回复，用来把对话流程跑通，顺带验证 Markdown 渲染。
const RULES = [
  {
    test: /代码|示例|怎么写|函数|code/i,
    reply: [
      '这里是一个防抖函数的例子：',
      '',
      '```js',
      'export function debounce(fn, wait = 300) {',
      '  let timer = null',
      '  return (...args) => {',
      '    clearTimeout(timer)',
      '    timer = setTimeout(() => fn(...args), wait)',
      '  }',
      '}',
      '```',
      '',
      '要点：**保留最后一次**调用，前面的都会被清掉。',
    ].join('\n'),
  },
  {
    test: /日程|安排|提醒|会议/,
    reply: [
      '你今天的日程是：',
      '',
      '1. 15:00 产品评审会',
      '2. 17:30 与设计师对齐原型',
      '3. 19:30 健身',
      '',
      '> 需要我提前 15 分钟提醒你吗？',
    ].join('\n'),
  },
  {
    test: /备忘|记录|记一下|待办/,
    reply: '好的，我先记下了。等接入后端，这里会真的写进备忘模块。',
  },
  {
    test: /你好|您好|hi|hello/i,
    reply: '你好呀，我是 **Whale AI**。现在回复来自本地规则库，接入 DeepSeek 后就是真实对话了。',
  },
  {
    test: /谢谢|感谢/,
    reply: '不客气，还需要我做什么？',
  },
]

const FALLBACK = '我收到了。这条是本地模拟回复，目前还没接入后端，接上 DeepSeek API 后就是真实回答了。'

export function createMockReply(text) {
  const input = String(text || '').trim()
  const hit = RULES.find((rule) => rule.test.test(input))
  return hit ? hit.reply : FALLBACK
}