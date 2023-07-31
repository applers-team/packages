import { Injectable, ParseIntPipe, PipeTransform } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';

const DefaultPageSize = 10;

@Injectable()
export class PaginationPageSizePipe implements PipeTransform<string> {
  private readonly defaultValue: number;

  constructor(defaultValue?: number) {
    this.defaultValue = defaultValue ?? DefaultPageSize;
  }

  async transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Promise<number> {
    const parsedValue = !!value
      ? await new ParseIntPipe().transform(value, metadata)
      : this.defaultValue;

    return parsedValue <= 0 ? this.defaultValue : parsedValue;
  }
}
