import { QueryFilterParams, SortOrder } from './decorators';
import mongoose, { PipelineStage } from 'mongoose';

export type PopulationOptions = {
  localField: string;
  targetCollection: string;
  projection?: Record<string, 1 | -1>;
  targetIsArray?: boolean;
  targetField?: string;
  populateToField?: string;
  nested?: PopulationOptions[];
};

export type AggregationPaginatedQueryPipelineCustomStages = {
  preSearch?: PipelineStage[];
  preIdFilter?: PipelineStage[];
  prePopulate?: PipelineStage[];
  preFilter?: PipelineStage[];
  preRegexFilter?: PipelineStage[];
  preSort?: PipelineStage[];
  first?: PipelineStage[];
  last?: PipelineStage[];
};

export type AggregationPaginatedQueryPipelineOptions = {
  populate?: PopulationOptions[];
  filter?: QueryFilterParams;
  search?: string;
  sort?: SortOrder[];
  customStages?: AggregationPaginatedQueryPipelineCustomStages;
};

export type PaginatedMongoQueryOptions =
  AggregationPaginatedQueryPipelineOptions & {
    page: number;
    pageSize: number;
  };

export type PaginatedQueryModel<T> = mongoose.AggregatePaginateModel<T>;
// TODO: derive from mongoose.AggregatePaginateResult<T>
export type PaginatedQueryResult<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  nextPage?: number | null | undefined;
  prevPage?: number | null | undefined;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
};
