export interface LiveDayRecommendation {
  id: string;
  title: string;
  summary: string;
  factors: string[];
  sourceNotes: string[];
}

export interface LiveDayData {
  tripId: string;
  tripTitle: string;
  destination: string;
  dateLabel: string;
  dayNumber: number;
  totalDays: number;
  updatedLabel: string;
  sinceYesterday: string;
  best: LiveDayRecommendation;
  planB: LiveDayRecommendation;
  alternatives: LiveDayRecommendation[];
  defer: LiveDayRecommendation | null;
  countryPulse: string;
  practical: Array<{ label: string; value: string }>;
  dataNotice: string | null;
}
