import { QueryFilterParams } from './decorators/query-filter.decorator';
import { SortOrder } from './decorators/query-sort.decorator';

export type PopulationOptions = {
  localField: string;
  targetCollection: string;
  targetIsArray?: boolean;
  targetField?: string;
};

export type AggregationPaginatedQueryPipelineOptions = {
  populate: PopulationOptions[];
  filter: QueryFilterParams;
  search: string;
  sort: SortOrder[];
};

export type PaginatedMongoQueryOptions =
  AggregationPaginatedQueryPipelineOptions & {
    page: number;
    pageSize: number;
  };
