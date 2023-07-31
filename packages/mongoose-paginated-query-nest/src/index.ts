import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const paginatedQueryPlugin = aggregatePaginate;

export * from './decorators';
export * from './pipes';
export * from './query';
export * from './types';
