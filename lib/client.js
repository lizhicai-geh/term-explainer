window.__ModuleLoader__.load({
	id: "dsh-term-explainer",
	factory: (require) => {
		var module = { exports: {} };
		module.exports;
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		/**
		* term-explainer 浏览器（Client）半：
		* 监听文本选中 → 在选区附近显示「解释」按钮 → 点击后在右侧打开可拖动/缩放的对话框，
		* 通过 fetch 调用 Host 的 `/api/term-explainer/explain`，结合上下文生成解释并支持追问。
		*/
		const CSS = `
[data-term-explainer] { font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif); }
.term-panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #0f1115);
  border: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.06));
  border-radius: 12px;
  box-shadow: var(--dsw-shadow-lv3, 0 12px 32px 0 rgba(0,0,0,0.08));
  pointer-events: auto; z-index: 2147483000;
  overflow: hidden;
  animation: term-fade .18s var(--ds-ease-in-out, ease);
}
@keyframes term-fade { from { opacity: 0; } to { opacity: 1; } }
.term-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.06)); cursor: move; user-select: none; }
.term-title { font: var(--dsw-font-s-strong-14, 500 14px/22px system-ui); color: var(--dsw-alias-label-primary, #0f1115); pointer-events: none; }
.term-close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 16px; line-height: 1; color: var(--dsw-alias-label-secondary, #61666b); }
.term-close:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38,49,72,0.06)); color: var(--dsw-alias-label-primary, #0f1115); }
.term-quote { margin: 12px 16px 0; padding: 10px 12px; background: var(--dsw-alias-interactive-bg-hover, rgba(38,49,72,0.06)); border-left: 2px solid var(--dsw-alias-state-business-primary, #4176e6); border-radius: 8px; font: var(--dsw-font-s-14, 14px/22px system-ui); color: var(--dsw-alias-label-secondary, #61666b); white-space: pre-wrap; word-break: break-word; max-height: 72px; overflow: auto; }
.term-body { flex: 1 1 auto; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.term-msg { font: var(--dsw-font-s-14, 14px/22px system-ui); white-space: pre-wrap; word-break: break-word; }
.term-msg.user { align-self: flex-end; max-width: 85%; padding: 7px 12px; border-radius: 12px; background: var(--dsw-alias-interactive-bg-active, rgba(38,49,72,0.1)); border: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.06)); color: var(--dsw-alias-label-primary, #0f1115); }
.term-msg.assistant { align-self: flex-start; color: var(--dsw-alias-label-primary, #0f1115); }
.term-loading { display: flex; align-items: center; gap: 6px; font: var(--dsw-font-xxs-12, 12px/18px system-ui); color: var(--dsw-alias-label-secondary, #61666b); }
.term-spinner { flex: none; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.1)); border-top-color: var(--dsw-alias-state-business-primary, #4176e6); animation: term-spin .8s linear infinite; }
@keyframes term-spin { to { transform: rotate(360deg); } }
.term-error { font: var(--dsw-font-xxs-12, 12px/18px system-ui); color: var(--dsw-alias-state-error-primary, #ec1313); }
.term-input-row { display: flex; gap: 8px; padding: 12px 16px 14px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.06)); }
.term-input { flex: 1 1 auto; min-width: 0; height: 36px; padding: 0 12px; background: var(--dsw-specific-input-major, transparent); border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.1)); border-radius: 10px; font: var(--dsw-font-s-14, 14px/22px system-ui); color: var(--dsw-alias-label-primary, #0f1115); outline: none; transition: border-color .2s var(--ds-ease-in-out, ease); }
.term-input::placeholder { color: var(--dsw-alias-label-tertiary, #81858c); }
.term-input:focus { border-color: var(--dsw-alias-brand-primary, #0f1115); }
.term-send { flex: 0 0 auto; white-space: nowrap; height: 36px; padding: 0 18px; border: none; border-radius: 10px; background: var(--dsw-alias-button-primary-fill, #0f1115); color: var(--dsw-alias-label-primary-inverted, #ffffff); font: var(--dsw-font-s-strong-14, 500 14px/22px system-ui); cursor: pointer; transition: background-color .2s var(--ds-ease-in-out, ease); }
.term-send:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, #434447); }
.term-send:disabled { opacity: .4; cursor: default; }
.term-hint {
  position: fixed;
  z-index: 2147483000;
  display: inline-flex; align-items: center; gap: 5px;
  height: 28px; padding: 0 12px 0 10px;
  border: none; border-radius: 14px;
  background: var(--dsw-alias-button-primary-fill, #0f1115);
  color: var(--dsw-alias-label-primary-inverted, #ffffff);
  font: var(--dsw-font-xs-strong-13, 500 13px/20px system-ui);
  cursor: pointer;
  box-shadow: var(--dsw-shadow-lv2, 0 4px 12px 0 rgba(0,0,0,0.06));
  animation: term-fade .15s var(--ds-ease-in-out, ease);
}
.term-hint:hover { background: var(--dsw-alias-button-primary-hover, #434447); }
.term-h { position: absolute; z-index: 4; }
.term-h-n { top: 0; left: 14px; right: 14px; height: 6px; cursor: ns-resize; }
.term-h-s { bottom: 0; left: 14px; right: 14px; height: 6px; cursor: ns-resize; }
.term-h-e { top: 14px; bottom: 14px; right: 0; width: 6px; cursor: ew-resize; }
.term-h-w { top: 14px; bottom: 14px; left: 0; width: 6px; cursor: ew-resize; }
.term-h-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nwse-resize; }
.term-h-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: nesw-resize; }
.term-h-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: nesw-resize; }
.term-h-se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: nwse-resize; }
.term-h-se::after { content: ''; position: absolute; right: 3px; bottom: 3px; width: 8px; height: 8px; border-right: 2px solid var(--dsw-alias-label-tertiary, #81858c); border-bottom: 2px solid var(--dsw-alias-label-tertiary, #81858c); border-bottom-right-radius: 2px; }
`;
		//#endregion
		module.exports = {
			name: "term-explainer-client",
			inject: ["slots", "locale"],
			apply(ctx) {
				const slots = ctx.get("slots");
				if (slots === void 0) return;
				const localeService = ctx.get("locale");
				const currentLocale = () => {
					if (localeService === void 0) return "zh";
					try {
						const snap = typeof localeService.getSnapshot === "function" ? localeService.getSnapshot() : localeService.getLocale();
						return snap && snap.active ? snap.active : "zh";
					} catch {
						return "zh";
					}
				};
				const sessionsService = ctx.get("sessions");
				const modelDirectories = ctx.get("modelDirectories");
				const currentModel = () => {
					try {
						if (sessionsService === void 0 || modelDirectories === void 0) return null;
						const list = sessionsService.list;
						const sessionId = list && typeof list.getSnapshot === "function" ? list.getSnapshot().current : void 0;
						if (!sessionId) return null;
						if (typeof modelDirectories.directoryFor !== "function") return null;
						const dir = modelDirectories.directoryFor(sessionId);
						const snap = dir && dir.store && typeof dir.store.getSnapshot === "function" ? dir.store.getSnapshot() : void 0;
						const cur = snap && snap.current;
						if (cur && typeof cur.provider === "string" && cur.provider && typeof cur.model === "string" && cur.model) {
							const model = {
								provider: cur.provider,
								model: cur.model
							};
							if (typeof cur.reasoningEffort === "string" && cur.reasoningEffort) model.reasoningEffort = cur.reasoningEffort;
							return model;
						}
						return null;
					} catch {
						return null;
					}
				};
				ctx.effect(() => {
					const el = document.createElement("style");
					el.setAttribute("data-plugin", "term-explainer");
					el.textContent = CSS;
					document.head.appendChild(el);
					return () => el.remove();
				});
				const grabContext = (sel) => {
					try {
						let node = sel.getRangeAt(0).commonAncestorContainer;
						let el = node && node.nodeType === 3 ? node.parentElement : node;
						const selLen = sel.toString().length;
						for (let i = 0; i < 8 && el && el.parentElement; i++) {
							if ((el.textContent || "").trim().length >= selLen + 60) break;
							el = el.parentElement;
						}
						return (el && el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 4e3);
					} catch {
						return "";
					}
				};
				function TermExplainer() {
					const [popup, setPopup] = react.default.useState(null);
					const [box, setBox] = react.default.useState(null);
					const [hint, setHint] = react.default.useState(null);
					const bodyRef = react.default.useRef(null);
					const reqRef = react.default.useRef(0);
					async function ask(text, context, turns) {
						const id = ++reqRef.current;
						setPopup((p) => p ? {
							...p,
							loading: true,
							error: null
						} : p);
						let result;
						try {
							const model = currentModel();
							const payload = {
								text,
								context,
								turns,
								locale: currentLocale()
							};
							if (model !== null) payload.model = model;
							result = await (await fetch("/api/term-explainer/explain", {
								method: "POST",
								headers: { "content-type": "application/json" },
								body: JSON.stringify(payload)
							})).json();
						} catch (err) {
							result = {
								ok: false,
								error: String(err?.message ?? err)
							};
						}
						if (id !== reqRef.current) return;
						setPopup((p) => {
							if (!p) return p;
							if (result && result.ok && typeof result.text === "string") return {
								...p,
								turns: p.turns.concat([{
									role: "assistant",
									content: result.text
								}]),
								loading: false,
								error: null
							};
							return {
								...p,
								loading: false,
								error: result && result.error || "解释失败"
							};
						});
					}
					function close() {
						reqRef.current++;
						setPopup(null);
						setBox(null);
						setHint(null);
					}
					function openSelection(text, context) {
						const vw = window.innerWidth || 1200;
						const vh = window.innerHeight || 800;
						const w = Math.min(384, vw - 16);
						const h = Math.min(560, vh - 16);
						setBox({
							x: Math.max(8, vw - w - 20),
							y: Math.max(8, (vh - h) / 2),
							w,
							h
						});
						setPopup({
							text,
							context,
							turns: [],
							loading: true,
							error: null,
							input: ""
						});
						ask(text, context, []);
					}
					function showHint(text, context, rect) {
						const vw = window.innerWidth || 1200;
						const vh = window.innerHeight || 800;
						const bw = 72;
						const bh = 28;
						let x = rect.left;
						let y = rect.top - 34;
						if (y < 4) y = rect.bottom + 6;
						x = Math.max(4, Math.min(x, vw - bw - 4));
						y = Math.max(4, Math.min(y, vh - bh - 4));
						setHint({
							x,
							y,
							text,
							context
						});
					}
					function openFromHint() {
						if (!hint) return;
						const text = hint.text;
						const context = hint.context;
						setHint(null);
						openSelection(text, context);
					}
					function startMove(e) {
						if (e.button !== 0) return;
						const t = e.target;
						if (t && typeof t.closest === "function" && t.closest(".term-close")) return;
						if (!box) return;
						e.preventDefault();
						const start = {
							sx: e.clientX,
							sy: e.clientY,
							x: box.x,
							y: box.y
						};
						const w = box.w;
						const h = box.h;
						function onMove(ev) {
							const vw = window.innerWidth || 1200;
							const vh = window.innerHeight || 800;
							let nx = start.x + (ev.clientX - start.sx);
							let ny = start.y + (ev.clientY - start.sy);
							nx = Math.max(-w + 60, Math.min(nx, vw - 60));
							ny = Math.max(0, Math.min(ny, vh - 48));
							setBox({
								x: nx,
								y: ny,
								w,
								h
							});
						}
						function onUp() {
							document.removeEventListener("mousemove", onMove);
							document.removeEventListener("mouseup", onUp);
						}
						document.addEventListener("mousemove", onMove);
						document.addEventListener("mouseup", onUp);
					}
					function startResize(dir) {
						return function(e) {
							if (e.button !== 0) return;
							if (!box) return;
							e.preventDefault();
							e.stopPropagation();
							const start = {
								sx: e.clientX,
								sy: e.clientY,
								x: box.x,
								y: box.y,
								w: box.w,
								h: box.h
							};
							const MINW = 300;
							const MINH = 360;
							function onMove(ev) {
								const dx = ev.clientX - start.sx;
								const dy = ev.clientY - start.sy;
								const vw = window.innerWidth || 1200;
								const vh = window.innerHeight || 800;
								let x = start.x;
								let y = start.y;
								let w = start.w;
								let h = start.h;
								if (dir.indexOf("e") !== -1) w = Math.max(MINW, Math.min(start.w + dx, vw - start.x - 8));
								if (dir.indexOf("w") !== -1) {
									const right = start.x + start.w;
									x = Math.max(0, Math.min(start.x + dx, right - MINW));
									w = right - x;
								}
								if (dir.indexOf("s") !== -1) h = Math.max(MINH, Math.min(start.h + dy, vh - start.y - 8));
								if (dir.indexOf("n") !== -1) {
									const bottom = start.y + start.h;
									y = Math.max(0, Math.min(start.y + dy, bottom - MINH));
									h = bottom - y;
								}
								setBox({
									x,
									y,
									w,
									h
								});
							}
							function onUp() {
								document.removeEventListener("mousemove", onMove);
								document.removeEventListener("mouseup", onUp);
							}
							document.addEventListener("mousemove", onMove);
							document.addEventListener("mouseup", onUp);
						};
					}
					react.default.useEffect(() => {
						function handleMouseUp(e) {
							const target = e.target;
							if (target && typeof target.closest === "function" && (target.closest("[data-term-explainer]") || target.closest("[data-term-hint]"))) return;
							const sel = window.getSelection();
							if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
								setHint(null);
								return;
							}
							const text = sel.toString().replace(/\s+/g, " ").trim();
							if (!text || text.length > 2e3) {
								setHint(null);
								return;
							}
							const rect = sel.getRangeAt(0).getBoundingClientRect();
							if (!rect || rect.width === 0 && rect.height === 0) {
								setHint(null);
								return;
							}
							showHint(text, grabContext(sel), rect);
						}
						function handleKeyDown(e) {
							if (e.key === "Escape") close();
						}
						function handleKeyUp(e) {
							if (e.key === "Shift") handleMouseUp(e);
						}
						document.addEventListener("mouseup", handleMouseUp);
						document.addEventListener("keydown", handleKeyDown);
						document.addEventListener("keyup", handleKeyUp);
						return () => {
							document.removeEventListener("mouseup", handleMouseUp);
							document.removeEventListener("keydown", handleKeyDown);
							document.removeEventListener("keyup", handleKeyUp);
						};
					}, []);
					const msgCount = popup ? popup.turns.length : 0;
					const loading = popup ? popup.loading : false;
					react.default.useEffect(() => {
						if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
					}, [msgCount, loading]);
					function sendFollowup() {
						if (!popup || popup.loading) return;
						const q = (popup.input || "").trim();
						if (!q) return;
						const turns = popup.turns.concat([{
							role: "user",
							content: q
						}]);
						setPopup({
							...popup,
							turns,
							input: ""
						});
						ask(popup.text, popup.context, turns);
					}
					const hintEl = hint ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "term-hint",
						"data-term-hint": "1",
						style: {
							left: Math.round(hint.x),
							top: Math.round(hint.y)
						},
						onMouseDown: (e) => e.preventDefault(),
						onClick: openFromHint,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							width: 13,
							height: 13,
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: 2,
							strokeLinecap: "round",
							strokeLinejoin: "round",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: 11,
								cy: 11,
								r: 7
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
								x1: 21,
								y1: 21,
								x2: 16.65,
								y2: 16.65
							})]
						}), "解释"]
					}) : null;
					let panelEl = null;
					if (popup) {
						const style = box ? {
							left: Math.round(box.x),
							top: Math.round(box.y),
							width: Math.round(box.w),
							height: Math.round(box.h)
						} : {
							left: 0,
							top: 0,
							width: 384,
							height: 560
						};
						const handles = [
							["n", "term-h term-h-n"],
							["s", "term-h term-h-s"],
							["e", "term-h term-h-e"],
							["w", "term-h term-h-w"],
							["nw", "term-h term-h-nw"],
							["ne", "term-h term-h-ne"],
							["sw", "term-h term-h-sw"],
							["se", "term-h term-h-se"]
						].map((h) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: h[1],
							onMouseDown: startResize(h[0])
						}, h[0]));
						panelEl = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							"data-term-explainer": "1",
							className: "term-panel",
							style,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "term-head",
									onMouseDown: startMove,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "term-title",
										children: "术语解释"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "term-close",
										"aria-label": "关闭",
										onClick: close,
										children: "×"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "term-quote",
									children: popup.text
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									ref: bodyRef,
									className: "term-body",
									children: [
										popup.turns.map((t, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "term-msg " + (t.role === "user" ? "user" : "assistant"),
											children: t.content
										}, i)),
										popup.loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "term-loading",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "term-spinner" }), "正在解释…"]
										}) : null,
										popup.error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "term-error",
											children: popup.error
										}) : null
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "term-input-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "term-input",
										type: "text",
										placeholder: "追问一下…",
										value: popup.input,
										onChange: (e) => setPopup({
											...popup,
											input: e.target.value
										}),
										onKeyDown: (e) => {
											if (e.key === "Enter") sendFollowup();
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "term-send",
										title: "发送",
										"aria-label": "发送",
										disabled: popup.loading || !(popup.input || "").trim(),
										onClick: sendFollowup,
										children: "发送"
									})]
								}),
								handles
							]
						});
					}
					if (!hintEl && !panelEl) return null;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [hintEl, panelEl] });
				}
				slots.inject("shell.overlay", () => slots.register({
					name: "shell.overlay",
					id: "term-explainer",
					order: 100
				}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TermExplainer, {})));
			}
		};
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map