import { QueryFilterParams } from './decorators/query-filter.decorator';
import { SortOrder } from './decorators/query-sort.decorator';
import mongoose from 'mongoose';

export type PopulationOptions = {
  localField: string;
  targetCollection: string;
  projection?: Record<string, 1 | -1>;
  targetIsArray?: boolean;
  targetField?: string;
};

export type AggregationPaginatedQueryPipelineOptions = {
  populate?: PopulationOptions[];
  filter?: QueryFilterParams;
  search?: string;
  sort?: SortOrder[];
};

export type PaginatedMongoQueryOptions =
  AggregationPaginatedQueryPipelineOptions & {
    page: number;
    pageSize: number;
  };

export type PaginatedQueryModel<T> = mongoose.AggregatePaginateModel<T>;
export type PaginatedQueryResult<T> = mongoose.AggregatePaginateResult<T>;
