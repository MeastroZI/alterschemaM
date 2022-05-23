import {
  Rule
} from './rules/rule'

import {
  JSONValue
} from './json'

import {
  strict as assert
} from 'assert'

import {
  cloneDeep
} from 'lodash'

export interface TransformResult {
  readonly count: number;
  readonly output: JSONValue;
}

export const transformSchema = (value: JSONValue, root: JSONValue, ruleset: Rule[]): TransformResult => {
  const result = ruleset.reduce((accumulator, rule) => {
    // Guard against rules accidentally modifying the input document
    // Its easier than it sounds to make such mistake and JavaScript
    // does not provide true "const" semantics.

    if (!rule.condition(cloneDeep(accumulator.value), cloneDeep(root))) {
      return accumulator
    }

    const output = rule.transform(cloneDeep(accumulator.value))
    assert(!rule.condition(cloneDeep(output), cloneDeep(root)),
      'Rule condition must not match after transform')
    return {
      count: accumulator.count + 1,
      value: output
    }
  }, {
    count: 0,
    value
  })

  // If at least one rule still matches the result,
  // then we recurse, until no rule matches again.
  // Conflicting rules that result in infinite
  // cycles clearly result in stack overflows.
  if (ruleset.some((rule) => {
    return rule.condition(cloneDeep(result), cloneDeep(root))
  })) {
    const subresult: TransformResult = transformSchema(result, root, ruleset)
    return {
      count: result.count + subresult.count,
      output: subresult.output
    }
  }

  return {
    count: result.count,
    output: result.value
  }
}
