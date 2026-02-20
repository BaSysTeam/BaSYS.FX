import { ComparisonKind } from './comparisonKind';
import { LogicalOperator } from './logicalOperator';
import {DbType} from "./dbTypes";

export class FilterItem {
  uid: string;
  name: string;
  dataPath: string;
  title: string;
  isActive: boolean;
  required: boolean;
  comparisonKind: ComparisonKind;
  joinOperator: LogicalOperator;
  dbType: DbType;
  values: any[];

  constructor(param: Record<string, unknown> | null = null) {
    const data = param ?? {};

    this.uid = data.uid as string;
    this.name = (data.name as string) || '';
    this.dataPath = (data.path as string) || '';
    this.title = (data.title as string) || '';
    this.required = (data.required as boolean) ?? false;
    this.isActive = this.required;
    this.comparisonKind = (data.comparisonKind as ComparisonKind) ?? ComparisonKind.Equal;
    this.joinOperator = (data.joinOperator as LogicalOperator) ?? LogicalOperator.And;
    this.dbType = (data.dbType as DbType) ?? DbType.String;

    this.values = Array.isArray(data.values) ? [...data.values] : [];
  }

  get value(): unknown {
    return this.values[0] ?? null;
  }

  set value(val: unknown) {
    this.values[0] = val;
  }

  get secondValue(): unknown {
    return this.values[1] ?? null;
  }

  set secondValue(val: unknown) {
    this.values[1] = val;
  }
}
