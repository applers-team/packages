import { createParamDecorator } from '@nestjs/common';
import { isString } from 'lodash';

export const QuerySearch = createParamDecorator((data, input): string => {
  const request = input.switchToHttp().getRequest();
  const queryParams = request.query ?? {};
  return isString(queryParams.search) ? queryParams.search : '';
});
