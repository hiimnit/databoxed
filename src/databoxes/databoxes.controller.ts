import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { Databox, Prisma } from '@prisma/client';
import { ParseIntDefaultPipe } from 'src/parse-int-default.pipe';
import { DataboxesService } from './databoxes.service';

@Controller('databoxes')
export class DataboxesController {
  constructor(private readonly databoxesService: DataboxesService) {}

  @Get()
  async get(
    @Query(
      'take',
      new ParseIntDefaultPipe({
        defaultValue: 100,
        minValue: 0,
        maxValue: 100,
      }),
    )
    take: number,
    @Query(
      'skip',
      new ParseIntDefaultPipe({
        defaultValue: 0, // TODO undefined?
        minValue: 0,
      }),
    )
    skip: number,
    @Query('select') select?: string,
    @Query('where') where?: string,
  ) {
    const args: Prisma.DataboxFindManyArgs = {
      take: take,
      skip: skip,
      select: parseDataboxSelect(select),
      where: parseDataboxWhere(where),
      // TODO orderBy
      // TODO cursor
    };
    return args;
    return this.databoxesService.databoxes(args);
  }

  @Get('/:id')
  async getById(@Param('id') id: string) {
    return this.databoxesService.databox(id);
  }
}

function createBadRequestException(error: string): HttpException {
  return new HttpException(
    {
      status: HttpStatus.BAD_REQUEST,
      error: error,
    },
    HttpStatus.BAD_REQUEST,
  );
}

enum FieldType {
  string,
}

const SelectableDataboxField: { [k in keyof Databox]: FieldType } = {
  id: FieldType.string,
};
const selectableFields = Object.keys(SelectableDataboxField) as Array<
  keyof Databox
>;

function validateField(field: string): keyof Databox {
  if (!selectableFields.includes(field as any))
    throw createBadRequestException(
      `Unknown field: ${field}. Possible values are: [${selectableFields}]`,
    );
  return field as keyof Databox;
}

function parseDataboxSelect(select?: string): Prisma.DataboxSelect | undefined {
  if (select === undefined) return undefined;

  const parsedSelect: Prisma.DataboxSelect = {};
  for (const selectedField of select.split(',')) {
    const validatedField = validateField(selectedField);
    parsedSelect[validatedField] = true;
  }

  return parsedSelect;
}

function parseDataboxWhere(
  where?: string,
): Prisma.DataboxWhereInput | undefined {
  if (where === undefined) return undefined;

  const lexer = createPeekableLexer(where);
  return parseFilter(lexer);
}

const operators = [
  'eq',
  'ne',
  'in',
  'ni',
  'lt',
  'le',
  'gt',
  'ge',
  'contains',
  'startswith',
  'endswith',
] as const;

function operatorToPrismaOperator(
  op: typeof operators[number],
): keyof Prisma.StringFilter {
  switch (op) {
    case 'eq':
      return 'equals';
    case 'ne':
      return 'not';
    case 'in':
      return 'in';
    case 'ni':
      return 'notIn';
    case 'lt':
      return 'lt';
    case 'le':
      return 'lte';
    case 'gt':
      return 'gt';
    case 'ge':
      return 'gte';
    case 'contains':
      return 'contains';
    case 'startswith':
      return 'startsWith';
    case 'endswith':
      return 'endsWith';
  }
}

const logicalOperators = ['and', 'or'] as const;

function lopToPrismaLop(op: typeof logicalOperators[number]): 'AND' | 'OR' {
  switch (op) {
    case 'and':
      return 'AND';
    case 'or':
      return 'OR';
  }
}

function parseFilter(
  lexer: Generator<string, any, boolean>,
): Prisma.DataboxWhereInput | undefined {
  const expression = parseExpression(lexer);
  if (expression === undefined) return undefined;

  const token = lexer.next(true);
  if (token.done === true) return expression;

  if (!logicalOperators.includes(token.value.toLowerCase() as any))
    return expression;

  const operator = token.value.toLowerCase() as typeof logicalOperators[number];
  const expressions: Prisma.DataboxWhereInput[] = [expression];
  while (true) {
    lexer.next(); // consume operator

    const expression = parseExpression(lexer);
    if (expression === undefined)
      throw createBadRequestException(
        `Expression expected after operator: '${operator}'`,
      );
    expressions.push(expression);

    const token = lexer.next(true);
    console.log(token);
    if (
      token.done === true ||
      !logicalOperators.includes(token.value.toLowerCase() as any)
    )
      break;

    if (token.value.toLowerCase() !== operator)
      throw createBadRequestException(
        `Unexpected operator: '${token.value}', expected '${operator}'`,
      );
  }

  return {
    [lopToPrismaLop(operator)]: expressions,
  };
}

function parseExpression(
  lexer: Generator<string, any, boolean>,
): Prisma.DataboxWhereInput | undefined {
  const token = lexer.next();
  if (token.done === true) return undefined;

  if (token.value === '(') {
    const filter = parseFilter(lexer);
    assertToken(lexer.next(), ')');
    return filter;
  }

  const field = getTokenValue(token);
  const validatedField = validateField(field);
  const fieldType = SelectableDataboxField[validatedField];

  const operator = getTokenValue(lexer.next()).toLowerCase();
  if (!operators.includes(operator as any))
    throw createBadRequestException(
      `Unexpected operator: '${operator}', expected one of [${operators}]`,
    );

  const value = getTokenValue(lexer.next());

  return {
    [validatedField]: {
      [operatorToPrismaOperator(operator as typeof operators[number])]:
        validateFilterValue(value, fieldType),
    },
  };
}

function validateFilterValue(value: string, type: FieldType): string {
  switch (type) {
    case FieldType.string:
      return validateStringFilterValue(value);
  }
}

function validateStringFilterValue(value: string): string {
  if (!value.startsWith("'") || !value.endsWith("'") || value.length < 2)
    throw createBadRequestException(`Invalid string value: '${value}'`);
  return value.substring(1, value.length - 1);
}

function getTokenValue(token: IteratorResult<string>): string {
  if (token.done === true)
    throw createBadRequestException(`Unexpected EOS in filter expression`);

  return token.value;
}

function assertToken(token: IteratorResult<string>, expected: string): string {
  const tokenValue = getTokenValue(token);

  if (tokenValue.toLowerCase() === expected.toLowerCase()) return tokenValue;

  throw createBadRequestException(
    `Unexpected token: '${token}', expected: '${expected}'`,
  );
}

function* createPeekableLexer(
  input: string,
): Generator<string, any, boolean | undefined> {
  //
  const lexer = createLexer(input);
  const cache: string[] = [];
  let cacheNext: boolean | undefined = false;
  while (true) {
    let tokenValue = '';

    if (cache.length > 0) {
      tokenValue = cache.pop() as string;
    } else {
      const token = lexer.next();
      if (token.done === true) break;

      tokenValue = token.value;
    }

    if (cacheNext === true) cache.push(tokenValue);
    cacheNext = yield tokenValue;
  }
}

function* createLexer(input: string): Generator<string> {
  let lexemeStart = 0;
  let stringLiteralRunning = false;
  for (let i = 0; i < input.length; ++i) {
    switch (input[i]) {
      case ' ':
        if (lexemeStart < i) {
          yield input.substring(lexemeStart, i);
        }
        lexemeStart = i + 1;
        break;
      case '(':
      case ')':
      case '[':
      case ']':
        if (lexemeStart < i) {
          yield input.substring(lexemeStart, i);
        }
        yield input[i];
        lexemeStart = i + 1;
        break;
      case '\\':
        // TODO escape next character
        break;
      case "'":
        if (stringLiteralRunning) {
          yield input.substring(lexemeStart, i + 1);
          lexemeStart = i + 1;
        }
        stringLiteralRunning = !stringLiteralRunning;
        break;
    }
  }
  if (stringLiteralRunning)
    throw createBadRequestException('Unexpected EOS, string is not finished');
  if (lexemeStart < input.length) {
    yield input.substring(lexemeStart);
  }
}

// TODO use a azure function with a time trigger to call the data refresh?
