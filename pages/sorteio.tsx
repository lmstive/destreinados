// pages/sorteio.tsx
import { useEffect, useMemo, useState } from "react";

type Team = { name: string; players: string[]; keeper?: string; subs: string[] };

const titleDefault = "⚽️ Jogo de Quarta-feira (22:00h - Arena Biasi)";
const STORAGE_KEY = "destreinados-sorteio-v1";

function parseList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) =>
      l
        // remove "01 -", "1.", "1)" etc
        .replace(/^\s*\d+\s*[-.)]\s*/g, "")
        .trim()
    )
    .filter(Boolean);
}

// Fisher–Yates com crypto
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    // número aleatório seguro
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

export default function Sorteio() {
  const [title, setTitle] = useState(titleDefault);
  const [keepersRaw, setKeepersRaw] = useState("01 - \n02 - ");
  const [fieldRaw, setFieldRaw] = useState(
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0") + " - ").join("\n")
  );
  const [subsRaw, setSubsRaw] = useState(
    Array.from({ length: 4 }, (_, i) => String(i + 1).padStart(2, "0") + " - ").join("\n")
  );

  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  // carregar estado salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const o = JSON.parse(saved);
        setTitle(o.title ?? titleDefault);
        setKeepersRaw(o.keepersRaw ?? keepersRaw);
        setFieldRaw(o.fieldRaw ?? fieldRaw);
        setSubsRaw(o.subsRaw ?? subsRaw);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = useMemo(() => {
    const keepers = parseList(keepersRaw);
    const field = parseList(fieldRaw);
    const subs = parseList(subsRaw);
    return { keepers, field, subs };
  }, [keepersRaw, fieldRaw, subsRaw]);

  function handleSave() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ title, keepersRaw, fieldRaw, subsRaw })
    );
    alert("✔️ Dados salvos no navegador.");
  }

  function handleDraw() {
    const k = shuffle(parsed.keepers);
    const f = shuffle(parsed.field);
    const s = shuffle(parsed.subs);

    // Goleiros: um pra cada lado (se existirem)
    let keeperA: string | undefined;
    let keeperB: string | undefined;
    if (k.length >= 2) {
      [keeperA, keeperB] = [k[0], k[1]];
    } else if (k.length === 1) {
      // sorteia pra qual lado vai
      const goesA = Math.random() < 0.5;
      keeperA = goesA ? k[0] : undefined;
      keeperB = goesA ? undefined : k[0];
    }

    const [fieldA, fieldB] = splitEven(f);
    const [subsA, subsB] = splitEven(s);

    setTeamA({ name: "Time A", keeper: keeperA, players: fieldA, subs: subsA });
    setTeamB({ name: "Time B", keeper: keeperB, players: fieldB, subs: subsB });
  }

  async function handleCopy() {
    const lines: string[] = [];
    lines.push(title);
    lines.push("");

    const formatTeam = (t: Team | null) => {
      if (!t) return;
      lines.push(`🏳️ ${t.name}`);
      if (t.keeper) lines.push(`*Goleiro:* ${t.keeper}`);
      if (t.players.length) {
        lines.push(`*Jogadores:*`);
        t.players.forEach((p, i) =>
          lines.push(`${String(i + 1).padStart(2, "0")} - ${p}`)
        );
      }
      if (t.subs.length) {
        lines.push(`*Reservas:*`);
        t.subs.forEach((p, i) =>
          lines.push(`${String(i + 1).padStart(2, "0")} - ${p}`)
        );
      }
      lines.push("");
    };

    formatTeam(teamA);
    formatTeam(teamB);

    const txt = lines.join("\n");
    try {
      await navigator.clipboard.writeText(txt);
      alert("📋 Copiado para a área de transferência!");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("📋 Copiado!");
    }
  }

  const canDraw =
    parsed.field.length > 1 || parsed.keepers.length > 0 || parsed.subs.length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ margin: 0 }}>Gerador de Equipes</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Monte os nomes e clique em <strong>Sortear</strong>. Os goleiros são
          distribuídos um para cada lado automaticamente.
        </p>

        <label style={styles.label}>Título do jogo</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div style={styles.grid}>
          <div>
            <h3 style={styles.h3}>Goleiros</h3>
            <textarea
              style={styles.textarea}
              value={keepersRaw}
              onChange={(e) => setKeepersRaw(e.target.value)}
              placeholder={"01 - João\n02 - Pedro"}
            />
            <small style={styles.hint}>
              Dica: pode colar linhas tipo “01 - Fulano” ou só “Fulano”.
            </small>
          </div>

          <div>
            <h3 style={styles.h3}>Jogadores de Linha</h3>
            <textarea
              style={styles.textarea}
              value={fieldRaw}
              onChange={(e) => setFieldRaw(e.target.value)}
              placeholder={"01 - Fulano\n02 - Sicrano\n..."}
            />
          </div>

          <div>
            <h3 style={styles.h3}>Reservas</h3>
            <textarea
              style={styles.textarea}
              value={subsRaw}
              onChange={(e) => setSubsRaw(e.target.value)}
              placeholder={"01 - ...\n02 - ..."}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={handleSave}>Salvar</button>
          <button
            style={{ ...styles.button, ...(canDraw ? {} : styles.buttonDisabled) }}
            onClick={handleDraw}
            disabled={!canDraw}
          >
            Sortear
          </button>
          <button
            style={{
              ...styles.button,
              ...(teamA && teamB ? {} : styles.buttonDisabled),
            }}
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

function TeamCard({ title, team }: { title: string; team: Team }) {
  return (
    <div style={styles.teamCard}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        {team.name}
      </div>
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

const styles: Record<string, React.CSSProperties> = {
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
  label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#0b1220",
    color: "white",
    outline: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginTop: 16,
  },
  h3: { margin: "8px 0" },
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
