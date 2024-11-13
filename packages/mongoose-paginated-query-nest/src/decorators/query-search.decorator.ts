import { createParamDecorator } from '@nestjs/common';
import { mapKeys, pickBy } from 'lodash';

const SearchPrefix = 'search.';
export type QuerySearchParams = Record<string, string>;

export const QuerySearch = createParamDecorator(
  (data, input): QuerySearchParams => {
    const request = input.switchToHttp().getRequest();
    const queryParams = request.query ?? {};

    return mapKeys(
      pickBy(queryParams, (_, key) => key.startsWith(SearchPrefix)),
      (_, key) => key.substring(SearchPrefix.length),
    );
  },
);
