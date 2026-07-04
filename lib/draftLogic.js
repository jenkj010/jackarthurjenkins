export const SCHEMA_VERSION = "2";

export const defaultTeamColours = [
  ["#1d4ed8", "#facc15"],
  ["#047857", "#f8fafc"],
  ["#7c3aed", "#f97316"],
  ["#be123c", "#e5e7eb"],
  ["#0f766e", "#fbbf24"],
  ["#4338ca", "#fb7185"],
  ["#b45309", "#fef3c7"],
  ["#0e7490", "#dc2626"],
  ["#581c87", "#22c55e"],
  ["#991b1b", "#60a5fa"],
  ["#166534", "#c084fc"],
  ["#334155", "#f59e0b"],
];

export const positionColours = {
  QB: { bg: "#1d4ed8", text: "#eff6ff", line: "#60a5fa" },
  RB: { bg: "#047857", text: "#ecfdf5", line: "#34d399" },
  WR: { bg: "#6d28d9", text: "#f5f3ff", line: "#a78bfa" },
  TE: { bg: "#c2410c", text: "#fff7ed", line: "#fb923c" },
  K: { bg: "#ca8a04", text: "#111827", line: "#fde047" },
  DST: { bg: "#991b1b", text: "#fef2f2", line: "#9ca3af" },
  DEF: { bg: "#991b1b", text: "#fef2f2", line: "#9ca3af" },
  FLEX: { bg: "#0f766e", text: "#f0fdfa", line: "#5eead4" },
  OTHER: { bg: "#475569", text: "#f8fafc", line: "#94a3b8" },
};

export const positionOrder = ["QB", "RB", "WR", "TE", "FLEX", "K", "DST", "DEF", "OTHER"];

export function basePosition(pos = "") {
  const clean = String(pos).trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (clean.startsWith("DST")) return "DST";
  if (clean.startsWith("DEF")) return "DEF";
  if (clean.startsWith("QB")) return "QB";
  if (clean.startsWith("RB")) return "RB";
  if (clean.startsWith("WR")) return "WR";
  if (clean.startsWith("TE")) return "TE";
  if (clean.startsWith("K")) return "K";
  if (["FB", "HB"].includes(clean)) return "FLEX";
  return clean || "OTHER";
}

export function coloursForTeam(index) {
  const pair = defaultTeamColours[index % defaultTeamColours.length];
  return { primary: pair[0], secondary: pair[1] };
}

export function makeTeam(index, name) {
  return { name: name || `Team ${index + 1}`, ...coloursForTeam(index) };
}

export function normaliseTeams(teamsOrNames, count = 4) {
  const source = Array.isArray(teamsOrNames) ? teamsOrNames : [];
  const teams = source.slice(0, count).map((team, index) => {
    if (typeof team === "string") return makeTeam(index, team);
    const fallback = makeTeam(index, team?.name);
    return {
      name: team?.name || fallback.name,
      primary: team?.primary || fallback.primary,
      secondary: team?.secondary || fallback.secondary,
    };
  });
  while (teams.length < count) teams.push(makeTeam(teams.length));
  return teams;
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell); cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function esc(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows) {
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export function teamForOverall(overall, numTeams, type) {
  const round = Math.floor(overall / numTeams);
  const idx = overall % numTeams;
  if (type === "snake" && round % 2 === 1) return numTeams - 1 - idx;
  return idx;
}

export function pickInfo(overall, numTeams, type) {
  return {
    round: Math.floor(overall / numTeams) + 1,
    pickInRound: (overall % numTeams) + 1,
    overall: overall + 1,
    teamIndex: teamForOverall(overall, numTeams, type),
  };
}

const PLAYER_HEADERS = {
  rk: "rank",
  rank: "rank",
  tiers: "tier",
  tier: "tier",
  "player name": "name",
  player: "name",
  name: "name",
  team: "team",
  pos: "pos",
  position: "pos",
  "bye week": "bye",
  bye: "bye",
  notes: "notes",
};

let idCounter = 0;
export function makeId() {
  idCounter += 1;
  return `p${Date.now().toString(36)}${idCounter}`;
}

function cleanHeader(header) {
  return String(header).trim().toLowerCase().replace(/\s+/g, " ");
}

function playerFromCells(cells, map, manual = false) {
  const p = {
    id: makeId(),
    name: "",
    team: "",
    pos: "",
    basePos: "OTHER",
    rank: "",
    bye: "",
    tier: "",
    notes: "",
    manual,
  };
  cells.forEach((cell, j) => {
    const key = map[j];
    if (key) p[key] = String(cell ?? "").trim();
  });
  p.pos = p.pos.toUpperCase();
  p.team = p.team.toUpperCase();
  p.basePos = basePosition(p.pos);
  return p;
}

export function parsePlayersCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { players: [], error: "File is empty." };
  const header = rows[0].map(cleanHeader);
  const map = header.map((h) => PLAYER_HEADERS[h] ?? null);
  if (!map.includes("name")) {
    return { players: [], error: "No PLAYER NAME column found in the CSV." };
  }
  const players = [];
  for (let i = 1; i < rows.length; i++) {
    const p = playerFromCells(rows[i], map, false);
    if (p.name) players.push(p);
  }
  players.sort((a, b) => (Number(a.rank) || 9999) - (Number(b.rank) || 9999));
  return { players, error: players.length ? null : "No player rows found." };
}

const RESTORE_COLUMNS = [
  "RowType", "Key", "Value", "Round", "Pick", "OverallPick",
  "TeamIndex", "TeamName", "TeamPrimaryColor", "TeamSecondaryColor",
  "PlayerName", "Position", "BasePosition", "NFLTeam", "Rank", "ByeWeek",
  "Status", "Notes", "CreatedAt", "SchemaVersion",
];

function blankRow() {
  return RESTORE_COLUMNS.map(() => "");
}

function setCells(row, values) {
  for (const [col, v] of Object.entries(values)) {
    const i = RESTORE_COLUMNS.indexOf(col);
    if (i >= 0) row[i] = String(v ?? "");
  }
  return row;
}

function rowToPlayer(get, row, manual) {
  const pos = get(row, "Position");
  return {
    id: makeId(),
    name: get(row, "PlayerName"),
    pos,
    basePos: get(row, "BasePosition") || basePosition(pos),
    team: get(row, "NFLTeam"),
    rank: get(row, "Rank"),
    bye: get(row, "ByeWeek") || get(row, "Bye"),
    tier: "",
    notes: get(row, "Notes"),
    manual,
  };
}

export function buildRestoreCSV(state) {
  const now = new Date().toISOString();
  const teams = normaliseTeams(state.teams || state.teamNames, state.teams?.length || state.teamNames?.length || 4);
  const rows = [RESTORE_COLUMNS.slice()];
  const meta = (key, value) =>
    rows.push(setCells(blankRow(), {
      RowType: "META", Key: key, Value: value, CreatedAt: now, SchemaVersion: SCHEMA_VERSION,
    }));

  meta("LeagueName", state.league);
  meta("DraftType", state.type);
  meta("Rounds", state.rounds);
  meta("NumTeams", teams.length);
  meta("Started", state.started ? "1" : "0");
  meta("CurrentPickNumber", state.picks.length + 1);
  meta("LastSavedAt", now);

  teams.forEach((team, i) =>
    rows.push(setCells(blankRow(), {
      RowType: "TEAM",
      TeamIndex: i,
      TeamName: team.name,
      TeamPrimaryColor: team.primary,
      TeamSecondaryColor: team.secondary,
      CreatedAt: now,
      SchemaVersion: SCHEMA_VERSION,
    }))
  );

  state.picks.forEach((pk) =>
    rows.push(setCells(blankRow(), {
      RowType: "PICK",
      Round: pk.round,
      Pick: pk.pickInRound,
      OverallPick: pk.overall,
      TeamIndex: pk.teamIndex,
      TeamName: teams[pk.teamIndex]?.name ?? "",
      TeamPrimaryColor: teams[pk.teamIndex]?.primary ?? "",
      TeamSecondaryColor: teams[pk.teamIndex]?.secondary ?? "",
      PlayerName: pk.player.name,
      Position: pk.player.pos,
      BasePosition: pk.player.basePos || basePosition(pk.player.pos),
      NFLTeam: pk.player.team,
      Rank: pk.player.rank,
      ByeWeek: pk.player.bye,
      Notes: pk.player.notes,
      Status: "drafted",
      CreatedAt: now,
      SchemaVersion: SCHEMA_VERSION,
    }))
  );

  const draftedIds = new Set(state.picks.map((pk) => pk.player.id));
  state.players.forEach((p) => {
    const status = draftedIds.has(p.id) ? "drafted" : "available";
    if (p.manual || status === "available") {
      rows.push(setCells(blankRow(), {
        RowType: p.manual ? "MANUAL" : "AVAILABLE",
        PlayerName: p.name,
        Position: p.pos,
        BasePosition: p.basePos || basePosition(p.pos),
        NFLTeam: p.team,
        Rank: p.rank,
        ByeWeek: p.bye,
        Status: status,
        Notes: p.notes,
        CreatedAt: now,
        SchemaVersion: SCHEMA_VERSION,
      }));
    }
  });

  return toCSV(rows);
}

export function parseRestoreCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { error: "File is empty." };
  const header = rows[0];
  const col = (name) => header.indexOf(name);
  if (col("RowType") < 0) return { error: "Not a valid restore file: missing RowType column." };
  const get = (row, name) => {
    const i = col(name);
    return i >= 0 && i < row.length ? row[i] : "";
  };

  const meta = {};
  const teams = [];
  const pickRows = [];
  const playerRows = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const type = get(r, "RowType");
    if (type === "META") meta[get(r, "Key")] = get(r, "Value");
    if (type === "TEAM") {
      teams.push({
        index: Number(get(r, "TeamIndex")),
        name: get(r, "TeamName"),
        primary: get(r, "TeamPrimaryColor"),
        secondary: get(r, "TeamSecondaryColor"),
      });
    }
    if (type === "PICK") pickRows.push(r);
    if (type === "AVAILABLE" || type === "MANUAL") playerRows.push({ r, manual: type === "MANUAL" });
  }

  const version = rows.slice(1).map((r) => get(r, "SchemaVersion")).find(Boolean);
  if (version && version !== SCHEMA_VERSION) {
    return { error: `Unsupported schema version "${version}". Expected ${SCHEMA_VERSION}.` };
  }
  if (!teams.length) return { error: "Not a valid restore file: no TEAM rows found." };

  teams.sort((a, b) => a.index - b.index);
  const restoredTeams = normaliseTeams(teams, teams.length);
  const players = [];
  const picks = pickRows
    .map((r) => {
      const player = rowToPlayer(get, r, false);
      players.push(player);
      return {
        round: Number(get(r, "Round")),
        pickInRound: Number(get(r, "Pick")),
        overall: Number(get(r, "OverallPick")),
        teamIndex: Number(get(r, "TeamIndex")),
        player,
      };
    })
    .sort((a, b) => a.overall - b.overall);

  playerRows.forEach(({ r, manual }) => {
    const p = rowToPlayer(get, r, manual);
    if (manual && get(r, "Status") === "drafted") {
      const match = players.find((x) => x.name === p.name && x.pos === p.pos && x.team === p.team);
      if (match) { match.manual = true; return; }
    }
    players.push(p);
  });

  return {
    state: {
      league: meta.LeagueName || "My League",
      type: meta.DraftType === "linear" ? "linear" : "snake",
      rounds: Math.max(1, Number(meta.Rounds) || 1),
      teams: restoredTeams,
      started: meta.Started === "1" || picks.length > 0,
      players,
      picks,
    },
  };
}

export function buildResultsCSV(state) {
  const teams = normaliseTeams(state.teams || state.teamNames, state.teams?.length || state.teamNames?.length || 4);
  const rows = [[
    "Round", "Pick", "OverallPick", "TeamName", "PlayerName",
    "Position", "BasePosition", "NFLTeam", "Rank", "ByeWeek", "Notes",
  ]];
  [...state.picks]
    .sort((a, b) => a.overall - b.overall)
    .forEach((pk) =>
      rows.push([
        pk.round,
        pk.pickInRound,
        pk.overall,
        teams[pk.teamIndex]?.name ?? "",
        pk.player.name,
        pk.player.pos,
        pk.player.basePos || basePosition(pk.player.pos),
        pk.player.team,
        pk.player.rank,
        pk.player.bye,
        pk.player.notes,
      ].map(String))
    );
  return toCSV(rows);
}
