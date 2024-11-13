import { mapValues, pickBy } from 'lodash';
import { PipelineStage } from 'mongoose';
import {
  IncludeFilterSuffix,
  QueryFilterConcreteParams,
  QuerySearchParams,
  SortOrder,
} from './decorators';
import {
  AggregationPaginatedQueryPipelineOptions,
  PaginatedMongoQueryOptions,
  PaginatedQueryModel,
  PaginatedQueryResult,
  PopulationOptions,
} from './types';

/*
 * stage ids:
 * 1. search
 * 2. idFilter
 * 3. populate
 * 4. filter
 * 5. regexFilter
 * 6. sort
 * */
export function paginatedMongoQuery<ModelType = any, ReturnType = ModelType>(
  model: PaginatedQueryModel<ModelType>,
  options: PaginatedMongoQueryOptions,
): Promise<PaginatedQueryResult<ReturnType>> {
  const { page, pageSize, ...aggregationPaginatedQueryPipelineOptions } =
    options;

  return model.aggregatePaginate(
    model.aggregate(
      createPaginatedQueryAggregationPipeline(
        aggregationPaginatedQueryPipelineOptions,
      ),
    ),
    {
      page,
      limit: pageSize,
    },
  ) as Promise<PaginatedQueryResult<ReturnType>>;
}

/*
 * stage ids:
 * 1. search
 * 2. idFilter
 * 3. populate
 * 4. filter
 * 5. regexFilter
 * 6. sort
 * */
export function createPaginatedQueryAggregationPipeline(
  options: AggregationPaginatedQueryPipelineOptions,
): PipelineStage[] {
  return [
    ...(options.customStages?.first || []),

    // search stages
    ...(options.customStages?.preSearch || []),
    ...(options.search
      ? createSearchAggregationPipelineStages(options.search)
      : []),

    // idFilter stages
    ...(options.customStages?.preIdFilter || []),
    ...(options.filter && options.filter.idFilter
      ? createFilterAggregationPipelineStages(options.filter.idFilter)
      : []),

    // populate stages
    ...(options.customStages?.prePopulate || []),
    ...(options.populate
      ? options.populate
          .map((populationOptions) =>
            createPopulateAggregationPipelineStages(populationOptions),
          )
          .flat()
      : []),

    // filter stages
    ...(options.customStages?.preFilter || []),
    ...(options.filter && options.filter.normalFilter
      ? createFilterAggregationPipelineStages(options.filter.normalFilter)
      : []),

    // regexFilter stages
    ...(options.customStages?.preRegexFilter || []),
    ...(options.filter?.regexFilter
      ? createRegexFilterAggregationPipelineStages(options.filter.regexFilter)
      : []),

    // sort stages
    ...(options.customStages?.preSort || []),
    ...(options.sort ? createSortAggregationPipelineStages(options.sort) : []),

    ...(options.customStages?.last || []),
  ];
}

export function createSortAggregationPipelineStages(
  sortOrder: SortOrder[],
): PipelineStage[] {
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

export function createPopulateAggregationPipelineStages({
  localField,
  targetCollection,
  projection,
  targetIsArray,
  targetField,
  populateToField,
  nested,
}: PopulationOptions): Exclude<
  PipelineStage,
  PipelineStage.Merge | PipelineStage.Out
>[] {
  return [
    {
      $lookup: {
        from: targetCollection,
        localField: localField,
        foreignField: targetField ?? '_id',
        as: populateToField ?? localField,
        ...(nested && {
          pipeline: nested
            .map((nestedPopulationOptions) =>
              createPopulateAggregationPipelineStages(nestedPopulationOptions),
            )
            .flat(),
        }),
        ...(projection &&
          Object.keys(projection).length > 0 && {
            pipeline: [
              {
                $project: projection,
              },
            ],
          }),
      },
    },
    ...(!targetIsArray
      ? [
          {
            $unwind: {
              path: `$${populateToField ?? localField}`,
              preserveNullAndEmptyArrays: true,
            },
          },
        ]
      : []),
  ];
}

function createFilterAggregationPipelineStages(
  filter: QueryFilterConcreteParams,
): PipelineStage[] {
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

function createRegexFilterAggregationPipelineStages(
  filter: QueryFilterConcreteParams,
): PipelineStage[] {
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
          ...mapValues(normalFilters, (value) => ({
            $regex: new RegExp(value, 'i'),
          })),
          // ...Object.keys(includeFilters).reduce(
          //   (includeFilter, currentFilter) => ({
          //     ...includeFilter,
          //     [currentFilter.substring(
          //       0,
          //       currentFilter.length - IncludeFilterSuffix.length,
          //     )]: {
          //       $in: includeFilters[currentFilter],
          //     },
          //   }),
          //   {},
          // ),
        },
      },
    ];
  } else {
    return [];
  }
}

function createSearchAggregationPipelineStages(
  search: QuerySearchParams,
): PipelineStage[] {
  return Object.keys(search).length > 0
    ? [
        {
          $match: {
            $or: Object.keys(search).map((searchKey) => ({
              [searchKey]: { $regex: new RegExp(search[searchKey], 'i') },
            })),
          },
        },
      ]
    : [];
}
