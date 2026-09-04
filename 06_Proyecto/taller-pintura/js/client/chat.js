import { state } from "../state/state.js";
import { sendChatMessage } from "../services/ai.js";
import { t, getLanguage } from "../i18n.js";

export function toggleChat() {
  const panel = document.getElementById("chatPanel");
  panel.classList.toggle("open");

  if (panel.classList.contains("open") && state.chatHistory.length === 0) {
    addChatMessage(
      "bot",
      t("chatGreeting")
    );
  }
}

export function addChatMessage(role, text) {
  const wrap = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "bot");
  div.textContent = text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

export async function sendChat() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addChatMessage("user", text);
  state.chatHistory.push({ role: "user", content: text });

  const wrap = document.getElementById("chatMessages");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg bot";
  loadingDiv.textContent = "…";
  loadingDiv.id = "chatLoading";
  wrap.appendChild(loadingDiv);
  wrap.scrollTop = wrap.scrollHeight;

  try {
    const reply = await sendChatMessage(state.chatHistory, getLanguage());
    document.getElementById("chatLoading")?.remove();
    addChatMessage("bot", reply);
    state.chatHistory.push({ role: "assistant", content: reply });
  } catch {
    document.getElementById("chatLoading")?.remove();
    addChatMessage("bot", t("chatError"));
  }
}

export function initChat() {
  window.toggleChat = toggleChat;
  window.sendChat = sendChat;
}
