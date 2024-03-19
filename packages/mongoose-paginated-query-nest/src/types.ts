import { QueryFilterParams, SortOrder } from './decorators';
import mongoose, { PipelineStage } from 'mongoose';
import { SetPropType } from './util.set-prop-type';

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
export type PaginatedQueryResult<T> = SetPropType<
  mongoose.AggregatePaginateResult<T>,
  'page',
  number
>;
