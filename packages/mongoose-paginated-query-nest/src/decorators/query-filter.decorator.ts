import { createParamDecorator } from '@nestjs/common';
import { mapKeys, mapValues, pickBy } from 'lodash';
import { isDateString } from 'class-validator';
import { Types } from 'mongoose';

type ValuePreparationFunctions = ((value: any) => any)[];

export type QueryFilterConcreteParams = Record<
  string,
  string | number | boolean | any | string[]
>;
export type QueryFilterParams = {
  normalFilter: QueryFilterConcreteParams;
  idFilter: QueryFilterConcreteParams;
  regexFilter: Record<string, string>;
};

const FilterPrefix = 'filter.';
export const IncludeFilterSuffix = '._includes_';
export const IdFilterSuffix = '._id_';
export const RegexFilterSuffix = '._regex_';

// https://stackoverflow.com/a/175787/5464761
function isNumeric(str: string) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export const QueryFilter = createParamDecorator(
  (data, input): QueryFilterParams => {
    const request = input.switchToHttp().getRequest();
    const queryParams = request.query ?? {};
    const rawFilters = mapKeys(
      pickBy(queryParams, (_, key) => key.startsWith(FilterPrefix)),
      (_, key) => key.substring(FilterPrefix.length),
    );
    const normalFilterParams = pickBy(
      rawFilters,
      (value, key) =>
        !key.includes(IdFilterSuffix) && !key.includes(RegexFilterSuffix),
    );

    const idFilterParams = mapKeys(
      pickBy(rawFilters, (value, key) => key.includes(IdFilterSuffix)),
      (_, key) => key.replace(IdFilterSuffix, ''),
    );
    const regexFilterParams = mapKeys(
      pickBy(rawFilters, (value, key) => key.includes(RegexFilterSuffix)),
      (_, key) => key.replace(RegexFilterSuffix, ''),
    );

    return {
      normalFilter: prepareQueryParams(normalFilterParams, [
        prepareForPossibleDate,
      ]),
      idFilter: prepareQueryParams(idFilterParams, [
        prepareForPossibleObjectId,
        prepareForPossibleDate,
      ]),
      regexFilter: regexFilterParams,
    };
  },
);

function prepareQueryParams(
  params: Record<string, any>,
  prepareValueFunctions: ValuePreparationFunctions,
): QueryFilterConcreteParams {
  const preparationFunction = createPreparationFunctionWith(
    prepareValueFunctions,
  );

  return mapValues(params, (value, key) => {
    if (key.endsWith(IncludeFilterSuffix)) {
      return value && value !== ''
        ? value.split(',').map((entry: string) => preparationFunction(entry))
        : [];
    } else if (isNumeric(value)) {
      return parseFloat(value);
    } else if (['true', 'false'].includes(value)) {
      return value === 'true';
    } else {
      try {
        const parsed = JSON.parse(value);
        return mapValues(parsed, (subValue) => preparationFunction(subValue));
      } catch {
        return preparationFunction(value);
      }
    }
  });
}

function createPreparationFunctionWith(handlers: ValuePreparationFunctions) {
  return (value: any) =>
    handlers.reduce(
      (currentValue, currentFunc) => currentFunc(currentValue),
      value,
    );
}

function prepareForPossibleObjectId(value: any) {
  try {
    return new Types.ObjectId(value);
  } catch {
    return value;
  }
}

// for mongoose, we have to convert it to actual js Date objects
function prepareForPossibleDate(value: any) {
  return isDateString(value) ? new Date(value) : value;
}
