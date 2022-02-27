import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  Optional,
  ParseIntPipeOptions,
  PipeTransform,
} from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

type ParseIntDefaultPipeOptions = ParseIntPipeOptions & {
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  radix?: number;
};

@Injectable()
export class ParseIntDefaultPipe implements PipeTransform<string, number> {
  protected exceptionFactory: (error: string) => any;
  protected defaultValue: number;
  protected minValue?: number;
  protected maxValue?: number;
  protected radix?: number;

  constructor(@Optional() options: ParseIntDefaultPipeOptions) {
    const {
      exceptionFactory,
      errorHttpStatusCode = HttpStatus.BAD_REQUEST,
      defaultValue,
      minValue,
      maxValue,
      radix,
    } = options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));

    this.defaultValue = defaultValue;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.radix = radix;
  }

  transform(value: any, metadata: ArgumentMetadata): number {
    if (!['string', 'number'].includes(typeof value)) return this.defaultValue;

    const result = parseInt(value, this.radix ?? 10);

    if (isNaN(result)) return this.defaultValue;
    if (this.minValue && result < this.minValue) return this.minValue;
    if (this.maxValue && result > this.maxValue) return this.maxValue;

    return result;
  }
}
