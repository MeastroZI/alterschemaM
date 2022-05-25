const _ = require('lodash')
const assert = require('assert').strict

module.exports = (root, path, ruleset) => {
  const value = _.get(root, path)
  for (const rule of ruleset) {
    // Guard against rules accidentally modifying the input document
    // Its easier than it sounds to make such mistake and JavaScript
    // does not provide true "const" semantics.

    if (rule.condition(_.cloneDeep(value), _.cloneDeep(root))) {
      const output = rule.transform(_.cloneDeep(value))
      assert(!rule.condition(_.cloneDeep(output), _.cloneDeep(root)),
        'Rule condition must not match after transform')

      if (path.length === 0) {
        const subprocess = module.exports(output, path, ruleset)
        return {
          count: 1 + subprocess.count,
          output: subprocess.output
        }
      } else {
        const subprocess = module.exports(_.set(_.cloneDeep(root), path, output), path, ruleset)
        return {
          count: 1 + subprocess.count,
          output: subprocess.output
        }
      }
    }
  }

  return {
    count: 0,
    output: value
  }
}