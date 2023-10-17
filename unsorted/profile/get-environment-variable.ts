import defaults from 'lodash/defaults';

export function getMandatoryEnvironmentVariable<T extends string = string>(
  environmentKey: string,
): T {
  const environmentValue = process.env[environmentKey] as T | undefined;

  if (!environmentValue) {
    throw new Error(
      `Environment not set correctly. Key "${environmentKey}" is missing`,
    );
  } else {
    return environmentValue;
  }
}

export function getOptionalEnvironmentVariable<T extends string = string>(
  environmentKey: string,
): T | null {
  try {
    return getMandatoryEnvironmentVariable<T>(environmentKey);
  } catch {
    return null;
  }
}

type EnvironmentValueType = 'string' | 'boolean' | 'number';

type GetEnvironmentVariableOptions = {
  optional?: boolean;
  list?: boolean;
  type?: EnvironmentValueType;
};

type GetEnvironmentVariableReturn<
  Options extends GetEnvironmentVariableOptions = {
    type: 'string';
    list: false;
    optional: false;
  },
> = undefined extends Options['type']
  ? undefined extends Options['list']
    ? undefined extends Options['optional']
      ? string
      : Options['optional'] extends false
      ? string
      : string | null
    : Options['list'] extends false
    ? undefined extends Options['optional']
      ? string
      : Options['optional'] extends false
      ? string
      : string | null
    : undefined extends Options['optional']
    ? string[]
    : Options['optional'] extends false
    ? string[]
    : string[] | null
  : Options['type'] extends 'string'
  ? undefined extends Options['list']
    ? undefined extends Options['optional']
      ? string
      : Options['optional'] extends false
      ? string
      : string | null
    : Options['list'] extends false
    ? undefined extends Options['optional']
      ? string
      : Options['optional'] extends false
      ? string
      : string | null
    : undefined extends Options['optional']
    ? string[]
    : Options['optional'] extends false
    ? string[]
    : string[] | null
  : Options['type'] extends 'number'
  ? undefined extends Options['list']
    ? undefined extends Options['optional']
      ? number
      : Options['optional'] extends false
      ? number
      : number | null
    : Options['list'] extends false
    ? undefined extends Options['optional']
      ? number
      : Options['optional'] extends false
      ? number
      : number | null
    : undefined extends Options['optional']
    ? number[]
    : Options['optional'] extends false
    ? number[]
    : number[] | null
  : Options['type'] extends 'boolean'
  ? undefined extends Options['list']
    ? undefined extends Options['optional']
      ? boolean
      : Options['optional'] extends false
      ? boolean
      : boolean | null
    : Options['list'] extends false
    ? undefined extends Options['optional']
      ? boolean
      : Options['optional'] extends false
      ? boolean
      : boolean | null
    : undefined extends Options['optional']
    ? boolean[]
    : Options['optional'] extends false
    ? boolean[]
    : boolean[] | null
  : never;

export function getEnvironmentVariable<
  Options extends GetEnvironmentVariableOptions = {
    type: 'string';
    list: false;
    optional: false;
  },
>(
  environmentKey: string,
  options?: Options,
): GetEnvironmentVariableReturn<Options> {
  const extendedOptions = defaults(
    { type: 'string', list: false, optional: false },
    options,
  ) as Required<GetEnvironmentVariableOptions>;

  const environmentValue = !extendedOptions.optional
    ? getMandatoryEnvironmentVariable(environmentKey)
    : getOptionalEnvironmentVariable(environmentKey);

  if (extendedOptions.list) {
    return environmentValue
      ?.split(',')
      .map((value) =>
        convertTo(extendedOptions.type, value),
      ) as GetEnvironmentVariableReturn<Options>;
  } else {
    return (
      environmentValue
        ? convertTo(extendedOptions.type, environmentValue)
        : null
    ) as GetEnvironmentVariableReturn<Options>;
  }
}

type InferredType<Type extends EnvironmentValueType> = Type extends 'string'
  ? string
  : Type extends 'number'
  ? number
  : Type extends 'boolean'
  ? boolean
  : string;

function convertTo<Type extends EnvironmentValueType>(
  type: Type,
  value: string,
): InferredType<Type> {
  switch (type) {
    case 'string':
      return value as InferredType<Type>;
    case 'boolean':
      return (value.toLowerCase() === 'true') as InferredType<Type>;
    case 'number':
      return Number.parseFloat(value) as InferredType<Type>;
    default:
      return value as InferredType<Type>;
  }
}
