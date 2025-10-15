// pages/sorteio.tsx
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";

type Team = { name: string; players: string[]; keeper?: string; subs: string[] };

const titleDefault = "⚽️ Jogo de Quarta-feira (22:00h - Arena Biasi)";
const STORAGE_KEY = "destreinados-sorteio-v3-pages";

/* ===== Utils ===== */

function stripNumberPrefix(s: string) {
  // remove "01 -", "1.", "1)", "01 –", etc
  return s.replace(/^\s*\d+\s*[-.)–—]\s*/g, "").trim();
}

function parseList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => stripNumberPrefix(l).trim())
    .filter(Boolean);
}

// Fisher–Yates com crypto (executa no client)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const j = Math.floor(rand * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitEven<T>(items: T[]): [T[], T[]] {
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
}

// Remove acentos e mantém só letras/números/espaço/dois-pontos
function normalizeSection(s: string) {
  const noAccents = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return noAccents.toLowerCase().replace(/[^a-z0-9\s:]/g, "").trim();
}

type ParsedWA = { title?: string; keepers: string[]; field: string[]; subs: string[] };

// Parser do WhatsApp
function parseFromWhatsApp(raw: string): ParsedWA {
  const out: ParsedWA = { keepers: [], field: [], subs: [] };
  const lines = raw.split(/\r?\n/);

  // título (linha com "⚽" ou "jogo")
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    const norm = normalizeSection(t);
    if (t.includes("⚽") || norm.includes("jogo")) {
      out.title = t;
      break;
    }
  }
  if (!out.title) {
    for (const l of lines) {
      const t = l.trim();
      if (!t) continue;
      const n = normalizeSection(t);
      const isSection =
        n.startsWith("goleiro") ||
        n.startsWith("jogadores de linha") ||
        n.startsWith("jogadores") ||
        n.startsWith("reservas") ||
        n.endsWith(":");
      if (!isSection) {
        out.title = t;
        break;
      }
    }
  }

  let current: "keepers" | "field" | "subs" | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const n = normalizeSection(line);

    if (n.startsWith("goleiro")) {
      current = "keepers";
      continue;
    }
    if (n.startsWith("jogadores de linha") || n.startsWith("jogadores")) {
      current = "field";
      continue;
    }
    if (n.startsWith("reserva")) {
      current = "subs";
      continue;
    }

    if (out.title && line === out.title) continue;

    if (current) {
      const name = stripNumberPrefix(line);
      if (name && !/:$/.test(name)) {
        (out[current] as string[]).push(name);
      }
    }
  }

  // fallback: sem seções, considera tudo como jogadores de linha
  if (!out.keepers.length && !out.field.length && !out.subs.length) {
    out.field = parseList(raw);
  }

  const uniq = (arr: string[]) => {
    const seen = new Set<string>();
    const clean: string[] = [];
    for (const x of arr) {
      const y = x.replace(/\s{2,}/g, " ").trim();
      const k = y.toLowerCase();
      if (!y) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      clean.push(y);
    }
    return clean;
  };

  out.keepers = uniq(out.keepers);
  out.field = uniq(out.field);
  out.subs = uniq(out.subs);

  return out;
}

/* ===== UI ===== */

function TeamCard({ title, team }: { title: string; team: Team }) {
  return (
    <div style={styles.teamCard}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{team.name}</div>
      {team.keeper && (
        <div style={{ marginBottom: 8 }}>
          <strong>Goleiro:</strong> {team.keeper}
        </div>
      )}
      {!!team.players.length && (
        <div style={{ marginBottom: 8 }}>
          <strong>Jogadores:</strong>
          <ol style={styles.list}>
            {team.players.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}
      {!!team.subs.length && (
        <div>
          <strong>Reservas:</strong>
          <ol style={styles.list}>
            {team.subs.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function SorteioPage() {
  const [waRaw, setWaRaw] = useState("");
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  // carrega texto salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWaRaw(JSON.parse(saved).waRaw ?? "");
    } catch {}
  }, []);

  const parsed = useMemo(() => parseFromWhatsApp(waRaw), [waRaw]);
  const title = parsed.title || titleDefault;

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ waRaw }));
    alert("✔️ Texto salvo no navegador.");
  }

  function handleDraw() {
    const k = shuffle(parsed.keepers);
    const f = shuffle(parsed.field);
    const s = shuffle(parsed.subs);

    let keeperA: string | undefined;
    let keeperB: string | undefined;
    if (k.length >= 2) {
      [keeperA, keeperB] = [k[0], k[1]];
    } else if (k.length === 1) {
      if (Math.random() < 0.5) {
        keeperA = k[0];
      } else {
        keeperB = k[0];
      }
    }

    const [fieldA, fieldB] = splitEven(f);
    const [subsA, subsB] = splitEven(s);

    setTeamA({ name: "Time A", keeper: keeperA, players: fieldA, subs: subsA });
    setTeamB({ name: "Time B", keeper: keeperB, players: fieldB, subs: subsB });
  }

  async function handleCopy() {
    const lines: string[] = [title, ""];
    const pushTeam = (t: Team | null) => {
      if (!t) return;
      lines.push(`🏳️ ${t.name}`);
      if (t.keeper) lines.push(`*Goleiro:* ${t.keeper}`);
      if (t.players.length) {
        lines.push(`*Jogadores:*`);
        t.players.forEach((p, i) => lines.push(`${String(i + 1).padStart(2, "0")} - ${p}`));
      }
      if (t.subs.length) {
        lines.push(`*Reservas:*`);
        t.subs.forEach((p, i) => lines.push(`${String(i + 1).padStart(2, "0")} - ${p}`));
      }
      lines.push("");
    };
    pushTeam(teamA);
    pushTeam(teamB);
    const txt = lines.join("\n");

    try {
      await navigator.clipboard.writeText(txt);
      alert("📋 Copiado para a área de transferência!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("📋 Copiado!");
    }
  }

  async function handleReadClipboard() {
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt) {
        alert("A área de transferência está vazia.");
        return;
      }
      setWaRaw(txt);
      alert("✅ Texto lido da área de transferência!");
    } catch {
      alert("Não consegui ler a área de transferência. Cole o texto manualmente.");
    }
  }

  const canDraw =
    parsed.field.length > 1 || parsed.keepers.length > 0 || parsed.subs.length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Gerador de Equipes (modo WhatsApp)</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Cole o texto do grupo (com “Goleiros: / Jogadores de Linha: / Reservas:”) e clique em{" "}
          <strong>Sortear</strong>.
        </p>

        <div style={styles.waBlock}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Colar do WhatsApp</h3>
            <button style={styles.buttonGhost} onClick={handleReadClipboard}>
              Ler da área de transferência
            </button>
            <button style={styles.buttonGhost} onClick={handleSave}>
              Salvar texto
            </button>
          </div>
          <textarea
            style={styles.textarea}
            placeholder={`Exemplo:\n\n⚽ Jogo de Quarta-feira (22:00h - Arena Biasi)\n\nGoleiros:\n01 - Goleiro bruno\n02 - Diogo\n\nJogadores de Linha:\n01 - Francisco\n02 - Fernando\n...\n\nReservas:\n01 - ...\n02 - ...`}
            value={waRaw}
            onChange={(e) => setWaRaw(e.target.value)}
          />
          <small style={styles.hint}>Funciona com ou sem numeração.</small>

          {/* Prévia */}
          <div style={styles.preview}>
            <div>
              <strong>Título:</strong> {title}
            </div>
            <div style={styles.previewCols}>
              <div>
                <strong>Goleiros:</strong> {parsed.keepers.join(", ") || "—"}
              </div>
              <div>
                <strong>Jogadores:</strong> {parsed.field.join(", ") || "—"}
              </div>
              <div>
                <strong>Reservas:</strong> {parsed.subs.join(", ") || "—"}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...(canDraw ? {} : styles.buttonDisabled) }}
            onClick={handleDraw}
            disabled={!canDraw}
          >
            Sortear
          </button>
          <button
            style={{ ...styles.button, ...(teamA && teamB ? {} : styles.buttonDisabled) }}
            onClick={handleCopy}
            disabled={!teamA || !teamB}
          >
            Copiar resultado
          </button>
        </div>
      </div>

      {(teamA || teamB) && (
        <div style={styles.results}>
          {teamA && <TeamCard title={title} team={teamA} />}
          {teamB && <TeamCard title={title} team={teamB} />}
        </div>
      )}
    </div>
  );
}

/* ===== estilos ===== */

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: "32px 16px",
    fontFamily:
      "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Ubuntu,Inter,system-ui",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,.25)",
  },
  waBlock: {
    marginTop: 14,
    marginBottom: 14,
    border: "1px dashed #374151",
    borderRadius: 12,
    padding: 12,
    background: "#0b1220",
  },
  preview: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.95,
    display: "grid",
    gap: 6,
  },
  previewCols: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6,
  },
  textarea: {
    width: "100%",
    height: 220,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#0b1220",
    color: "white",
    outline: "none",
    resize: "vertical",
  },
  hint: { display: "block", opacity: 0.7, marginTop: 6 },
  actions: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },
  button: {
    padding: "10px 14px",
    background: "#2563eb",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonGhost: {
    padding: "8px 12px",
    background: "transparent",
    border: "1px solid #374151",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
  results: {
    maxWidth: 1100,
    margin: "18px auto 0",
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  teamCard: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16,
  },
  list: {
    margin: "6px 0 0 18px",
    padding: 0,
  },
};
