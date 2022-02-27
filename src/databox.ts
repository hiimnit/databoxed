import { Databox } from '@prisma/client';

const databoxFields: Array<keyof Databox> = [];

const db: { [k in keyof Databox]: k } = {
  id: 'id',
};
