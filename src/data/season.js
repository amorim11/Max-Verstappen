// 2026 season. The schedule itself lives in data/calendar.js and advances on
// its own by date — LAST_RACE/NEXT_RACE below just describe whichever races
// that calendar currently points to. What still needs a manual update after
// each race:
//   - RESULTS[round] here: the recap text + stat breakdown, once known.
//   - STANDINGS / SEASON_STATS below: season-cumulative totals.
//   - data/calendar.js: that round's `result`, and — the first time a new
//     circuit shows up — its `gpName`/`circuit`/`circuitKey` (plus the track
//     outline itself in data/circuits.js CIRCUITS).

import { CURRENT_RACE, NEXT_RACE_ENTRY } from './calendar'

export const UPDATED_AT = '29 set 2026'

export const DRIVER = {
  id: 'driver_003',
  number: '3',
  firstName: 'Max',
  lastName: 'Verstappen',
  country: 'Holanda',
  status: 'tetracampeão_mundial',
  team: 'Oracle Red Bull Racing',
}

// Race-by-race recap, keyed by round. Fill this in once a race's real result
// is known — until then, that round shows the "resultado chegando" placeholder.
const RESULTS = {
  14: {
    report:
      'Largou em P3, teve de devolver posições depois do toque com Hamilton na largada e ainda terminou em P2, segurando Lando Norris até a bandeirada na estreia do Madring.',
    stats: [
      { icon: 'flag', label: 'último resultado', value: 'P2' },
      { icon: 'bars', label: 'pontos ganhos', value: '+18' },
      { icon: 'trophy', label: 'campeonato', value: 'P6' },
      { icon: 'gauge', label: 'pontos', value: '145' },
    ],
  },
  15: {
    report:
      'Largou em P8, ganhou posições no início, trocou para os macios no safety car e passou Piastri na relargada da volta 39. Terminou em P2, a só 0,196s de George Russell — dobradinha de pódio da Red Bull com Hadjar em P3.',
    stats: [
      { icon: 'flag', label: 'último resultado', value: 'P2' },
      { icon: 'bars', label: 'pontos ganhos', value: '+18' },
      { icon: 'trophy', label: 'campeonato', value: 'P6' },
      { icon: 'gauge', label: 'pontos', value: '163' },
    ],
  },
}

const PENDING_RESULT = {
  report: 'Corrida disputada — resultado chegando assim que a apuração terminar.',
  stats: [
    { icon: 'flag', label: 'último resultado', value: '—' },
    { icon: 'bars', label: 'pontos ganhos', value: '—' },
    { icon: 'trophy', label: 'campeonato', value: '—' },
    { icon: 'gauge', label: 'pontos', value: '—' },
  ],
}

function describeRace(entry) {
  if (!entry) {
    return { round: null, name: 'calendário em atualização', circuit: 'a definir', circuitKey: null, date: 'a definir', dateTime: null }
  }
  return {
    round: entry.round,
    name: entry.gpName ?? `gp – ${entry.name.toLowerCase()}`,
    circuit: entry.circuit ?? 'circuito a confirmar',
    circuitKey: entry.circuitKey ?? null,
    date: `${entry.date} 2026`,
    dateTime: entry.dateTime,
  }
}

export const NEXT_RACE = describeRace(NEXT_RACE_ENTRY)

export const SEASON_STATS = [
  { label: 'corridas', value: String(CURRENT_RACE.round) },
  { label: 'pódios', value: '7' },
  { label: 'pontos', value: '163' },
]

export const STANDINGS = [
  { value: 'P6', label: 'no campeonato' },
  { value: '0', label: 'vitórias' },
  { value: '7', label: 'pódios.' },
]

export const LAST_RACE = { ...describeRace(CURRENT_RACE), ...(RESULTS[CURRENT_RACE.round] ?? PENDING_RESULT) }
