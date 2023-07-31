import { createParamDecorator } from '@nestjs/common';
import { isString, trimStart } from 'lodash';

export type SortOrder = {
  key: string;
  order: 'asc' | 'desc';
};

function extractSortOrder(sort?: string): SortOrder[] {
  return (sort ?? '')
    .split(',')
    .filter((entry) => !!entry)
    .map((key) => ({
      key: trimStart(key, '-'),
      order: key.startsWith('-') ? 'desc' : 'asc',
    }));
}

export const QuerySort = createParamDecorator((data, input): SortOrder[] => {
  const request = input.switchToHttp().getRequest();
  const queryParams = request.query ?? {};
  return extractSortOrder(isString(queryParams.sort) ? queryParams.sort : '');
});
