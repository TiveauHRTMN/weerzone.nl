export interface WeatherScenario {
  id: string;
  name: string;
  description: string;
  oracle: {
    regimeName: string;
    convectiveGate: "INACTIVE" | "ACTIVATE";
    runTime: string;
    confidence: number;
    regimeSummary?: string;
    pressurePattern?: string;
    ridgeAxisAssessment?: string;
    jetstreamAssessment?: string;
    airmassAssessment?: string;
    h850Trend?: string;
    h700CapSignal?: string;
    h500Pattern?: string;
    frontTroughTiming?: string;
    regimeShiftWatch?: boolean;
    scenarioTree?: Array<{
      scenario: string;
      probability: number;
      driver: string;
      confirmation_signal: string;
      failure_signal: string;
    }>;
    modelConflict?: {
      level: string;
      type: string[];
      summary: string;
    };
    domainImpacts?: {
      temperature: string;
      rain: string;
      wind: string;
      thunder: string;
      pollen: string;
      comfort: string;
    };
    confidenceScores?: {
      regime: number;
      temperature_trend: number;
      precipitation_regime: number;
      wind_regime: number;
      convective_gate: number;
      model_agreement: number;
    };
  };
  tesla: {
    cape: number; // J/kg
    cin: number;  // J/kg
    windShear: number; // m/s
    supercellComposite: number; // Index 0..10
    lightningStrikes: number; // per minute
    alertLevel: "GREEN" | "AMBER" | "RED" | "CRIMSON";
    convectiveRegime?: string;
    synopticSetup?: string;
    modelConsensus?: string;
    capeAssessment?: string;
    cinStatus?: string;
    effectiveCinAssessment?: string;
    triggerAlignment?: string;
    timingWindow?: string;
    initiationZone?: string;
    upstreamHijackRisk?: boolean;
    seedCellWatch?: boolean;
    peakCorridor?: string;
    expectedMode?: string;
    inflowOutflowExpectation?: string;
    dutchMesoscaleFactors?: string[];
    founderInputAssessment?: string;
    confidenceScores?: {
      initiation: number;
      thunder: number;
      severe: number;
      upscale: number;
      timing: number;
      location: number;
      model_agreement: number;
      founder_signal_weight: number;
    };
    failureModes?: string[];
    reedAction?: string;
    reasoningChain?: string[];
  };
  models: {
    harmonie: number;
    arome: number;
    icon: number;
    ecmwf: number;
    gfs: number;
  };
  piet: {
    advice: string;
    referToReed: boolean;
  };
  koos: {
    comfortScore: number;
    bestDestination: string;
    distance: number;
    reason: string;
  };
}

export const SCENARIOS: WeatherScenario[] = [
  {
    id: "quiet_summer",
    name: "Scenario 1: Calm Summer Weather",
    description: "High-pressure system. Stable conditions, sunny and warm. No convective threat.",
    oracle: {
      regimeName: "Subtropical High (Azores Ridge)",
      convectiveGate: "INACTIVE",
      runTime: "06:00 UTC",
      confidence: 94,
      regimeSummary: "Persistent high-pressure ridge over Central Europe bringing dry, subsident air mass.",
      pressurePattern: "High pressure over the Netherlands, center ~1025 hPa near Denmark.",
      ridgeAxisAssessment: "Ridge axis aligned SW-NE directly over the North Sea.",
      jetstreamAssessment: "Jet stream shifted far north near Iceland, weak zonal winds over the Benelux.",
      airmassAssessment: "Warm, dry Continental-Subtropical air mass with low dew points.",
      h850Trend: "850 hPa temperatures warming gradually to +15°C.",
      h700CapSignal: "Strong subsidence cap at 700 hPa, prohibiting vertical cloud development.",
      h500Pattern: "Flat ridge at 500 hPa, no vorticity advection.",
      frontTroughTiming: "No frontal systems expected in the next 120 hours.",
      regimeShiftWatch: false,
      scenarioTree: [
        {
          scenario: "Subtropical ridge extension",
          probability: 0.80,
          driver: "Azores high expansion",
          confirmation_signal: "Surface temperatures > 25°C",
          failure_signal: "Trough breakthrough from northwest"
        },
        {
          scenario: "Weak Atlantic cold front passage",
          probability: 0.20,
          driver: "Low pressure near northern UK",
          confirmation_signal: "Offshore cloud development",
          failure_signal: "Persistent ridge capping"
        }
      ],
      modelConflict: {
        level: "low",
        type: ["None"],
        summary: "Excellent agreement between ECMWF, GFS, and ICON on ridge persistence."
      },
      domainImpacts: {
        temperature: "Warm & stable (+23°C to +26°C)",
        rain: "0.0 mm (None)",
        wind: "Light breeze (2-4 m/s)",
        thunder: "0% probability",
        pollen: "High (grass pollen alert)",
        comfort: "High comfort index"
      },
      confidenceScores: {
        regime: 0.95,
        temperature_trend: 0.92,
        precipitation_regime: 0.98,
        wind_regime: 0.94,
        convective_gate: 0.99,
        model_agreement: 0.96
      }
    },
    tesla: {
      cape: 120,
      cin: 150,
      windShear: 5,
      supercellComposite: 0.1,
      lightningStrikes: 0,
      alertLevel: "GREEN",
    },
    models: {
      harmonie: 0.45,
      arome: 0.42,
      icon: 0.40,
      ecmwf: 0.58,
      gfs: 0.52,
    },
    piet: {
      advice: "Beautiful stable summer conditions. Dry, sunny, and perfect cycling weather. Sunscreen application is recommended.",
      referToReed: false,
    },
    koos: {
      comfortScore: 0.88,
      bestDestination: "Domburg (Zeeland)",
      distance: 142,
      reason: "Enjoy a refreshing breeze near the coast at 24°C under blue skies. Inland areas remain hot and humid.",
    },
  },
  {
    id: "severe_thunderstorm",
    name: "Scenario 2: Pre-frontal Convection (Reed Timmer Level)",
    description: "Extreme convective activity. A shortwave trough is advecting warm, moist, highly unstable air from France.",
    oracle: {
      regimeName: "Moist-Unstable Trough (Spanish Plume)",
      convectiveGate: "ACTIVATE",
      runTime: "12:00 UTC",
      confidence: 89,
      regimeSummary: "Spanish Plume setup. Advection of highly unstable, warm theta-e air in the lower troposphere, overridden by a fast-moving upper-level trough.",
      pressurePattern: "Low pressure over southern UK and France, thermal low building over Germany.",
      ridgeAxisAssessment: "Ridge axis shifting eastwards into Germany, opening the convective corridor.",
      jetstreamAssessment: "Strong jet streak on the eastern flank of the trough, positioning the Benelux in the left exit region (favorable for upward motion).",
      airmassAssessment: "Extremely warm and moist air mass with dew points rising to 18-21°C.",
      h850Trend: "850 hPa temp peaking at +19°C before trough arrival.",
      h700CapSignal: "Elevated Mixed Layer (EML) capping until late afternoon thermal trigger.",
      h500Pattern: "Deep shortwave trough advancing from the Bay of Biscay.",
      frontTroughTiming: "Pre-frontal convergence line crossing south-western border around 14:00 UTC.",
      regimeShiftWatch: true,
      scenarioTree: [
        {
          scenario: "Severe pre-frontal MCS / Supercells",
          probability: 0.70,
          driver: "Trough dynamics & EML break",
          confirmation_signal: "Rapid tower development on radar",
          failure_signal: "CAP remains unbroken"
        },
        {
          scenario: "Isolated elevated convective cells",
          probability: 0.30,
          driver: "Weakened daytime heating",
          confirmation_signal: "Lightning offshore",
          failure_signal: "Strong capping in boundary layer"
        }
      ],
      modelConflict: {
        level: "medium",
        type: ["Timing", "Initiation"],
        summary: "HARMONIE initiates convection 2 hours earlier than AROME; GFS underestimates CAPE."
      },
      domainImpacts: {
        temperature: "Hot & humid (+28°C to +31°C)",
        rain: "Local downpours > 30mm/hr",
        wind: "Severe gusts > 90 km/h near storm cells",
        thunder: "High probability of severe electrical storms",
        pollen: "Low (washed out by rain)",
        comfort: "Extremely oppressive comfort index"
      },
      confidenceScores: {
        regime: 0.90,
        temperature_trend: 0.88,
        precipitation_regime: 0.85,
        wind_regime: 0.82,
        convective_gate: 0.95,
        model_agreement: 0.80
      }
    },
    tesla: {
      cape: 2850,
      cin: 15,
      windShear: 26,
      supercellComposite: 7.8,
      lightningStrikes: 84,
      alertLevel: "CRIMSON",
      convectiveRegime: "Severe convective outbreak / Spanish Plume transition",
      synopticSetup: "Left-exit region of 500 hPa jet streak over convergence line",
      modelConsensus: "High-resolution models agree on severe convective storm threat; disagreement remains on storm mode (supercellular vs linear upscale).",
      capeAssessment: "SBCAPE exceeding 2800 J/kg, MUCAPE over 3200 J/kg in south-east sectors.",
      cinStatus: "Weakening cap. CIN dropping from -120 J/kg to > -10 J/kg by mid-afternoon.",
      effectiveCinAssessment: "Inhibition completely broken by surface heating and convergent lifting.",
      triggerAlignment: "Excellent alignment of convergence line, surface heating, and upper-level vorticity advection.",
      timingWindow: "14:00 to 22:00 UTC, tracking southwest to northeast.",
      initiationZone: "Southwest coast landfall, propagating into central river systems.",
      upstreamHijackRisk: true,
      seedCellWatch: true,
      peakCorridor: "Southwest-to-Northeast corridor (Zeeland -> Utrecht -> Overijssel)",
      expectedMode: "Discrete supercells transitioning into a linear mesoscale convective system (MCS).",
      inflowOutflowExpectation: "Strong boundary layer inflow (15-20 kts southerly), severe outflow gusts (50+ kts) upon cell collapse.",
      dutchMesoscaleFactors: [
        "IJsselmeer boundary convergence enhancing low-level helicity",
        "Thermal heating over sandy soils of Veluwe acting as regional trigger",
        "Coastal sea breeze boundary providing additional lift near Zuidwest-NL"
      ],
      founderInputAssessment: "Confirmed by local observer network: high dewpoints (>19°C) and towering cumulus observed in Flanders.",
      confidenceScores: {
        initiation: 0.92,
        thunder: 0.98,
        severe: 0.88,
        upscale: 0.85,
        timing: 0.80,
        location: 0.75,
        model_agreement: 0.78,
        founder_signal_weight: 0.85
      },
      failureModes: [
        "Dry air entrainment in mid-levels capping updrafts",
        "Convective cloud debris from morning showers dampening insolation"
      ],
      reedAction: "COMMIT",
      reasoningChain: [
        "High theta-e advection establishes high CAPE environment.",
        "Trough approach provides strong deep-layer shear (50+ kts).",
        "Surface convergence line aligns with breaking cap.",
        "Supercells highly favored initially, with significant wind/hail threat.",
        "Linear transition expected as cold pool consolidates."
      ]
    },
    models: {
      harmonie: 0.76,
      arome: 0.72,
      icon: 0.68,
      ecmwf: 0.42,
      gfs: 0.35,
    },
    piet: {
      advice: "SEVERE WARNING: Severe convective development expected this afternoon with large hail and damaging wind gusts. Avoid open fields.",
      referToReed: true,
    },
    koos: {
      comfortScore: 0.18,
      bestDestination: "None (Code Red)",
      distance: 0,
      reason: "Shelter indoors. The atmospheric profile over the entire Netherlands is explosively unstable. Travel is not recommended.",
    },
  },
  {
    id: "autumn_storm",
    name: "Scenario 3: Early Autumn Gale",
    description: "Deep Atlantic low-pressure system bringing gale-force winds to coastal regions. No convective potential.",
    oracle: {
      regimeName: "Zonal Flow (Atlantic Low-Pressure Train)",
      convectiveGate: "INACTIVE",
      runTime: "04:30 UTC",
      confidence: 91,
      regimeSummary: "Deep Atlantic low tracking north of Scotland, steering strong westerly zonal winds over northern Europe.",
      pressurePattern: "Deep low (980 hPa) near Norway, high pressure (1020 hPa) over Spain.",
      ridgeAxisAssessment: "No active ridge; zonal baroclinic zone.",
      jetstreamAssessment: "Strong jet stream (130 kts) positioned directly over the North Sea.",
      airmassAssessment: "Cool, moist Maritime Polar air mass.",
      h850Trend: "850 hPa temperatures falling to +4°C.",
      h700CapSignal: "No capping, moist profile throughout mid-levels.",
      h500Pattern: "Strong westerly flow with embedded minor waves.",
      frontTroughTiming: "Cold front passage at 08:00 UTC, followed by post-frontal showers.",
      regimeShiftWatch: false,
      scenarioTree: [
        {
          scenario: "Zonal gale with coastal wind gusts",
          probability: 0.90,
          driver: "Low-pressure tracking",
          confirmation_signal: "Gusts > 80 km/h at Wadden",
          failure_signal: "Storm path shifts north"
        },
        {
          scenario: "Minor secondary low development",
          probability: 0.10,
          driver: "Rapid baroclinic leaf development",
          confirmation_signal: "Severe pressure falls",
          failure_signal: "Jet streak misalignment"
        }
      ],
      modelConflict: {
        level: "low",
        type: ["Intensity"],
        summary: "All global models agree on gale-force winds; minor details remain on peak gust speeds."
      },
      domainImpacts: {
        temperature: "Chilly (+12°C to +15°C)",
        rain: "Widespread rain & showers (5-15mm)",
        wind: "Westerly gale 8-9 Bft (gusts > 85 km/h)",
        thunder: "Low (isolated coastal showers)",
        pollen: "Negligible",
        comfort: "Low comfort index due to wind chill"
      },
      confidenceScores: {
        regime: 0.94,
        temperature_trend: 0.90,
        precipitation_regime: 0.88,
        wind_regime: 0.92,
        convective_gate: 0.98,
        model_agreement: 0.95
      }
    },
    tesla: {
      cape: 10,
      cin: 200,
      windShear: 35,
      supercellComposite: 0.0,
      lightningStrikes: 0,
      alertLevel: "AMBER",
    },
    models: {
      harmonie: 0.58,
      arome: 0.50,
      icon: 0.54,
      ecmwf: 0.62,
      gfs: 0.58,
    },
    piet: {
      advice: "Typical autumn gale with persistent rain and wind gusts up to 85 km/h near the shore. Dress warmly and stay clear of wooded areas.",
      referToReed: false,
    },
    koos: {
      comfortScore: 0.35,
      bestDestination: "South Limburg (Hills)",
      distance: 210,
      reason: "The strongest gusts are tracking across the northwestern coastal sectors; the deep south will remain milder and drier.",
    },
  },
];

export function applyFluctuations(base: WeatherScenario): WeatherScenario {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const result = JSON.parse(JSON.stringify(base)) as WeatherScenario;

  if (base.id === "severe_thunderstorm") {
    result.tesla.cape = Math.round(base.tesla.cape + rand(-80, 80));
    result.tesla.cin = Math.max(0, Math.round(base.tesla.cin + rand(-5, 5)));
    result.tesla.windShear = Math.round((base.tesla.windShear + rand(-1, 1)) * 10) / 10;
    result.tesla.supercellComposite = Math.max(0, Math.min(10, Math.round((base.tesla.supercellComposite + rand(-0.3, 0.3)) * 10) / 10));
    result.tesla.lightningStrikes = Math.max(10, Math.round(base.tesla.lightningStrikes + rand(-12, 12)));
  } else if (base.id === "quiet_summer") {
    result.tesla.cape = Math.max(0, Math.round(base.tesla.cape + rand(-5, 5)));
    result.tesla.cin = Math.max(100, Math.round(base.tesla.cin + rand(-10, 10)));
    result.tesla.windShear = Math.max(2, Math.round((base.tesla.windShear + rand(-0.4, 0.4)) * 10) / 10);
  } else if (base.id === "autumn_storm") {
    result.tesla.windShear = Math.round((base.tesla.windShear + rand(-2, 2)) * 10) / 10;
  }

  return result;
}

/** Fetches real-time Mariana Oracle and Tesla info from Supabase. */
export async function loadLiveCascadeData(selectedRegionSlug: string) {
  const response = await fetch(`/api/mariana/cascade?region=${encodeURIComponent(selectedRegionSlug)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Cascade API returned ${response.status}`);
  return response.json() as Promise<{ oracle: any; regions: any[]; tesla: any }>;
}

/** Maps Supabase output records to the WeatherScenario schema structure. */
export function mapLiveToScenario(args: {
  selectedRegionSlug: string;
  regionRow: any;
  liveOracle: any;
  liveTesla: any;
}): WeatherScenario {
  const { selectedRegionSlug, regionRow, liveOracle, liveTesla } = args;

  const isConvective = liveOracle?.convective_gate === "ACTIVATE" || regionRow.tesla_context_used;
  const activeTeslaSignal = liveTesla?.signal || regionRow.signal?.agent_outputs?.reed?.tesla;

  let cape = 150;
  let cin = 140;
  let windShear = 6;
  let supercell = 0.2;
  let lightning = 0;
  let alertLevel: "GREEN" | "AMBER" | "RED" | "CRIMSON" = "GREEN";

  if (isConvective && activeTeslaSignal) {
    const sigLevel = activeTeslaSignal.tesla_signal || 1;
    alertLevel = sigLevel === 3 ? "CRIMSON" : sigLevel === 2 ? "RED" : "AMBER";

    cape = activeTeslaSignal.convective_telemetry?.cape || (sigLevel === 3 ? 2900 : sigLevel === 2 ? 1600 : 750);
    cin = activeTeslaSignal.convective_telemetry?.cin || (sigLevel === 3 ? 10 : sigLevel === 2 ? 45 : 90);
    windShear = activeTeslaSignal.convective_telemetry?.wind_shear || (sigLevel === 3 ? 24 : sigLevel === 2 ? 15 : 10);
    supercell = activeTeslaSignal.convective_telemetry?.supercell_composite || (sigLevel === 3 ? 8.1 : sigLevel === 2 ? 4.2 : 1.8);
    lightning = activeTeslaSignal.convective_telemetry?.lightning_density || (sigLevel === 3 ? 92 : sigLevel === 2 ? 40 : 12);
  }

  return {
    id: `live_${selectedRegionSlug}`,
    name: `Live: ${regionRow.region_name}`,
    description: `Analyzed by ${regionRow.model} at ${new Date(regionRow.run_at).toLocaleTimeString()}`,
    oracle: {
      regimeName: liveOracle?.dominant_regime || "Unknown regime",
      convectiveGate: liveOracle?.convective_gate || "INACTIVE",
      runTime: liveOracle?.run_at ? new Date(liveOracle.run_at).toLocaleTimeString() : "N/A",
      confidence: liveOracle?.signal?.confidence?.regime ? Math.round(liveOracle.signal.confidence.regime * 100) : 90,
      regimeSummary: liveOracle?.signal?.regime_summary,
      pressurePattern: liveOracle?.signal?.pressure_pattern,
      ridgeAxisAssessment: liveOracle?.signal?.ridge_axis_assessment,
      jetstreamAssessment: liveOracle?.signal?.jetstream_assessment,
      airmassAssessment: liveOracle?.signal?.airmass_assessment,
      h850Trend: liveOracle?.signal?.["850hpa_trend"],
      h700CapSignal: liveOracle?.signal?.["700hpa_cap_signal"],
      h500Pattern: liveOracle?.signal?.["500hpa_pattern"],
      frontTroughTiming: liveOracle?.signal?.front_trough_timing,
      regimeShiftWatch: liveOracle?.signal?.regime_shift_watch,
      scenarioTree: liveOracle?.signal?.scenario_tree,
      modelConflict: liveOracle?.signal?.model_conflict,
      domainImpacts: liveOracle?.signal?.domain_impacts,
      confidenceScores: liveOracle?.signal?.confidence,
    },
    tesla: {
      cape,
      cin,
      windShear,
      supercellComposite: supercell,
      lightningStrikes: lightning,
      alertLevel,
      convectiveRegime: activeTeslaSignal?.convective_regime,
      synopticSetup: activeTeslaSignal?.synoptic_setup,
      modelConsensus: activeTeslaSignal?.model_consensus,
      capeAssessment: activeTeslaSignal?.cape_assessment,
      cinStatus: activeTeslaSignal?.cin_status,
      effectiveCinAssessment: activeTeslaSignal?.effective_cin_assessment,
      triggerAlignment: activeTeslaSignal?.trigger_alignment,
      timingWindow: activeTeslaSignal?.timing_window,
      initiationZone: activeTeslaSignal?.initiation_zone,
      upstreamHijackRisk: activeTeslaSignal?.upstream_hijack_risk,
      seedCellWatch: activeTeslaSignal?.seed_cell_watch,
      peakCorridor: activeTeslaSignal?.peak_corridor,
      expectedMode: activeTeslaSignal?.expected_mode,
      inflowOutflowExpectation: activeTeslaSignal?.inflow_outflow_expectation,
      dutchMesoscaleFactors: activeTeslaSignal?.dutch_mesoscale_factors,
      founderInputAssessment: activeTeslaSignal?.founder_input_assessment,
      confidenceScores: activeTeslaSignal?.confidence,
      failureModes: activeTeslaSignal?.failure_modes,
      reedAction: activeTeslaSignal?.reed_action,
      reasoningChain: activeTeslaSignal?.reasoning_chain,
    },
    models: {
      harmonie: regionRow.local_feed?.modelWeights?.HARMONIE || 0.5,
      arome: regionRow.local_feed?.modelWeights?.AROME || 0.5,
      icon: regionRow.local_feed?.modelWeights?.ICON_D2 || 0.5,
      ecmwf: regionRow.local_feed?.modelWeights?.ECMWF || 0.5,
      gfs: regionRow.local_feed?.modelWeights?.GFS || 0.4,
    },
    piet: {
      advice: regionRow.signal?.agent_outputs?.piet?.text || "No Piet data.",
      referToReed: regionRow.signal?.agent_outputs?.piet?.refer_to_reed || false,
    },
    koos: {
      comfortScore: regionRow.local_feed?.confidencePrior || 0.7,
      bestDestination: "N/A",
      distance: 0,
      reason: regionRow.signal?.agent_outputs?.koos?.text || "No Koos data.",
    },
  };
}
