import { cloneDeep } from 'lodash-es';
import { ActionMap } from '../types/tree';

export function mergeActions(base: ActionMap, specific: ActionMap): ActionMap {
  const res = cloneDeep(base);
  for (const [nodeType, actions] of Object.entries(specific)) {
    res[nodeType] = actions;
  }
  return res;
}