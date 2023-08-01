import { isPlainObject, isString } from 'lodash';
import { FilterOptions, PaginatedQueryUrlPathOptions, Sorting } from './types';
import {
  DefaultFilterKeyInUrl,
  DefaultPageKeyInUrl,
  DefaultPageSizeKeyInUrl,
  DefaultSearchKeyInUrl,
  DefaultSortingKeyInUrl,
} from './constants';

export function createPaginatedQueryUrlPath(
  path: string,
  { pagination, sort, filter, search }: PaginatedQueryUrlPathOptions,
  pageKeyInUrl = DefaultPageKeyInUrl,
  pageSizeKeyInUrl = DefaultPageSizeKeyInUrl,
  sortingKeyInUrl = DefaultSortingKeyInUrl,
  filterKeyInUrl = DefaultFilterKeyInUrl,
  searchKeyInUrl = DefaultSearchKeyInUrl,
): string {
  return createQueryUrlPath(path, {
    ...(pagination && {
      [pageKeyInUrl]: pagination.page.toString(),
      [pageSizeKeyInUrl]: pagination.pageSize.toString(),
    }),
    ...(sort && sortingToQueryParam(sort, sortingKeyInUrl)),
    ...(filter && filterToQueryParam(filter, filterKeyInUrl)),
    ...(search && searchToQueryParam(search, searchKeyInUrl)),
  });
}

export function createQueryUrlPath(
  path: string,
  params: Record<string, string> = {},
): string {
  const url = new URL(path, 'https://dummy.com');

  Object.keys(params).forEach((key) => {
    url.searchParams.append(key, params[key]);
  });

  return url.pathname + (url.search ? url.search : '');
}

export function sortingToQueryParam(
  sorting: Sorting[],
  sortKeyInUrl = DefaultSortingKeyInUrl,
) {
  return Array.isArray(sorting) && sorting.length > 0
    ? {
        [sortKeyInUrl]: sorting
          .map(
            (entry) => `${entry.direction === 'desc' ? '-' : ''}${entry.path}`,
          )
          .join(','),
      }
    : {};
}

export function filterToQueryParam(
  filter: FilterOptions,
  filterPrefixInUrl = DefaultFilterKeyInUrl,
) {
  const filterKeys = filter ? Object.keys(filter) : [];
  return filterKeys.length > 0
    ? filterKeys.reduce(
        (params, filterKey) => ({
          ...params,
          [`${filterPrefixInUrl}.${filterKey}`]: isPlainObject(
            filter[filterKey],
          )
            ? JSON.stringify(filter[filterKey])
            : filter[filterKey],
        }),
        {},
      )
    : {};
}

export function searchToQueryParam(
  search: string,
  searchKeyInUrl = DefaultSearchKeyInUrl,
) {
  return isString(search) && search.length > 0
    ? { [searchKeyInUrl]: search }
    : {};
}
