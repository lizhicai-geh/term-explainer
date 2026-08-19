//#region src/index.ts
function readBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			data += chunk;
		});
		req.on("end", () => resolve(data));
		req.on("error", reject);
	});
}
var src_default = {
	name: "term-explainer",
	inject: ["webServer", "llm"],
	apply(ctx) {
		const llm = ctx.get("llm");
		const modelService = ctx.get("agentDefaultModel");
		const webServer = ctx.get("webServer");
		let seq = 0;
		async function resolveRoute(clientModel) {
			if (clientModel !== void 0 && typeof clientModel.provider === "string" && clientModel.provider.length > 0 && typeof clientModel.model === "string" && clientModel.model.length > 0) {
				const route = {
					provider: clientModel.provider,
					model: clientModel.model
				};
				if (typeof clientModel.reasoningEffort === "string" && clientModel.reasoningEffort.length > 0) route.reasoningEffort = clientModel.reasoningEffort;
				return route;
			}
			if (modelService !== void 0) try {
				const sel = modelService.currentSelection();
				if (sel && sel.provider && sel.model) return sel;
			} catch (err) {
				console.error("term-explainer: resolve default model failed", err);
			}
			let providers = [];
			try {
				providers = llm.listProviders();
			} catch (err) {
				providers = [];
			}
			for (const p of providers) {
				if (!p || !p.id) continue;
				try {
					const models = await llm.listModels(p.id);
					if (models && models.length > 0 && models[0].id) return {
						provider: p.id,
						model: models[0].id
					};
				} catch {}
			}
			return null;
		}
		function makeMessage(role, text, route) {
			const msg = {
				id: "term-" + ++seq,
				role,
				content: [{
					type: "text",
					text
				}]
			};
			if (role === "assistant") msg.source = {
				kind: "model",
				provider: route.provider,
				model: route.model
			};
			else msg.source = { kind: "user" };
			return msg;
		}
		ctx.effect(() => webServer.register({
			kind: "exact",
			path: "/api/term-explainer/explain",
			handler: async (req, res) => {
				const send = (status, payload) => {
					const body = JSON.stringify(payload);
					res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
					res.end(body);
				};
				if (req.method !== "POST") {
					send(405, {
						ok: false,
						error: "method not allowed"
					});
					return;
				}
				let args;
				try {
					const raw = await readBody(req);
					args = raw ? JSON.parse(raw) : {};
				} catch {
					send(400, {
						ok: false,
						error: "invalid JSON"
					});
					return;
				}
				const route = await resolveRoute(args && typeof args.model === "object" && args.model !== null ? args.model : void 0);
				if (route === null) {
					send(500, {
						ok: false,
						error: "没有可用的模型，请先在设置中配置模型。"
					});
					return;
				}
				const text = typeof args.text === "string" ? args.text.slice(0, 2e3) : "";
				const context = typeof args.context === "string" ? args.context.slice(0, 6e3) : "";
				const turns = Array.isArray(args.turns) ? args.turns : [];
				const lang = (typeof args.locale === "string" ? args.locale : "zh").toLowerCase().indexOf("en") === 0 ? "English" : "简体中文";
				const system = "你是一个内嵌在聊天应用中的术语助手。用户选中一段文字并给出其上下文，请你结合上下文准确、简洁地解释这段文字。回答时始终使用系统默认语言（" + lang + "）。即使选中文字是英文或其他语言，也一律用 " + lang + " 回答。只解释含义与在该语境下的所指，不要展开无关内容。";
				const messages = [makeMessage("user", "请结合上下文解释以下选中文字。\n\n【选中文字】\n" + (text || "(空)") + "\n\n【上下文】\n" + (context || "(无)"), route)];
				for (const t of turns) if (t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string") messages.push(makeMessage(t.role, t.content, route));
				if (messages.length === 1) messages.push(makeMessage("user", "请解释这段选中文字。", route));
				const options = {
					provider: route.provider,
					model: route.model,
					system,
					messages,
					maxTokens: 1024
				};
				if (route.reasoningEffort) options.reasoningEffort = route.reasoningEffort;
				try {
					let out = "";
					for await (const chunk of llm.stream(options)) if (chunk.type === "text-delta") out += chunk.text;
					else if (chunk.type === "finish") {
						if (chunk.reason.kind === "error" || chunk.reason.kind === "aborted") {
							const failure = chunk.reason.failure;
							send(200, {
								ok: false,
								error: "模型调用失败：" + (failure && failure.message ? failure.message : chunk.reason.kind)
							});
							return;
						}
					}
					const clean = out.trim();
					if (!clean) {
						send(200, {
							ok: false,
							error: "模型没有返回内容。"
						});
						return;
					}
					send(200, {
						ok: true,
						text: clean
					});
				} catch (err) {
					send(200, {
						ok: false,
						error: "解释失败：" + String(err?.message ?? err)
					});
				}
			}
		}));
	}
};
//#endregion
export { src_default as default };
