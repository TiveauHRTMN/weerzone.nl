import { z } from "zod";

import { intervalContains, intervalsOverlap, isISODate, toISODate } from "./dates";
import { INTEREST_IDS } from "./interests";
import type { TripPreviewRequest } from "./model";

const identifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Gebruik een geldige interne identifier.");

const isoDateSchema = z
  .string()
  .refine(isISODate, "Gebruik een geldige datum in YYYY-MM-DD-formaat.")
  .transform(toISODate);

const stopSchema = z.object({
  regionId: identifierSchema,
  destinationClusterId: identifierSchema.optional(),
  arrivalDate: isoDateSchema,
  departureDate: isoDateSchema,
});

export const tripPreviewRequestSchema = z
  .object({
    countryId: identifierSchema,
    arrivalDate: isoDateSchema,
    departureDate: isoDateSchema,
    travelers: z.object({
      adults: z.number().int().min(1).max(12),
      childAges: z.array(z.number().int().min(0).max(17)).max(8),
    }),
    interests: z.array(z.enum(INTEREST_IDS)).min(1).max(INTEREST_IDS.length),
    stops: z.array(stopSchema).min(1).max(8),
  })
  .superRefine((request, context) => {
    if (request.arrivalDate >= request.departureDate) {
      context.addIssue({
        code: "custom",
        path: ["departureDate"],
        message: "De vertrekdatum moet na de aankomstdatum liggen.",
      });
      return;
    }

    if (new Set(request.interests).size !== request.interests.length) {
      context.addIssue({ code: "custom", path: ["interests"], message: "Kies iedere interesse maximaal één keer." });
    }

    request.stops.forEach((stop, index) => {
      if (stop.arrivalDate >= stop.departureDate) {
        context.addIssue({
          code: "custom",
          path: ["stops", index, "departureDate"],
          message: "Een verblijf moet minimaal één nacht duren.",
        });
      }

      if (!intervalContains(request, stop)) {
        context.addIssue({
          code: "custom",
          path: ["stops", index],
          message: "Ieder verblijf moet binnen de totale reisperiode vallen.",
        });
      }

      const previous = request.stops[index - 1];
      if (previous && stop.arrivalDate < previous.arrivalDate) {
        context.addIssue({
          code: "custom",
          path: ["stops", index, "arrivalDate"],
          message: "Verblijfslocaties moeten chronologisch zijn geordend.",
        });
      } else if (previous && intervalsOverlap(previous, stop)) {
        context.addIssue({
          code: "custom",
          path: ["stops", index, "arrivalDate"],
          message: "Verblijfslocaties mogen niet overlappen.",
        });
      }
    });
  });

export type TripPreviewRequestInput = z.input<typeof tripPreviewRequestSchema>;

type SearchParamRecord = Record<string, string | string[] | undefined>;
type PreviewSearchParams = URLSearchParams | SearchParamRecord | string;

function readParam(searchParams: URLSearchParams | SearchParamRecord, key: string): string | undefined {
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}
export function encodeTripPreviewRequest(input: TripPreviewRequest): string {
  const request = tripPreviewRequestSchema.parse(input);
  const params = new URLSearchParams({
    country: request.countryId,
    arrival: request.arrivalDate,
    departure: request.departureDate,
    adults: String(request.travelers.adults),
    interests: request.interests.join(","),
    stops: request.stops
      .map((stop) =>
        [stop.regionId, stop.arrivalDate, stop.departureDate, stop.destinationClusterId ?? ""].join("~"),
      )
      .join("|"),
  });

  if (request.travelers.childAges.length > 0) {
    params.set("children", request.travelers.childAges.join(","));
  }

  return params.toString();
}

export function parseTripPreviewSearchParams(input: PreviewSearchParams): TripPreviewRequest {
  const searchParams = typeof input === "string" ? new URLSearchParams(input) : input;
  const childAges = readParam(searchParams, "children");
  const interests = readParam(searchParams, "interests");
  const stops = readParam(searchParams, "stops");

  return tripPreviewRequestSchema.parse({
    countryId: readParam(searchParams, "country"),
    arrivalDate: readParam(searchParams, "arrival"),
    departureDate: readParam(searchParams, "departure"),
    travelers: {
      adults: Number(readParam(searchParams, "adults")),
      childAges: childAges ? childAges.split(",").map(Number) : [],
    },
    interests: interests ? interests.split(",") : [],
    stops: stops
      ? stops.split("|").map((encodedStop) => {
          const [regionId, arrivalDate, departureDate, destinationClusterId] = encodedStop.split("~");
          return {
            regionId,
            arrivalDate,
            departureDate,
            ...(destinationClusterId ? { destinationClusterId } : {}),
          };
        })
      : [],
  });
}
