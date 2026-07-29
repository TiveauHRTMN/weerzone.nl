import type { TravelOption } from "@/domain/travel-options/model";

export type TravelOptionQuery = {
  destinationId: string;
  regionId?: string;
  date: string;
};

export interface TravelOptionRepository {
  findAvailable(query: TravelOptionQuery): Promise<TravelOption[]>;
}
