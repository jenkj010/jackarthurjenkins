"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  basePosition,
  buildRestoreCSV,
  buildResultsCSV,
  makeId,
  makeTeam,
  normaliseTeams,
  parsePlayersCSV,
  parseRestoreCSV,
  pickInfo,
  positionColours,
  positionOrder,
} from "@/lib/draftLogic";

const LS_KEY = "jaj-draft-hub-v3";
const FANTASYPROS_URL = "https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php";
const TEAM_COUNT = 8;

const EMPTY = {
  league: "JAJ League",
  type: "snake",
  rounds: 12,
  teams: normaliseTeams([], TEAM_COUNT),
  orderMode: "reveal",
  order: [],
  revealIndex: 0,
  started: false,
  players: [],
  picks: [],
};

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function posStyle(pos: string) {
  const colours = positionColours as Record<string, { bg: string; text: string; line: string }>;
  const colour = colours[basePosition(pos)] || colours.OTHER;
  return {
    "--pos-bg": colour.bg,
    "--pos-text": colour.text,
    "--pos-line": colour.line,
  } as CSSProperties;
}

function teamStyle(team: { primary: string; secondary: string }) {
  return {
    "--team-primary": team.primary,
    "--team-secondary": team.secondary,
  } as CSSProperties;
}

export default function DraftApp() {
  const [state, setState] = useState<any>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<null | { kind: "ok" | "err"; text: string }>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [previewTeam, setPreviewTeam] = useState<number | null>(null);
  const [manual, setManual] = useState({ name: "", pos: "", team: "", bye: "", notes: "" });
  const playerFile = useRef<HTMLInputElement>(null);
  const restoreFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const teams = normaliseTeams(parsed.teams || parsed.teamNames, TEAM_COUNT);
        setState({ ...EMPTY, ...parsed, teams });
      }
    } catch {
      /* Ignore broken autosave. */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      const t = new Date();
      setLastSaved(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    } catch {
      /* App still works without storage. */
    }
  }, [state, loaded]);

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 5000);
  };

  const teams = state.teams;
  const numTeams = teams.length;
  const totalPicks = numTeams * state.rounds;
  const done = state.started && state.picks.length >= totalPicks;
  const current = !done && state.started ? pickInfo(state.picks.length, numTeams, state.type) : null;
  const draftedIds = useMemo(() => new Set(state.picks.map((pk: any) => pk.player.id)), [state.picks]);
  const available = useMemo(() => state.players.filter((p: any) => !draftedIds.has(p.id)), [state.players, draftedIds]);
  const positions = useMemo<string[]>(
    () => ["ALL", ...Array.from(new Set<string>(available.map((p: any) => p.basePos || basePosition(p.pos)))).sort()],
    [available]
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return available.filter((p: any) => {
      const base = p.basePos || basePosition(p.pos);
      return (posFilter === "ALL" || base === posFilter) &&
        (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q));
    });
  }, [available, search, posFilter]);

  const updateTeamName = (index: number, name: string) => {
    setState((s: any) => {
      const next = s.teams.slice();
      next[index] = { ...next[index], name };
      return { ...s, teams: next, order: [], revealIndex: 0 };
    });
  };

  const setOrderMode = (mode: "reveal" | "manual") => {
    setState((s: any) => ({
      ...s,
      orderMode: mode,
      order: mode === "manual" ? Array(TEAM_COUNT).fill("") : [],
      revealIndex: 0,
    }));
  };

  const makeDraftOrder = () => {
    const order = Array.from({ length: TEAM_COUNT }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setState((s: any) => ({ ...s, order, revealIndex: 0 }));
    flash("ok", "Draft order ready. Reveal the teams one by one.");
  };

  const revealNextTeam = () => {
    if (!state.order.length) return makeDraftOrder();
    setState((s: any) => ({ ...s, revealIndex: Math.min(TEAM_COUNT, s.revealIndex + 1) }));
  };

  const setManualOrderSlot = (slotIndex: number, value: string) => {
    setState((s: any) => {
      const order = [...(s.order.length === TEAM_COUNT ? s.order : Array(TEAM_COUNT).fill(""))];
      order[slotIndex] = value === "" ? "" : Number(value);
      return { ...s, order, revealIndex: order.every((entry) => entry !== "") ? TEAM_COUNT : 0 };
    });
  };

  const startDraft = () => {
    if (!state.players.length) return flash("err", "Upload the FantasyPros CSV or add players before starting.");
    const orderReady = state.order.length === TEAM_COUNT && state.order.every((entry: any) => entry !== "");
    if (!orderReady || state.revealIndex < TEAM_COUNT) {
      return flash("err", "Complete the draft order before starting.");
    }
    setState((s: any) => ({
      ...s,
      teams: s.order.map((teamIndex: number) => s.teams[teamIndex]),
      order: Array.from({ length: TEAM_COUNT }, (_, i) => i),
      started: true,
    }));
    flash("ok", "Draft started.");
  };

  const draftPlayer = (p: any) => {
    if (!state.started || done) return;
    const info = pickInfo(state.picks.length, numTeams, state.type);
    setState((s: any) => ({ ...s, picks: [...s.picks, { ...info, player: p }] }));
  };

  const undo = () => {
    if (!state.picks.length) return;
    setState((s: any) => ({ ...s, picks: s.picks.slice(0, -1) }));
    flash("ok", "Last pick undone.");
  };

  const onPlayerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { players, error } = parsePlayersCSV(await file.text());
    if (error) return flash("err", error);
    setState((s: any) => ({ ...s, players: [...s.players, ...players] }));
    flash("ok", `${players.length} FantasyPros players loaded.`);
  };

  const addManual = () => {
    if (!manual.name.trim()) return flash("err", "Custom player needs a name.");
    const pos = manual.pos.trim().toUpperCase();
    setState((s: any) => ({
      ...s,
      players: [
        ...s.players,
        {
          id: makeId(),
          name: manual.name.trim(),
          pos,
          basePos: basePosition(pos),
          team: manual.team.trim().toUpperCase(),
          rank: "",
          bye: manual.bye.trim(),
          tier: "",
          notes: manual.notes.trim(),
          manual: true,
        },
      ],
    }));
    setManual({ name: "", pos: "", team: "", bye: "", notes: "" });
    flash("ok", "Custom player added.");
  };

  const exportRestore = () => download(`draft-restore-${Date.now()}.csv`, buildRestoreCSV(state));
  const exportResults = () => {
    if (!state.picks.length) return flash("err", "No picks to export yet.");
    download(`draft-results-${Date.now()}.csv`, buildResultsCSV(state));
  };
  const onRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { state: restored, error } = parseRestoreCSV(await file.text());
    if (error) return flash("err", error);
    if (!restored) return flash("err", "Restore file could not be read.");
    if ((state.started || state.players.length) && !window.confirm("Replace the current draft with the restore file?")) return;
    setState({ ...EMPTY, ...restored, teams: normaliseTeams(restored.teams, TEAM_COUNT) });
    flash("ok", `Draft restored from pick ${restored.picks.length + 1}.`);
  };

  const reset = () => {
    if (!window.confirm("Reset the whole draft?")) return;
    setState(EMPTY);
    try { localStorage.removeItem(LS_KEY); } catch {}
    flash("ok", "Draft reset.");
  };

  const teamRoster = (teamIndex: number) => state.picks.filter((pk: any) => pk.teamIndex === teamIndex);
  const preview = previewTeam === null ? null : teams[previewTeam];
  const revealedOrder = state.order.slice(0, state.revealIndex).map((teamIndex: number) => teams[teamIndex]);
  const nextRevealNumber = Math.min(state.revealIndex + 1, TEAM_COUNT);
  const selectedManualTeams = new Set(state.order.filter((entry: any) => entry !== ""));
  const manualOrderReady = state.order.length === TEAM_COUNT && state.order.every((entry: any) => entry !== "");

  if (!loaded) return null;

  return (
    <div className="draft nfl-room">
      <div className="draft-status scoreboard">
        <div>
          <span className="muted">League</span>
          <strong>{state.league}</strong>
        </div>
        <div>
          {done ? <strong className="amber-text">Draft complete</strong> : current ? (
            <>
              <span className="muted">On the clock</span>
              <strong className="amber-text">{teams[current.teamIndex]?.name}</strong>
              <span className="muted">R{current.round} P{current.pickInRound} #{current.overall}</span>
            </>
          ) : <span className="muted">Setup</span>}
        </div>
        <div className="muted">{lastSaved ? `Last saved: ${lastSaved}` : "Not saved yet"}</div>
      </div>

      {msg && <p className={`draft-msg ${msg.kind}`} role="status">{msg.text}</p>}
      <input ref={playerFile} type="file" accept=".csv,text/csv" hidden onChange={onPlayerFile} aria-label="Upload FantasyPros CSV" />

      {!state.started && (
        <section className="pixel-panel setup-panel">
          <h2 className="panel-title">Draft setup</h2>
          <div className="field-grid">
            <label className="field">
              <span>League name</span>
              <input value={state.league} onChange={(e) => setState((s: any) => ({ ...s, league: e.target.value }))} />
            </label>
            <label className="field">
              <span>Rounds</span>
              <input type="number" min={1} max={30} value={state.rounds} onChange={(e) => setState((s: any) => ({ ...s, rounds: Math.max(1, Math.min(30, Number(e.target.value) || 1)) }))} />
            </label>
            <label className="field">
              <span>Draft type</span>
              <select value={state.type} onChange={(e) => setState((s: any) => ({ ...s, type: e.target.value }))}>
                <option value="snake">Snake</option>
                <option value="linear">Linear</option>
              </select>
            </label>
          </div>

          <div className="setup-actions">
            <button className="btn" onClick={() => playerFile.current?.click()}>Upload FantasyPros CSV</button>
            <a className="btn link-btn" href={FANTASYPROS_URL} target="_blank" rel="noreferrer">
              Download FantasyPros consensus cheatsheet CSV
            </a>
          </div>

          <div className="team-grid team-name-grid">
            {teams.map((team: any, i: number) => (
              <div className="team-setup" key={i} style={teamStyle(team)}>
                <label className="field">
                  <span>Team {i + 1}</span>
                  <input value={team.name} onChange={(e) => updateTeamName(i, e.target.value)} />
                </label>
              </div>
            ))}
          </div>

          <section className="order-stage" aria-label="Draft order reveal">
            <div className="panel-head">
              <div>
                <h3>Draft order</h3>
                <p className="muted small">
                  Choose a reveal show or set the order manually.
                </p>
              </div>
            </div>

            <div className="order-mode" role="group" aria-label="Draft order method">
              <button
                className={`mode-btn ${state.orderMode !== "manual" ? "active" : ""}`}
                onClick={() => setOrderMode("reveal")}
                type="button"
              >
                Reveal
              </button>
              <button
                className={`mode-btn ${state.orderMode === "manual" ? "active" : ""}`}
                onClick={() => setOrderMode("manual")}
                type="button"
              >
                Manual
              </button>
            </div>

            {state.orderMode === "manual" ? (
              <>
                <div className="manual-order-grid">
                  {Array.from({ length: TEAM_COUNT }).map((_, i) => {
                    const selected = state.order[i];
                    const team = selected !== "" && selected !== undefined ? teams[selected] : null;
                    return (
                      <label key={i} className={`manual-order-slot ${team ? "selected" : ""}`} style={team ? teamStyle(team) : undefined}>
                        <span>Pick {i + 1}</span>
                        <select
                          value={selected ?? ""}
                          onChange={(e) => setManualOrderSlot(i, e.target.value)}
                        >
                          <option value="">Select team</option>
                          {teams.map((teamOption: any, teamIndex: number) => {
                            const alreadySelected = selectedManualTeams.has(teamIndex) && selected !== teamIndex;
                            return (
                              <option key={teamIndex} value={teamIndex} disabled={alreadySelected}>
                                {teamOption.name}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    );
                  })}
                </div>
                <div className="btn-row">
                  <button className="btn primary" onClick={startDraft} disabled={!manualOrderReady}>
                    Start draft
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="order-reveal">
                  {Array.from({ length: TEAM_COUNT }).map((_, i) => {
                    const team = revealedOrder[i];
                    return (
                      <div key={i} className={`order-slot ${team ? "revealed" : ""}`} style={team ? teamStyle(team) : undefined}>
                        <span>Pick {i + 1}</span>
                        <strong>{team ? team.name : "Hidden"}</strong>
                      </div>
                    );
                  })}
                </div>
                <div className="btn-row">
                  <button className="btn" onClick={makeDraftOrder}>Set draft order</button>
                  <button className="btn primary" onClick={revealNextTeam} disabled={state.revealIndex >= TEAM_COUNT}>
                    Reveal pick {nextRevealNumber}
                  </button>
                  <button className="btn primary" onClick={startDraft} disabled={state.revealIndex < TEAM_COUNT}>
                    Start draft
                  </button>
                </div>
              </>
            )}
          </section>
        </section>
      )}

      {state.started && (
      <div className="draft-layout">
        <section className="pixel-panel board-panel">
          <div className="panel-head">
            <h2 className="panel-title">Big draft board</h2>
            <button className="btn tiny" onClick={undo} disabled={!state.picks.length}>Undo last pick</button>
          </div>
          <div className="big-board" style={{ "--team-count": numTeams } as CSSProperties}>
            <div className="board-corner">Round</div>
            {teams.map((team: any, i: number) => (
              <button key={i} className="team-header" style={teamStyle(team)} onClick={() => setPreviewTeam(i)}>
                <span>{team.name}</span>
              </button>
            ))}
            {Array.from({ length: state.rounds }).map((_, roundIndex) => (
              <div className="board-row" key={roundIndex}>
                <div className="round-label">R{roundIndex + 1}</div>
                {teams.map((_: any, colIndex: number) => {
                  const snakeSlot = state.type === "snake" && roundIndex % 2 === 1 ? numTeams - 1 - colIndex : colIndex;
                  const overallIndex = roundIndex * numTeams + snakeSlot;
                  const info = pickInfo(overallIndex, numTeams, state.type);
                  const pk = state.picks[overallIndex];
                  const isCurrent = current && overallIndex === state.picks.length;
                  const team = teams[colIndex] || makeTeam(colIndex);
                  return (
                    <div
                      key={colIndex}
                      className={`pick-card ${pk ? "complete" : ""} ${isCurrent ? "on-clock" : ""}`}
                      style={{ ...teamStyle(team), ...(pk ? posStyle(pk.player.pos) : {}) }}
                    >
                      <div className="pick-meta">
                        <span>#{info.overall}</span>
                        <span>{team.name}</span>
                      </div>
                      {pk ? (
                        <>
                          <strong>{pk.player.name}</strong>
                          <div className="pick-details">
                            <span className="pos-pill">{pk.player.pos}</span>
                            <span>{pk.player.team || "FA"}</span>
                            <span>Bye {pk.player.bye || "-"}</span>
                          </div>
                        </>
                      ) : isCurrent ? (
                        <span className="on-clock-label">On clock</span>
                      ) : (
                        <span className="empty-pick">Open slot</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <section className="pixel-panel">
            <h2 className="panel-title">Player list</h2>
            <div className="setup-actions side-actions">
              <button className="btn" onClick={() => playerFile.current?.click()}>Upload CSV</button>
              <a className="small-link" href={FANTASYPROS_URL} target="_blank" rel="noreferrer">
                Download FantasyPros consensus cheatsheet CSV
              </a>
            </div>
            <div className="table-controls">
              <input placeholder={`Search ${available.length} available players`} value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
                {positions.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="player-list">
              {filtered.slice(0, 220).map((p: any) => (
                <button key={p.id} className="player-row" style={posStyle(p.pos)} disabled={!state.started || done} onClick={() => draftPlayer(p)}>
                  <span className="rank">#{p.rank || "-"}</span>
                  <span className="player-main">
                    <strong>{p.name}{p.manual && " *"}</strong>
                    <small>{p.team || "FA"} · Bye {p.bye || "-"}</small>
                  </span>
                  <span className="pos-pill">{p.pos || basePosition(p.pos)}</span>
                </button>
              ))}
              {!filtered.length && <p className="muted small">No available players match.</p>}
            </div>
          </section>

          <section className="pixel-panel">
            <h2 className="panel-title">Add custom player</h2>
            <div className="manual-stack">
              <input placeholder="Player name" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
              <input placeholder="NFL team" value={manual.team} onChange={(e) => setManual({ ...manual, team: e.target.value })} />
              <input placeholder="Position / rank, e.g. WR92" value={manual.pos} onChange={(e) => setManual({ ...manual, pos: e.target.value })} />
              <input placeholder="Bye week" value={manual.bye} onChange={(e) => setManual({ ...manual, bye: e.target.value })} />
              <input placeholder="Notes optional" value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} />
              <button className="btn" onClick={addManual}>Add custom player</button>
            </div>
          </section>
        </aside>
      </div>
      )}

      <section className="pixel-panel">
        <h2 className="panel-title">Save and export</h2>
        <div className="btn-row">
          <button className="btn" onClick={exportRestore}>Export Restore CSV</button>
          <button className="btn" onClick={() => restoreFile.current?.click()}>Import Restore CSV</button>
          <input ref={restoreFile} type="file" accept=".csv,text/csv" hidden onChange={onRestoreFile} aria-label="Import restore CSV" />
          <button className="btn" onClick={exportResults}>Export Final Results CSV</button>
          <button className="btn danger" onClick={reset}>Reset Draft</button>
        </div>
      </section>

      {preview !== null && (
        <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label={`${preview.name} roster preview`}>
          <div className="team-preview" style={teamStyle(preview)}>
            <div className="panel-head">
              <div>
                <h2>{preview.name}</h2>
                <p className="muted small">{teamRoster(previewTeam!).length} players drafted</p>
              </div>
              <button className="btn tiny" onClick={() => setPreviewTeam(null)}>Close</button>
            </div>
            <div className="position-summary">
              {positionOrder.map((pos) => {
                const count = teamRoster(previewTeam!).filter((pk: any) => (pk.player.basePos || basePosition(pk.player.pos)) === pos).length;
                return count ? <span key={pos}>{pos} {count}</span> : null;
              })}
            </div>
            <div className="preview-groups">
              {positionOrder.map((pos) => {
                const players = teamRoster(previewTeam!)
                  .map((pk: any) => pk.player)
                  .filter((p: any) => (p.basePos || basePosition(p.pos)) === pos)
                  .sort((a: any, b: any) => (Number(a.rank) || 9999) - (Number(b.rank) || 9999));
                if (!players.length) return null;
                return (
                  <section key={pos}>
                    <h3>{pos}</h3>
                    {players.map((p: any) => (
                      <div className="preview-player" key={`${p.name}-${p.pos}`} style={posStyle(p.pos)}>
                        <strong>{p.name}</strong>
                        <span>{p.pos}</span>
                        <span>{p.team || "FA"}</span>
                        <span>Bye {p.bye || "-"}</span>
                        <span>#{p.rank || "-"}</span>
                      </div>
                    ))}
                  </section>
                );
              })}
              {!teamRoster(previewTeam!).length && <p className="muted">No picks yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
