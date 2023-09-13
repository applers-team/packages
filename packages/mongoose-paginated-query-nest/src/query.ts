import { isString, pickBy } from 'lodash';
import { PipelineStage } from 'mongoose';
import {
  IncludeFilterSuffix,
  QueryFilterConcreteParams,
  SortOrder,
} from './decorators';
import {
  AggregationPaginatedQueryPipelineOptions,
  PaginatedMongoQueryOptions,
  PaginatedQueryModel,
  PaginatedQueryResult,
} from './types';

export function paginatedMongoQuery<T = any>(
  model: PaginatedQueryModel<T>,
  options: PaginatedMongoQueryOptions,
): Promise<PaginatedQueryResult<T>> {
  const { page, pageSize, ...aggregationPaginatedQueryPipelineOptions } =
    options;

  return model.aggregatePaginate(
    model.aggregate(
      aggregationPaginatedQueryPipeline(
        aggregationPaginatedQueryPipelineOptions,
      ),
    ),
    {
      page,
      limit: pageSize,
    },
  );
}

function aggregationPaginatedQueryPipeline(
  options: AggregationPaginatedQueryPipelineOptions,
): PipelineStage[] {
  return [
    ...(options.search ? aggregationSearch(options.search) : []),
    ...(options.filter && options.filter.idFilter
      ? aggregationQuery(options.filter.idFilter)
      : []),
    ...(options.populate
      ? options.populate
          .map((population) =>
            aggregationPopulate(
              population.localField,
              population.targetCollection,
              population.targetIsArray,
              population.targetField,
            ),
          )
          .flat()
      : []),
    ...(options.filter && options.filter.normalFilter
      ? aggregationQuery(options.filter.normalFilter)
      : []),
    ...(options.sort ? aggregationSort(options.sort) : []),
  ];
}

function aggregationSort(sortOrder: SortOrder[]): PipelineStage[] {
  if (sortOrder.length > 0) {
    const sortMap = new Map();
    sortOrder.forEach((entry) => {
      sortMap.set(`${entry.key}_lowercase`, entry.order === 'asc' ? 1 : -1);
    });
    return [
      {
        $addFields: {
          ...sortOrder.reduce(
            (lowerCaseFields, entry) => ({
              ...lowerCaseFields,
              [`${entry.key}_lowercase`]: { $toLower: `$${entry.key}` },
            }),
            {},
          ),
        },
      },
      {
        // TODO: preserve the order more typesafe
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        $sort: sortMap,
      },
    ];
  } else {
    return [];
  }
}

function aggregationPopulate(
  localField: string,
  targetCollection: string,
  targetIsArray = false,
  targetField = '_id',
): PipelineStage[] {
  return [
    {
      $lookup: {
        from: targetCollection,
        localField: localField,
        foreignField: targetField,
        as: localField,
      },
    },
    ...(!targetIsArray
      ? [
          {
            $unwind: {
              path: `$${localField}`,
              preserveNullAndEmptyArrays: true,
            },
          },
        ]
      : []),
  ];
}

function aggregationQuery(filter: QueryFilterConcreteParams): PipelineStage[] {
  if (Object.keys(filter).length > 0) {
    const normalFilters = pickBy(
      filter,
      (value, key) => !key.endsWith(IncludeFilterSuffix),
    );
    const includeFilters = pickBy(filter, (value, key) =>
      key.endsWith(IncludeFilterSuffix),
    );
    return [
      {
        $match: {
          ...normalFilters,
          ...Object.keys(includeFilters).reduce(
            (includeFilter, currentFilter) => ({
              ...includeFilter,
              [currentFilter.substring(
                0,
                currentFilter.length - IncludeFilterSuffix.length,
              )]: {
                $in: includeFilters[currentFilter],
              },
            }),
            {},
          ),
        },
      },
    ];
  } else {
    return [];
  }
}

function aggregationSearch(search: string): PipelineStage[] {
  return isString(search) && search.length > 0
    ? [
        {
          $match: {
            $text: {
              $search: search,
              $caseSensitive: false,
              $diacriticSensitive: false,
            },
          },
        },
        { $sort: { score: { $meta: 'textScore' } } },
      ]
    : [];
}
