import {
  require_baseClone
} from "./chunk-O57Y4ZWT.js";
import {
  __commonJS
} from "./chunk-4B2QHNJT.js";

// node_modules/lodash/cloneDeep.js
var require_cloneDeep = __commonJS({
  "node_modules/lodash/cloneDeep.js"(exports, module) {
    var baseClone = require_baseClone();
    var CLONE_DEEP_FLAG = 1;
    var CLONE_SYMBOLS_FLAG = 4;
    function cloneDeep(value) {
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }
    module.exports = cloneDeep;
  }
});
export default require_cloneDeep();
//# sourceMappingURL=lodash_cloneDeep.js.map
