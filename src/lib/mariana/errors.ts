import type {
  MarianaActualInput,
  MarianaForecastError,
  MarianaForecastInput,
  MarianaForecastVariables,
} from "./types";

const ERROR_VARIABLES: Array<keyof MarianaForecastVariables> = [
  "temperature",
  "precipitation",
  "windSpeed",
  "windGusts",
  "pressure",
  "humidity",
];

export function calculateForecastError(
  forecast: MarianaForecastInput & { id?: string },
  actual: MarianaActualInput
): MarianaForecastError {
  const errors: MarianaForecastError["errors"] = {};
  const absoluteErrors: MarianaForecastError["absoluteErrors"] = {};

  for (const variable of ERROR_VARIABLES) {
    const predicted = forecast.variables[variable];
    const observed = actual.variables[variable];
    if (
      typeof predicted === "number" &&
      Number.isFinite(predicted) &&
      typeof observed === "number" &&
      Number.isFinite(observed)
    ) {
      const error = Number((predicted - observed).toFixed(3));
      errors[variable] = error;
      absoluteErrors[variable] = Math.abs(error);
    }
  }

  return {
    forecastId: forecast.id,
    modelName: forecast.modelName,
    locationId: forecast.location.locationId,
    forecastTimestamp: forecast.forecastTimestamp,
    validAt: forecast.validAt,
    forecastHorizon: forecast.forecastHorizon,
    errors,
    absoluteErrors,
  };
}
