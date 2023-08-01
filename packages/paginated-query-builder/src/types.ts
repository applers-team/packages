import { SortDirection } from './constants';

export interface Sorting {
  path: string;
  direction: SortDirection;
}

export type FilterOptions = Record<string, unknown>;

export interface PaginatedQueryUrlPathPaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedQueryUrlPathOptions {
  pagination?: PaginatedQueryUrlPathPaginationOptions;
  sort?: Sorting[];
  filter?: FilterOptions;
  search?: string;
}
