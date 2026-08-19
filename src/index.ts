import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * term-explainer 服务端（Host）半：
 * 通过 webServer 暴露一个包私有 HTTP 接口 `/api/term-explainer/explain`，
 * 浏览器端把选中文本 + 上下文 + 对话历史 + 当前会话模型 POST 过来，这里用该模型流式生成解释。
 *
 * RPC 说明：这里刻意用 webServer 路由 + fetch，而不是 typert `@Remote` 代码生成，
 * 好处是零代码生成、易构建易验证；如需接入 DSH 的会话/鉴权/typert 体系，可再换成 `@Remote`。
 */

// 最小结构类型（构建时可替换为 @deepseek-ai/dsh-llm 的真实类型）
interface LlmLike {
  listProviders(): Array<{ id: string }>
  listModels(provider: string): Promise<Array<{ id: string }>>
  stream(options: unknown): AsyncIterable<Record<string, any>>
}

interface ModelServiceLike {
  currentSelection(): { provider: string; model: string; reasoningEffort?: string } | undefined
}

interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default {
  name: 'term-explainer',
  inject: ['webServer', 'llm'],
  apply(ctx: Context) {
    const llm = ctx.get('llm') as LlmLike
    const modelService = ctx.get('agentDefaultModel') as ModelServiceLike | undefined
    const webServer = ctx.get('webServer') as WebServerLike

    let seq = 0

    async function resolveRoute(clientModel?: { provider?: unknown; model?: unknown; reasoningEffort?: unknown }) {
      if (
        clientModel !== undefined &&
        typeof clientModel.provider === 'string' && clientModel.provider.length > 0 &&
        typeof clientModel.model === 'string' && clientModel.model.length > 0
      ) {
        const route: { provider: string; model: string; reasoningEffort?: string } = { provider: clientModel.provider, model: clientModel.model }
        if (typeof clientModel.reasoningEffort === 'string' && clientModel.reasoningEffort.length > 0) route.reasoningEffort = clientModel.reasoningEffort
        return route
      }
      if (modelService !== undefined) {
        try {
          const sel = modelService.currentSelection()
          if (sel && sel.provider && sel.model) return sel
        } catch (err) {
          console.error('term-explainer: resolve default model failed', err)
        }
      }
      let providers: Array<{ id: string }> = []
      try {
        providers = llm.listProviders()
      } catch (err) {
        providers = []
      }
      for (const p of providers) {
        if (!p || !p.id) continue
        try {
          const models = await llm.listModels(p.id)
          if (models && models.length > 0 && models[0].id) {
            return { provider: p.id, model: models[0].id }
          }
        } catch {
          // try next provider
        }
      }
      return null
    }

    function makeMessage(role: string, text: string, route: { provider: string; model: string }) {
      const msg: Record<string, any> = { id: 'term-' + (++seq), role, content: [{ type: 'text', text }] }
      if (role === 'assistant') {
        msg.source = { kind: 'model', provider: route.provider, model: route.model }
      } else {
        msg.source = { kind: 'user' }
      }
      return msg
    }

    ctx.effect(() =>
      webServer.register({
        kind: 'exact',
        path: '/api/term-explainer/explain',
        handler: async (req, res) => {
          const send = (status: number, payload: unknown) => {
            const body = JSON.stringify(payload)
            res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
            res.end(body)
          }

          if (req.method !== 'POST') {
            send(405, { ok: false, error: 'method not allowed' })
            return
          }

          let args: any
          try {
            const raw = await readBody(req)
            args = raw ? JSON.parse(raw) : {}
          } catch {
            send(400, { ok: false, error: 'invalid JSON' })
            return
          }

          const clientModel = args && typeof args.model === 'object' && args.model !== null ? args.model : undefined
          const route = await resolveRoute(clientModel)
          if (route === null) {
            send(500, { ok: false, error: '没有可用的模型，请先在设置中配置模型。' })
            return
          }

          const text = typeof args.text === 'string' ? args.text.slice(0, 2000) : ''
          const context = typeof args.context === 'string' ? args.context.slice(0, 6000) : ''
          const turns = Array.isArray(args.turns) ? args.turns : []
          const locale = typeof args.locale === 'string' ? args.locale : 'zh'
          const lang = locale.toLowerCase().indexOf('en') === 0 ? 'English' : '简体中文'

          const system =
            '你是一个内嵌在聊天应用中的术语助手。用户选中一段文字并给出其上下文，请你结合上下文准确、简洁地解释这段文字。' +
            '回答时始终使用系统默认语言（' + lang + '）。即使选中文字是英文或其他语言，也一律用 ' + lang + ' 回答。' +
            '只解释含义与在该语境下的所指，不要展开无关内容。'

          const messages = [
            makeMessage(
              'user',
              '请结合上下文解释以下选中文字。\n\n【选中文字】\n' + (text || '(空)') + '\n\n【上下文】\n' + (context || '(无)'),
              route,
            ),
          ]
          for (const t of turns) {
            if (t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string') {
              messages.push(makeMessage(t.role, t.content, route))
            }
          }
          if (messages.length === 1) {
            messages.push(makeMessage('user', '请解释这段选中文字。', route))
          }

          const options: Record<string, any> = {
            provider: route.provider,
            model: route.model,
            system,
            messages,
            maxTokens: 1024,
          }
          if (route.reasoningEffort) options.reasoningEffort = route.reasoningEffort

          try {
            let out = ''
            for await (const chunk of llm.stream(options)) {
              if (chunk.type === 'text-delta') out += chunk.text
              else if (chunk.type === 'finish') {
                if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') {
                  const failure = chunk.reason.failure
                  const detail = failure && failure.message ? failure.message : chunk.reason.kind
                  send(200, { ok: false, error: '模型调用失败：' + detail })
                  return
                }
              }
            }
            const clean = out.trim()
            if (!clean) {
              send(200, { ok: false, error: '模型没有返回内容。' })
              return
            }
            send(200, { ok: true, text: clean })
          } catch (err) {
            send(200, { ok: false, error: '解释失败：' + String((err as any)?.message ?? err) })
          }
        },
      }),
    )
  },
}
