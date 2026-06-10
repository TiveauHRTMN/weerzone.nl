/* Hartman WK Poule — data laag (WK 2026, officiële loting 5 dec 2025) */
(function () {
  // ---------- Teams: officiële 48, met vlag-specs (SVG, viewBox 30x20) ----------
  const T = {
    // Poule A
    MEX: { name: 'Mexico', fl: { b: ['v', '#006847', '#ffffff', '#CE1126'], o: [{ t: 'c', cx: 15, cy: 10, r: 1.7, c: '#8a6a42' }] } },
    RSA: { name: 'Zuid-Afrika', fl: { b: ['h', '#E03C31', '#002395'], o: [
      { t: 'r', x: 0, y: 7, w: 30, h: 6, c: '#ffffff' }, { t: 'r', x: 0, y: 7.8, w: 30, h: 4.4, c: '#007A4D' },
      { t: 'p', d: '0,0 13,10 0,20', c: '#ffffff' }, { t: 'p', d: '0,1.6 10.5,10 0,18.4', c: '#000000' }] } },
    KOR: { name: 'Zuid-Korea', fl: { b: ['solid', '#ffffff'], o: [
      { t: 'path', d: 'M11,10 A4,4 0 0,1 19,10 A2,2 0 0,1 15,10 A2,2 0 0,0 11,10 Z', c: '#C60C30' },
      { t: 'path', d: 'M11,10 A4,4 0 0,0 19,10 A2,2 0 0,0 15,10 A2,2 0 0,1 11,10 Z', c: '#003478' },
      { t: 'l', x1: 4.5, y1: 5.2, x2: 7, y2: 6.8, c: '#000', sw: 0.5 }, { t: 'l', x1: 23, y1: 13.2, x2: 25.5, y2: 14.8, c: '#000', sw: 0.5 }] } },
    CZE: { name: 'Tsjechië', fl: { b: ['h', '#ffffff', '#D7141A'], o: [{ t: 'p', d: '0,0 13,10 0,20', c: '#11457E' }] } },
    // Poule B
    CAN: { name: 'Canada', fl: { b: ['solid', '#ffffff'], o: [
      { t: 'r', x: 0, y: 0, w: 7.5, h: 20, c: '#FF0000' }, { t: 'r', x: 22.5, y: 0, w: 7.5, h: 20, c: '#FF0000' },
      { t: 's', cx: 15, cy: 10, r: 3.2, c: '#FF0000' }] } },
    BIH: { name: 'Bosnië', fl: { b: ['solid', '#002395'], o: [{ t: 'p', d: '8,0 23,0 23,20', c: '#FECB00' }] } },
    QAT: { name: 'Qatar', fl: ['v', '#ffffff', '#8A1538', '#8A1538', '#8A1538', '#8A1538'] },
    SUI: { name: 'Zwitserland', fl: { b: ['solid', '#D52B1E'], o: [
      { t: 'r', x: 12.7, y: 5.6, w: 4.6, h: 8.8, c: '#ffffff' }, { t: 'r', x: 10.5, y: 7.8, w: 9, h: 4.4, c: '#ffffff' }] } },
    // Poule C
    BRA: { name: 'Brazilië', fl: { b: ['solid', '#009C3B'], o: [
      { t: 'p', d: '15,2 28,10 15,18 2,10', c: '#FEDF00' }, { t: 'c', cx: 15, cy: 10, r: 3.4, c: '#002776' }] } },
    MAR: { name: 'Marokko', fl: { b: ['solid', '#C1272D'], o: [{ t: 's', cx: 15, cy: 10, r: 4, c: 'none', stroke: '#006233', sw: 0.9 }] } },
    HAI: { name: 'Haïti', fl: ['h', '#00209F', '#D21034'] },
    SCO: { name: 'Schotland', fl: { b: ['solid', '#0065BF'], o: [
      { t: 'l', x1: 0, y1: 0, x2: 30, y2: 20, c: '#ffffff', sw: 3.2 }, { t: 'l', x1: 30, y1: 0, x2: 0, y2: 20, c: '#ffffff', sw: 3.2 }] } },
    // Poule D
    USA: { name: 'Verenigde Staten', fl: { b: ['rep', '#B22234', '#ffffff', 13], o: [{ t: 'r', x: 0, y: 0, w: 13, h: 10.8, c: '#3C3B6E' }] } },
    PAR: { name: 'Paraguay', fl: ['h', '#D52B1E', '#ffffff', '#0038A8'] },
    AUS: { name: 'Australië', fl: { b: ['solid', '#00247D'], o: [
      { t: 'r', x: 0, y: 0, w: 12, h: 10, c: '#012169' },
      { t: 'l', x1: 0, y1: 0, x2: 12, y2: 10, c: '#ffffff', sw: 1.4 }, { t: 'l', x1: 12, y1: 0, x2: 0, y2: 10, c: '#ffffff', sw: 1.4 },
      { t: 'r', x: 5, y: 0, w: 2, h: 10, c: '#ffffff' }, { t: 'r', x: 0, y: 4, w: 12, h: 2, c: '#ffffff' },
      { t: 'r', x: 5.5, y: 0, w: 1, h: 10, c: '#E4002B' }, { t: 'r', x: 0, y: 4.5, w: 12, h: 1, c: '#E4002B' },
      { t: 's', cx: 6, cy: 15, r: 2, c: '#ffffff' }, { t: 's', cx: 22, cy: 7, r: 1.1, c: '#ffffff' },
      { t: 's', cx: 25, cy: 12, r: 1.1, c: '#ffffff' }, { t: 's', cx: 21, cy: 14, r: 1.1, c: '#ffffff' }, { t: 's', cx: 26, cy: 16.5, r: 0.8, c: '#ffffff' }] } },
    TUR: { name: 'Turkije', fl: { b: ['solid', '#E30A17'], o: [
      { t: 'c', cx: 13, cy: 10, r: 4, c: '#ffffff' }, { t: 'c', cx: 14.3, cy: 10, r: 3.2, c: '#E30A17' }, { t: 's', cx: 18.4, cy: 10, r: 1.7, c: '#ffffff' }] } },
    // Poule E
    GER: { name: 'Duitsland', fl: ['h', '#000000', '#DD0000', '#FFCE00'] },
    CUW: { name: 'Curaçao', fl: { b: ['solid', '#002B7F'], o: [
      { t: 'r', x: 0, y: 14, w: 30, h: 3, c: '#F9D90F' }, { t: 's', cx: 6, cy: 5, r: 1.6, c: '#ffffff' }, { t: 's', cx: 9, cy: 7.5, r: 1.1, c: '#ffffff' }] } },
    CIV: { name: 'Ivoorkust', fl: ['v', '#F77F00', '#ffffff', '#009E60'] },
    ECU: { name: 'Ecuador', fl: ['h', '#FFDD00', '#FFDD00', '#034EA2', '#ED1C24'] },
    // Poule F
    NED: { name: 'Nederland', fl: ['h', '#AE1C28', '#ffffff', '#21468B'] },
    JPN: { name: 'Japan', fl: { b: ['solid', '#ffffff'], o: [{ t: 'c', cx: 15, cy: 10, r: 4, c: '#BC002D' }] } },
    SWE: { name: 'Zweden', fl: { b: ['solid', '#006AA7'], o: [{ t: 'r', x: 9, y: 0, w: 3.4, h: 20, c: '#FECC02' }, { t: 'r', x: 0, y: 8.3, w: 30, h: 3.4, c: '#FECC02' }] } },
    TUN: { name: 'Tunesië', fl: { b: ['solid', '#E70013'], o: [
      { t: 'c', cx: 15, cy: 10, r: 5, c: '#ffffff' }, { t: 'c', cx: 15.4, cy: 10, r: 2.6, c: '#E70013' }, { t: 'c', cx: 16.7, cy: 10, r: 2.2, c: '#ffffff' }, { t: 's', cx: 16.3, cy: 10, r: 1.3, c: '#E70013' }] } },
    // Poule G
    BEL: { name: 'België', fl: ['v', '#000000', '#FAE042', '#ED2939'] },
    EGY: { name: 'Egypte', fl: { b: ['h', '#CE1126', '#ffffff', '#000000'], o: [{ t: 's', cx: 15, cy: 10, r: 2, c: '#C09300' }] } },
    IRN: { name: 'Iran', fl: ['h', '#239F40', '#ffffff', '#DA0000'] },
    NZL: { name: 'Nieuw-Zeeland', fl: { b: ['solid', '#00247D'], o: [
      { t: 'r', x: 0, y: 0, w: 12, h: 10, c: '#012169' },
      { t: 'l', x1: 0, y1: 0, x2: 12, y2: 10, c: '#ffffff', sw: 1.2 }, { t: 'l', x1: 12, y1: 0, x2: 0, y2: 10, c: '#ffffff', sw: 1.2 },
      { t: 'r', x: 5, y: 0, w: 2, h: 10, c: '#ffffff' }, { t: 'r', x: 0, y: 4, w: 12, h: 2, c: '#ffffff' },
      { t: 'r', x: 5.5, y: 0, w: 1, h: 10, c: '#CC142B' }, { t: 'r', x: 0, y: 4.5, w: 12, h: 1, c: '#CC142B' },
      { t: 's', cx: 22, cy: 6, r: 1.2, c: '#CC142B' }, { t: 's', cx: 25, cy: 11, r: 1.2, c: '#CC142B' }, { t: 's', cx: 21, cy: 13, r: 1.2, c: '#CC142B' }, { t: 's', cx: 24.5, cy: 16, r: 0.9, c: '#CC142B' }] } },
    // Poule H
    ESP: { name: 'Spanje', fl: ['h', '#AA151B', '#F1BF00', '#F1BF00', '#AA151B'] },
    CPV: { name: 'Kaapverdië', fl: { b: ['solid', '#003893'], o: [
      { t: 'r', x: 0, y: 11, w: 30, h: 1.6, c: '#ffffff' }, { t: 'r', x: 0, y: 12.6, w: 30, h: 1.6, c: '#CF2027' }, { t: 'r', x: 0, y: 14.2, w: 30, h: 1.6, c: '#ffffff' },
      { t: 's', cx: 11, cy: 13, r: 1.4, c: '#F7D116' }] } },
    KSA: { name: 'Saoedi-Arabië', fl: { b: ['solid', '#006C35'], o: [{ t: 'r', x: 6, y: 12.6, w: 18, h: 0.9, c: '#ffffff' }] } },
    URU: { name: 'Uruguay', fl: { b: ['solid', '#ffffff'], o: [
      { t: 'r', x: 0, y: 4.4, w: 30, h: 2.2, c: '#0038A8' }, { t: 'r', x: 0, y: 8.9, w: 30, h: 2.2, c: '#0038A8' }, { t: 'r', x: 0, y: 13.3, w: 30, h: 2.2, c: '#0038A8' }, { t: 'r', x: 0, y: 17.8, w: 30, h: 2.2, c: '#0038A8' },
      { t: 'r', x: 0, y: 0, w: 11, h: 11, c: '#ffffff' }, { t: 's', cx: 5.5, cy: 5.2, r: 2.4, c: '#FCD116', ir: 1, stroke: '#7B5300', sw: 0.3 }] } },
    // Poule I
    FRA: { name: 'Frankrijk', fl: ['v', '#002395', '#ffffff', '#ED2939'] },
    SEN: { name: 'Senegal', fl: { b: ['v', '#00853F', '#FDEF42', '#E31B23'], o: [{ t: 's', cx: 15, cy: 10, r: 2.4, c: '#00853F' }] } },
    IRQ: { name: 'Irak', fl: ['h', '#CE1126', '#ffffff', '#000000'] },
    NOR: { name: 'Noorwegen', fl: { b: ['solid', '#BA0C2F'], o: [
      { t: 'r', x: 8.3, y: 0, w: 4.4, h: 20, c: '#ffffff' }, { t: 'r', x: 0, y: 7.8, w: 30, h: 4.4, c: '#ffffff' },
      { t: 'r', x: 9.3, y: 0, w: 2.4, h: 20, c: '#00205B' }, { t: 'r', x: 0, y: 8.8, w: 30, h: 2.4, c: '#00205B' }] } },
    // Poule J
    ARG: { name: 'Argentinië', fl: { b: ['h', '#75AADB', '#ffffff', '#75AADB'], o: [{ t: 'c', cx: 15, cy: 10, r: 1.8, c: '#F6B40E' }] } },
    ALG: { name: 'Algerije', fl: { b: ['v', '#006233', '#ffffff'], o: [
      { t: 'c', cx: 15, cy: 10, r: 3.4, c: '#D21034' }, { t: 'c', cx: 16.3, cy: 10, r: 2.7, c: '#ffffff' }, { t: 's', cx: 17.2, cy: 10, r: 1.5, c: '#D21034' }] } },
    AUT: { name: 'Oostenrijk', fl: ['h', '#ED2939', '#ffffff', '#ED2939'] },
    JOR: { name: 'Jordanië', fl: { b: ['h', '#000000', '#ffffff', '#007A3D'], o: [{ t: 'p', d: '0,0 12,10 0,20', c: '#CE1126' }, { t: 's', cx: 4.4, cy: 10, r: 1.3, c: '#ffffff' }] } },
    // Poule K
    POR: { name: 'Portugal', fl: { b: ['v', '#006600', '#006600', '#FF0000', '#FF0000', '#FF0000'], o: [{ t: 'c', cx: 12, cy: 10, r: 2.3, c: '#FFD000' }, { t: 'c', cx: 12, cy: 10, r: 1.3, c: '#003399' }] } },
    COD: { name: 'DR Congo', fl: { b: ['solid', '#007FFF'], o: [
      { t: 'l', x1: 0, y1: 20, x2: 30, y2: 0, c: '#F7D618', sw: 5 }, { t: 'l', x1: 0, y1: 20, x2: 30, y2: 0, c: '#CE1021', sw: 3 }, { t: 's', cx: 4.5, cy: 4, r: 2, c: '#F7D618' }] } },
    UZB: { name: 'Oezbekistan', fl: ['h', '#0099B5', '#ffffff', '#1EB53A'] },
    COL: { name: 'Colombia', fl: ['h', '#FCD116', '#FCD116', '#003893', '#CE1126'] },
    // Poule L
    ENG: { name: 'Engeland', fl: { b: ['solid', '#ffffff'], o: [{ t: 'r', x: 12.5, y: 0, w: 5, h: 20, c: '#CF142B' }, { t: 'r', x: 0, y: 7.5, w: 30, h: 5, c: '#CF142B' }] } },
    CRO: { name: 'Kroatië', fl: ['h', '#FF0000', '#ffffff', '#171796'] },
    GHA: { name: 'Ghana', fl: { b: ['h', '#CE1126', '#FCD116', '#006B3F'], o: [{ t: 's', cx: 15, cy: 10, r: 2.6, c: '#000000' }] } },
    PAN: { name: 'Panama', fl: { b: ['solid', '#ffffff'], o: [
      { t: 'r', x: 15, y: 0, w: 15, h: 10, c: '#D21034' }, { t: 'r', x: 0, y: 10, w: 15, h: 10, c: '#005293' },
      { t: 's', cx: 7.5, cy: 5, r: 2.2, c: '#005293' }, { t: 's', cx: 22.5, cy: 15, r: 2.2, c: '#D21034' }] } },
  };

  // ---------- Speelsteden (16 host cities, met weer) ----------
  const cities = [
    { city: 'New York', stad: 'MetLife Stadium', weer: { t: 23, c: 'sun' } },
    { city: 'Los Angeles', stad: 'SoFi Stadium', weer: { t: 27, c: 'sun' } },
    { city: 'Dallas', stad: 'AT&T Stadium', weer: { t: 33, c: 'sun' } },
    { city: 'Atlanta', stad: 'Mercedes-Benz Stadium', weer: { t: 28, c: 'part' } },
    { city: 'Miami', stad: 'Hard Rock Stadium', weer: { t: 30, c: 'rain' } },
    { city: 'Houston', stad: 'NRG Stadium', weer: { t: 31, c: 'part' } },
    { city: 'Boston', stad: 'Gillette Stadium', weer: { t: 21, c: 'part' } },
    { city: 'Philadelphia', stad: 'Lincoln Financial Field', weer: { t: 25, c: 'sun' } },
    { city: 'Seattle', stad: 'Lumen Field', weer: { t: 19, c: 'cloud' } },
    { city: 'Kansas City', stad: 'Arrowhead Stadium', weer: { t: 29, c: 'part' } },
    { city: 'Toronto', stad: 'BMO Field', weer: { t: 20, c: 'cloud' } },
    { city: 'Vancouver', stad: 'BC Place', weer: { t: 18, c: 'cloud' } },
    { city: 'Mexico-Stad', stad: 'Estadio Azteca', weer: { t: 22, c: 'part' } },
    { city: 'Guadalajara', stad: 'Estadio Akron', weer: { t: 26, c: 'sun' } },
    { city: 'Monterrey', stad: 'Estadio BBVA', weer: { t: 32, c: 'sun' } },
    { city: 'San Francisco', stad: "Levi's Stadium", weer: { t: 24, c: 'part' } },
  ];

  // ---------- Poules (officiële loting) ----------
  const groups = [
    { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
    { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
    { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
    { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
    { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
    { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
    { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
    { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
    { id: 'I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
    { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
    { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
    { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
  ];

  // ---------- Puntensysteem ----------
  const POINTS = {
    exact: 100,
    outcome: 50,
    teamGoals: 25,
    scorer: 35,
    firstScorer: 75,
    perfectMatch: 150,
    joker: 2,
    champion: 500,
    fantasy: { appearance: 1, goal: 5, assist: 3, yellow: -2, red: -7 },
  };

  const outcome = (score) => score[0] > score[1] ? 'home' : score[0] < score[1] ? 'away' : 'draw';

  function scoreMatchPrediction(opts) {
    if (!opts || !opts.pred || !opts.result) return {
      total: 0, base: 0, bonus: 0, perfect: 0, joker: false,
      parts: { exact: false, outcome: false, homeGoals: false, awayGoals: false, scorer: false, firstScorer: false },
    };

    const parts = {
      exact: opts.pred[0] === opts.result[0] && opts.pred[1] === opts.result[1],
      outcome: outcome(opts.pred) === outcome(opts.result),
      homeGoals: opts.pred[0] === opts.result[0],
      awayGoals: opts.pred[1] === opts.result[1],
      scorer: !!opts.scorerCorrect,
      firstScorer: !!opts.firstScorerCorrect,
    };
    const base = parts.exact
      ? POINTS.exact
      : (parts.outcome ? POINTS.outcome : 0)
        + (parts.homeGoals ? POINTS.teamGoals : 0)
        + (parts.awayGoals ? POINTS.teamGoals : 0);
    const bonus = (parts.scorer ? POINTS.scorer : 0) + (parts.firstScorer ? POINTS.firstScorer : 0);
    const perfect = parts.exact && parts.scorer && parts.firstScorer ? POINTS.perfectMatch : 0;
    const raw = base + bonus + perfect;
    return { total: opts.joker ? raw * POINTS.joker : raw, base, bonus, perfect, joker: !!opts.joker, parts };
  }

  // ---------- Speelschema ----------
  // Nederlandse weergavetijden voor de Hartman WK Poule. Geen fake generator meer.
  const cityAliases = { 'New York/New Jersey': 'New York' };
  const cityByName = Object.fromEntries(cities.map((c) => [c.city, c]));
  function venue(city) {
    return cityByName[cityAliases[city] || city] || { city, stad: city, weer: { t: 22, c: 'part' } };
  }
  function row(id, round, gid, date, time, h, a, city, matchNo) {
    const c = venue(city);
    return { id, gid, round, date, time, h, a, city, stad: c.stad, weer: c.weer, status: 'open', pred: null, matchNo };
  }

  const matches = [
    row(1, 1, 'A', '2026-06-11', '21:00', 'MEX', 'RSA', 'Mexico-Stad'),
    row(2, 1, 'A', '2026-06-12', '04:00', 'KOR', 'CZE', 'Guadalajara'),
    row(3, 2, 'A', '2026-06-18', '18:00', 'CZE', 'RSA', 'Atlanta'),
    row(4, 2, 'A', '2026-06-19', '03:00', 'MEX', 'KOR', 'Guadalajara'),
    row(5, 3, 'A', '2026-06-25', '03:00', 'CZE', 'MEX', 'Mexico-Stad'),
    row(6, 3, 'A', '2026-06-25', '03:00', 'RSA', 'KOR', 'Monterrey'),

    row(7, 1, 'B', '2026-06-12', '21:00', 'CAN', 'BIH', 'Toronto'),
    row(8, 1, 'B', '2026-06-13', '21:00', 'QAT', 'SUI', 'San Francisco'),
    row(9, 2, 'B', '2026-06-18', '21:00', 'SUI', 'BIH', 'Los Angeles'),
    row(10, 2, 'B', '2026-06-19', '00:00', 'CAN', 'QAT', 'Vancouver'),
    row(11, 3, 'B', '2026-06-24', '21:00', 'SUI', 'CAN', 'Vancouver'),
    row(12, 3, 'B', '2026-06-24', '21:00', 'BIH', 'QAT', 'Seattle'),

    row(13, 1, 'C', '2026-06-14', '00:00', 'BRA', 'MAR', 'New York/New Jersey'),
    row(14, 1, 'C', '2026-06-14', '03:00', 'HAI', 'SCO', 'Boston'),
    row(15, 2, 'C', '2026-06-20', '00:00', 'SCO', 'MAR', 'Boston'),
    row(16, 2, 'C', '2026-06-20', '02:30', 'BRA', 'HAI', 'Philadelphia'),
    row(17, 3, 'C', '2026-06-25', '00:00', 'SCO', 'BRA', 'Miami'),
    row(18, 3, 'C', '2026-06-25', '00:00', 'MAR', 'HAI', 'Atlanta'),

    row(19, 1, 'D', '2026-06-13', '03:00', 'USA', 'PAR', 'Los Angeles'),
    row(20, 1, 'D', '2026-06-13', '06:00', 'AUS', 'TUR', 'Vancouver'),
    row(21, 2, 'D', '2026-06-19', '06:00', 'TUR', 'PAR', 'San Francisco'),
    row(22, 2, 'D', '2026-06-19', '21:00', 'USA', 'AUS', 'Seattle'),
    row(23, 3, 'D', '2026-06-26', '04:00', 'TUR', 'USA', 'Los Angeles'),
    row(24, 3, 'D', '2026-06-26', '04:00', 'PAR', 'AUS', 'San Francisco'),

    row(25, 1, 'E', '2026-06-14', '19:00', 'GER', 'CUW', 'Houston'),
    row(26, 1, 'E', '2026-06-15', '01:00', 'CIV', 'ECU', 'Philadelphia'),
    row(27, 2, 'E', '2026-06-20', '22:00', 'GER', 'CIV', 'Toronto'),
    row(28, 2, 'E', '2026-06-21', '02:00', 'ECU', 'CUW', 'Kansas City'),
    row(29, 3, 'E', '2026-06-25', '22:00', 'ECU', 'GER', 'New York/New Jersey'),
    row(30, 3, 'E', '2026-06-25', '22:00', 'CUW', 'CIV', 'Philadelphia'),

    row(31, 1, 'F', '2026-06-14', '22:00', 'NED', 'JPN', 'Dallas'),
    row(32, 1, 'F', '2026-06-15', '04:00', 'SWE', 'TUN', 'Monterrey'),
    row(33, 2, 'F', '2026-06-20', '06:00', 'TUN', 'JPN', 'Monterrey'),
    row(34, 2, 'F', '2026-06-20', '19:00', 'NED', 'SWE', 'Houston'),
    row(35, 3, 'F', '2026-06-26', '01:00', 'JPN', 'SWE', 'Dallas'),
    row(36, 3, 'F', '2026-06-26', '01:00', 'TUN', 'NED', 'Kansas City'),

    row(37, 1, 'G', '2026-06-15', '21:00', 'BEL', 'EGY', 'Seattle'),
    row(38, 1, 'G', '2026-06-16', '03:00', 'IRN', 'NZL', 'Los Angeles'),
    row(39, 2, 'G', '2026-06-21', '21:00', 'BEL', 'IRN', 'Los Angeles'),
    row(40, 2, 'G', '2026-06-22', '03:00', 'NZL', 'EGY', 'Vancouver'),
    row(41, 3, 'G', '2026-06-27', '05:00', 'EGY', 'IRN', 'Seattle'),
    row(42, 3, 'G', '2026-06-27', '05:00', 'NZL', 'BEL', 'Vancouver'),

    row(43, 1, 'H', '2026-06-15', '18:00', 'ESP', 'CPV', 'Atlanta'),
    row(44, 1, 'H', '2026-06-16', '00:00', 'KSA', 'URU', 'Miami'),
    row(45, 2, 'H', '2026-06-21', '18:00', 'ESP', 'KSA', 'Atlanta'),
    row(46, 2, 'H', '2026-06-22', '00:00', 'URU', 'CPV', 'Miami'),
    row(47, 3, 'H', '2026-06-27', '02:00', 'CPV', 'KSA', 'Houston'),
    row(48, 3, 'H', '2026-06-27', '02:00', 'URU', 'ESP', 'Guadalajara'),

    row(49, 1, 'I', '2026-06-16', '21:00', 'FRA', 'SEN', 'New York/New Jersey'),
    row(50, 1, 'I', '2026-06-17', '00:00', 'IRQ', 'NOR', 'Boston'),
    row(51, 2, 'I', '2026-06-22', '23:00', 'FRA', 'IRQ', 'Philadelphia'),
    row(52, 2, 'I', '2026-06-23', '02:00', 'NOR', 'SEN', 'New York/New Jersey'),
    row(53, 3, 'I', '2026-06-26', '21:00', 'NOR', 'FRA', 'Boston'),
    row(54, 3, 'I', '2026-06-26', '21:00', 'SEN', 'IRQ', 'Toronto'),

    row(55, 1, 'J', '2026-06-16', '06:00', 'AUT', 'JOR', 'San Francisco'),
    row(56, 1, 'J', '2026-06-17', '03:00', 'ARG', 'ALG', 'Kansas City'),
    row(57, 2, 'J', '2026-06-22', '19:00', 'ARG', 'AUT', 'Dallas'),
    row(58, 2, 'J', '2026-06-23', '05:00', 'JOR', 'ALG', 'San Francisco'),
    row(59, 3, 'J', '2026-06-28', '04:00', 'ALG', 'AUT', 'Kansas City'),
    row(60, 3, 'J', '2026-06-28', '04:00', 'JOR', 'ARG', 'Dallas'),

    row(61, 1, 'K', '2026-06-17', '19:00', 'POR', 'COD', 'Houston'),
    row(62, 1, 'K', '2026-06-18', '04:00', 'UZB', 'COL', 'Mexico-Stad'),
    row(63, 2, 'K', '2026-06-23', '19:00', 'POR', 'UZB', 'Houston'),
    row(64, 2, 'K', '2026-06-24', '04:00', 'COL', 'COD', 'Guadalajara'),
    row(65, 3, 'K', '2026-06-28', '01:30', 'COL', 'POR', 'Miami'),
    row(66, 3, 'K', '2026-06-28', '01:30', 'COD', 'UZB', 'Atlanta'),

    row(67, 1, 'L', '2026-06-17', '22:00', 'ENG', 'CRO', 'Dallas'),
    row(68, 1, 'L', '2026-06-18', '01:00', 'GHA', 'PAN', 'Toronto'),
    row(69, 2, 'L', '2026-06-23', '22:00', 'ENG', 'GHA', 'Boston'),
    row(70, 2, 'L', '2026-06-24', '01:00', 'PAN', 'CRO', 'Toronto'),
    row(71, 3, 'L', '2026-06-27', '23:00', 'PAN', 'ENG', 'New York/New Jersey'),
    row(72, 3, 'L', '2026-06-27', '23:00', 'CRO', 'GHA', 'Philadelphia'),

    row(73, 4, 'KO', '2026-06-28', '21:00', 'Nummer 2 Poule A', 'Nummer 2 Poule B', 'Los Angeles', 73),
    row(76, 4, 'KO', '2026-06-29', '19:00', 'Winnaar Poule C', 'Nummer 2 Poule F', 'Houston', 76),
    row(74, 4, 'KO', '2026-06-29', '22:30', 'Winnaar Poule E', 'Nummer 3 Poule A/B/C/D/F', 'Boston', 74),
    row(75, 4, 'KO', '2026-06-30', '03:00', 'Winnaar Poule F', 'Nummer 2 Poule C', 'Monterrey', 75),
    row(78, 4, 'KO', '2026-06-30', '19:00', 'Nummer 2 Poule E', 'Nummer 2 Poule I', 'Dallas', 78),
    row(77, 4, 'KO', '2026-06-30', '23:00', 'Winnaar Poule I', 'Nummer 3 Poule C/D/F/G/H', 'New York/New Jersey', 77),
    row(79, 4, 'KO', '2026-07-01', '03:00', 'Winnaar Poule A', 'Nummer 3 Poule C/E/F/H/I', 'Mexico-Stad', 79),
    row(80, 4, 'KO', '2026-07-01', '18:00', 'Winnaar Poule L', 'Nummer 3 Poule E/H/I/J/K', 'Atlanta', 80),
    row(82, 4, 'KO', '2026-07-01', '22:00', 'Winnaar Poule G', 'Nummer 3 Poule A/E/H/I/J', 'San Francisco', 82),
    row(81, 4, 'KO', '2026-07-02', '02:00', 'Winnaar Poule D', 'Nummer 3 Poule B/E/F/I/J', 'Seattle', 81),
    row(84, 4, 'KO', '2026-07-02', '21:00', 'Winnaar Poule H', 'Nummer 2 Poule J', 'Los Angeles', 84),
    row(83, 4, 'KO', '2026-07-03', '01:00', 'Nummer 2 Poule K', 'Nummer 2 Poule L', 'Toronto', 83),
    row(85, 4, 'KO', '2026-07-03', '05:00', 'Winnaar Poule B', 'Nummer 3 Poule E/F/G/I/J', 'Vancouver', 85),
    row(88, 4, 'KO', '2026-07-03', '20:00', 'Nummer 2 Poule D', 'Nummer 2 Poule G', 'Dallas', 88),
    row(86, 4, 'KO', '2026-07-04', '00:00', 'Winnaar Poule J', 'Nummer 2 Poule H', 'Miami', 86),
    row(87, 4, 'KO', '2026-07-04', '03:30', 'Winnaar Poule K', 'Nummer 3 Poule D/E/I/J/L', 'Kansas City', 87),

    row(90, 5, 'KO', '2026-07-04', '19:00', 'Winnaar duel 73', 'Winnaar duel 75', 'Houston', 90),
    row(89, 5, 'KO', '2026-07-04', '23:00', 'Winnaar duel 74', 'Winnaar duel 77', 'Philadelphia', 89),
    row(91, 5, 'KO', '2026-07-05', '22:00', 'Winnaar duel 76', 'Winnaar duel 78', 'New York/New Jersey', 91),
    row(92, 5, 'KO', '2026-07-06', '02:00', 'Winnaar duel 79', 'Winnaar duel 80', 'Mexico-Stad', 92),
    row(93, 5, 'KO', '2026-07-06', '21:00', 'Winnaar duel 83', 'Winnaar duel 84', 'Dallas', 93),
    row(94, 5, 'KO', '2026-07-07', '02:00', 'Winnaar duel 81', 'Winnaar duel 82', 'Seattle', 94),
    row(95, 5, 'KO', '2026-07-07', '18:00', 'Winnaar duel 86', 'Winnaar duel 88', 'Atlanta', 95),
    row(96, 5, 'KO', '2026-07-07', '22:00', 'Winnaar duel 85', 'Winnaar duel 87', 'Vancouver', 96),

    row(97, 6, 'KO', '2026-07-09', '22:00', 'Winnaar duel 89', 'Winnaar duel 90', 'Boston', 97),
    row(98, 6, 'KO', '2026-07-10', '21:00', 'Winnaar duel 93', 'Winnaar duel 94', 'Los Angeles', 98),
    row(99, 6, 'KO', '2026-07-11', '23:00', 'Winnaar duel 91', 'Winnaar duel 92', 'Miami', 99),
    row(100, 6, 'KO', '2026-07-12', '03:00', 'Winnaar duel 95', 'Winnaar duel 96', 'Kansas City', 100),

    row(101, 7, 'KO', '2026-07-14', '21:00', 'Winnaar duel 97', 'Winnaar duel 98', 'Dallas', 101),
    row(102, 7, 'KO', '2026-07-15', '21:00', 'Winnaar duel 99', 'Winnaar duel 100', 'Atlanta', 102),
    row(103, 8, 'KO', '2026-07-18', '23:00', 'Verliezer duel 101', 'Verliezer duel 102', 'Miami', 103),
    row(104, 9, 'KO', '2026-07-19', '21:00', 'Winnaar duel 101', 'Winnaar duel 102', 'New York/New Jersey', 104),
  ];

  // ---------- Standen ----------
  function standings(gid) {
    const g = groups.find((x) => x.id === gid);
    const rows = {};
    g.teams.forEach((t) => rows[t] = { code: t, sp: 0, w: 0, g: 0, v: 0, dv: 0, dt: 0, pt: 0 });
    matches.filter((m) => m.gid === gid && m.status === 'done').forEach((m) => {
      const [hg, ag] = m.result; const H = rows[m.h], A = rows[m.a];
      H.sp++; A.sp++; H.dv += hg; H.dt += ag; A.dv += ag; A.dt += hg;
      if (hg > ag) { H.w++; A.v++; H.pt += 3; } else if (hg < ag) { A.w++; H.v++; A.pt += 3; } else { H.g++; A.g++; H.pt++; A.pt++; }
    });
    return Object.values(rows).map((r) => ({ ...r, saldo: r.dv - r.dt }))
      .sort((a, b) => b.pt - a.pt || b.saldo - a.saldo || b.dv - a.dv);
  }
  const tables = {}; groups.forEach((g) => tables[g.id] = standings(g.id));

  // ---------- Joker (×2) — één per speelronde ----------
  // ---------- Mijn totaal ----------
  const myTotal = matches.filter((m) => m.status === 'done' && typeof m.pts === 'number').reduce((s, m) => s + m.pts, 0);
  const myExact = matches.filter((m) => m.hit === 'exact').length;
  const myToto = matches.filter((m) => m.hit === 'toto').length;

  // ---------- Deelnemers ----------
  // factor t.o.v. mijn totaal (zo schaalt de stand mee met het puntensysteem)
  const people = [{ name: 'Jij', pts: myTotal, d: 0, exact: myExact, rond: 0, me: true }];

  // ---------- Bonusvragen ----------
  const bonus = [
    { q: 'Wereldkampioen', a: 'Brazilië', team: 'BRA', pts: 15 },
    { q: 'Verliezend finalist', a: 'Spanje', team: 'ESP', pts: 8 },
    { q: 'Topscorer', a: 'Kylian Mbappé', sub: 'Frankrijk', pts: 10 },
    { q: 'Hoe ver komt Nederland?', a: 'Kwartfinale', pts: 8 },
    { q: 'Verrassing van het toernooi', a: 'Senegal', team: 'SEN', pts: 6 },
    { q: 'Aantal goals in het toernooi', a: '169', pts: 5 },
  ];

  window.WK = {
    T, cities, groups, matches, tables, people, bonus,
    myTotal, myExact, myToto,
    points: POINTS,
    scoreMatchPrediction,
    standings,
    rounds: [
      { n: 1, label: 'Speelronde 1', sub: '11 – 14 juni' },
      { n: 2, label: 'Speelronde 2', sub: '17 – 20 juni' },
      { n: 3, label: 'Speelronde 3', sub: '24 – 27 juni' },
    ],
  };
})();
