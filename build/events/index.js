import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = undefined;

  class _CodeOrName {
  }
  exports._CodeOrName = _CodeOrName;
  exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;

  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports.Name = Name;

  class _Code extends _CodeOrName {
    constructor(code) {
      super();
      this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== undefined ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== undefined ? _a : this._names = this._items.reduce((names, c) => {
        if (c instanceof Name)
          names[c.str] = (names[c.str] || 0) + 1;
        return names;
      }, {});
    }
  }
  exports._Code = _Code;
  exports.nil = new _Code("");
  function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code, args[i]);
      code.push(strs[++i]);
    }
    return new _Code(code);
  }
  exports._ = _;
  var plus = new _Code("+");
  function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports.str = str;
  function addCodeArg(code, arg) {
    if (arg instanceof _Code)
      code.push(...arg._items);
    else if (arg instanceof Name)
      code.push(arg);
    else
      code.push(interpolate(arg));
  }
  exports.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== undefined) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  }
  exports.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports.regexpCode = regexpCode;
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = undefined;
  var code_1 = require_code();

  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var")
  };

  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === undefined ? undefined : _a._prefixes) === null || _b === undefined ? undefined : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports.Scope = Scope;

  class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
    }
  }
  exports.ValueScopeName = ValueScopeName;
  var line = (0, code_1._)`\n`;

  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === undefined)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== undefined ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = new Map;
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_1._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code = code_1.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || new Map;
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
            code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === undefined ? undefined : getCode(name)) {
            code = (0, code_1._)`${code}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code;
    }
  }
  exports.ValueScope = ValueScope;
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = undefined;
  var code_1 = require_code();
  var scope_1 = require_scope();
  var code_2 = require_code();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = require_scope();
  Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+")
  };

  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }

  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (!names[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
  }

  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
      return addExprNames(names, this.rhs);
    }
  }

  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }

  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }

  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }

  class Throw extends Node {
    constructor(error) {
      super();
      this.error = error;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }

  class AnyCode extends Node {
    constructor(code) {
      super();
      this.code = code;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
      this.code = optimizeExpr(this.code, names, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
  }

  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names, constants))
          continue;
        subtractNames(names, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    get names() {
      return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
  }

  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }

  class Root extends ParentNode {
  }

  class Else extends BlockNode {
  }
  Else.kind = "else";

  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code += "else " + this.else.render(opts);
      return code;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return;
      return this;
    }
    optimizeNames(names, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === undefined ? undefined : _a.optimizeNames(names, constants);
      if (!(super.optimizeNames(names, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      addExprNames(names, this.condition);
      if (this.else)
        addNames(names, this.else.names);
      return names;
    }
  }
  If.kind = "if";

  class For extends BlockNode {
  }
  For.kind = "for";

  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }

  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names = addExprNames(super.names, this.from);
      return addExprNames(names, this.to);
    }
  }

  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }

  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";

  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";

  class Try extends BlockNode {
    render(opts) {
      let code = "try" + super.render(opts);
      if (this.catch)
        code += this.catch.render(opts);
      if (this.finally)
        code += this.finally.render(opts);
      return code;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === undefined || _a.optimizeNodes();
      (_b = this.finally) === null || _b === undefined || _b.optimizeNodes();
      return this;
    }
    optimizeNames(names, constants) {
      var _a, _b;
      super.optimizeNames(names, constants);
      (_a = this.catch) === null || _a === undefined || _a.optimizeNames(names, constants);
      (_b = this.finally) === null || _b === undefined || _b.optimizeNames(names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      if (this.catch)
        addNames(names, this.catch.names);
      if (this.finally)
        addNames(names, this.finally.names);
      return names;
    }
  }

  class Catch extends BlockNode {
    constructor(error) {
      super();
      this.error = error;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";

  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";

  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? `
` : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(prefix) {
      return this._scope.name(prefix);
    }
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set);
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== undefined && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_1.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    object(...keyValues) {
      const code = ["{"];
      for (const [key, value] of keyValues) {
        if (code.length > 1)
          code.push(",");
        code.push(key);
        if (key !== value || this.opts.es5) {
          code.push(":");
          (0, code_1.addCodeArg)(code, value);
        }
      }
      code.push("}");
      return new code_1._Code(code);
    }
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    else() {
      return this._elseNode(new Else);
    }
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
          this.var(name, (0, code_1._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    endFor() {
      return this._endBlockNode(For);
    }
    label(label) {
      return this._leafNode(new Label(label));
    }
    break(label) {
      return this._leafNode(new Break(label));
    }
    return(value) {
      const node = new Return;
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try;
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error = this.name("e");
        this._currNode = node.catch = new Catch(error);
        catchCode(error);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally;
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    throw(error) {
      return this._leafNode(new Throw(error));
    }
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === undefined)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== undefined && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    func(name, args = code_1.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports.CodeGen = CodeGen;
  function addNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
  }
  function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  }
  function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
      if (c instanceof code_1.Name)
        c = replaceName(c);
      if (c instanceof code_1._Code)
        items.push(...c._items);
      else
        items.push(c);
      return items;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === undefined || names[n.str] !== 1)
        return n;
      delete names[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined);
    }
  }
  function subtractNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) - (from[n] || 0);
  }
  function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  }
  exports.not = not;
  var andCode = mappend(exports.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports.and = and;
  var orCode = mappend(exports.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports.or = or;
  function mappend(op) {
    return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = undefined;
  var codegen_1 = require_codegen();
  var code_1 = require_code();
  function toHash(arr) {
    const hash = {};
    for (const item of arr)
      hash[item] = true;
    return hash;
  }
  exports.toHash = toHash;
  function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
      return schema;
    if (Object.keys(schema).length === 0)
      return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
  }
  exports.alwaysValidSchema = alwaysValidSchema;
  function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
      return;
    if (typeof schema === "boolean")
      return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
      if (!rules[key])
        checkStrictMode(it, `unknown keyword: "${key}"`);
    }
  }
  exports.checkUnknownRules = checkUnknownRules;
  function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (rules[key])
        return true;
    return false;
  }
  exports.schemaHasRules = schemaHasRules;
  function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (key !== "$ref" && RULES.all[key])
        return true;
    return false;
  }
  exports.schemaHasRulesButRef = schemaHasRulesButRef;
  function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
      if (typeof schema == "number" || typeof schema == "boolean")
        return schema;
      if (typeof schema == "string")
        return (0, codegen_1._)`${schema}`;
    }
    return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  }
  exports.schemaRefOrVal = schemaRefOrVal;
  function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
  }
  exports.unescapeFragment = unescapeFragment;
  function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
  }
  exports.escapeFragment = escapeFragment;
  function escapeJsonPointer(str) {
    if (typeof str == "number")
      return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  exports.escapeJsonPointer = escapeJsonPointer;
  function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  exports.unescapeJsonPointer = unescapeJsonPointer;
  function eachItem(xs, f) {
    if (Array.isArray(xs)) {
      for (const x of xs)
        f(x);
    } else {
      f(xs);
    }
  }
  exports.eachItem = eachItem;
  function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
    return (gen, from, to, toName) => {
      const res = to === undefined ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
      return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
  }
  exports.mergeEvaluated = {
    props: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
        gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
      }),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
        if (from === true) {
          gen.assign(to, true);
        } else {
          gen.assign(to, (0, codegen_1._)`${to} || {}`);
          setEvaluated(gen, to, from);
        }
      }),
      mergeValues: (from, to) => from === true ? true : { ...from, ...to },
      resultToName: evaluatedPropsToName
    }),
    items: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
      mergeValues: (from, to) => from === true ? true : Math.max(from, to),
      resultToName: (gen, items) => gen.var("items", items)
    })
  };
  function evaluatedPropsToName(gen, ps) {
    if (ps === true)
      return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._)`{}`);
    if (ps !== undefined)
      setEvaluated(gen, props, ps);
    return props;
  }
  exports.evaluatedPropsToName = evaluatedPropsToName;
  function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  }
  exports.setEvaluated = setEvaluated;
  var snippets = {};
  function useFunc(gen, f) {
    return gen.scopeValue("func", {
      ref: f,
      code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
    });
  }
  exports.useFunc = useFunc;
  var Type;
  (function(Type2) {
    Type2[Type2["Num"] = 0] = "Num";
    Type2[Type2["Str"] = 1] = "Str";
  })(Type || (exports.Type = Type = {}));
  function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    if (dataProp instanceof codegen_1.Name) {
      const isNumber = dataPropType === Type.Num;
      return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  }
  exports.getErrorPath = getErrorPath;
  function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
      return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
      throw new Error(msg);
    it.self.logger.warn(msg);
  }
  exports.checkStrictMode = checkStrictMode;
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var names = {
    data: new codegen_1.Name("data"),
    valCxt: new codegen_1.Name("valCxt"),
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"),
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
    vErrors: new codegen_1.Name("vErrors"),
    errors: new codegen_1.Name("errors"),
    this: new codegen_1.Name("this"),
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart")
  };
  exports.default = names;
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
  };
  exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
  };
  function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== undefined ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
  }
  exports.reportError = reportError;
  function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_1.default.vErrors);
    }
  }
  exports.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  }
  exports.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
    if (errsCount === undefined)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
      gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
      gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_1._)`${err}.data`, data);
      }
    });
  }
  exports.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  var E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"),
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema")
  };
  function errorObjectCode(cxt, error, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_1._)`{}`;
    return errorObject(cxt, error, errorPaths);
  }
  function errorObject(cxt, error, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
    if (schemaPath) {
      schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = undefined;
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var boolError = {
    message: "boolean schema is false"
  };
  function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
      falseSchemaError(it, false);
    } else if (typeof schema == "object" && schema.$async === true) {
      gen.return(names_1.default.data);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, null);
      gen.return(true);
    }
  }
  exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
      gen.var(valid, false);
      falseSchemaError(it);
    } else {
      gen.var(valid, true);
    }
  }
  exports.boolOrEmptySchema = boolOrEmptySchema;
  function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    const cxt = {
      gen,
      keyword: "false schema",
      data,
      schema: false,
      schemaCode: false,
      schemaValue: false,
      params: {},
      it
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRules = exports.isJSONType = undefined;
  var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
  var jsonTypes = new Set(_jsonTypes);
  function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
  }
  exports.isJSONType = isJSONType;
  function getRules() {
    const groups = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...groups, integer: true, boolean: true, null: true },
      rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  exports.getRules = getRules;
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = undefined;
  function schemaHasRulesForType({ schema, self }, type) {
    const group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
  }
  exports.schemaHasRulesForType = schemaHasRulesForType;
  function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
  }
  exports.shouldUseGroup = shouldUseGroup;
  function shouldUseRule(schema, rule) {
    var _a;
    return schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === undefined ? undefined : _a.some((kwd) => schema[kwd] !== undefined));
  }
  exports.shouldUseRule = shouldUseRule;
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = undefined;
  var rules_1 = require_rules();
  var applicability_1 = require_applicability();
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var DataType;
  (function(DataType2) {
    DataType2[DataType2["Correct"] = 0] = "Correct";
    DataType2[DataType2["Wrong"] = 1] = "Wrong";
  })(DataType || (exports.DataType = DataType = {}));
  function getSchemaTypes(schema) {
    const types = getJSONTypes(schema.type);
    const hasNull = types.includes("null");
    if (hasNull) {
      if (schema.nullable === false)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!types.length && schema.nullable !== undefined) {
        throw new Error('"nullable" cannot be used without "type"');
      }
      if (schema.nullable === true)
        types.push("null");
    }
    return types;
  }
  exports.getSchemaTypes = getSchemaTypes;
  function getJSONTypes(ts) {
    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types.every(rules_1.isJSONType))
      return types;
    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
  }
  exports.getJSONTypes = getJSONTypes;
  function coerceAndCheckDataType(it, types) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types, opts.coerceTypes);
    const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
    if (checkTypes) {
      const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
      gen.if(wrongType, () => {
        if (coerceTo.length)
          coerceData(it, types, coerceTo);
        else
          reportTypeError(it);
      });
    }
    return checkTypes;
  }
  exports.coerceAndCheckDataType = coerceAndCheckDataType;
  var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
  function coerceToTypes(types, coerceTypes) {
    return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  }
  function coerceData(it, types, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
    if (opts.coerceTypes === "array") {
      gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._)`${coerced} !== undefined`);
    for (const t of coerceTo) {
      if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
        coerceSpecificType(t);
      }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
      gen.assign(data, coerced);
      assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
      switch (t) {
        case "string":
          gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
          return;
        case "number":
          gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "integer":
          gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "boolean":
          gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
          return;
        case "null":
          gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
          gen.assign(coerced, null);
          return;
        case "array":
          gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
      }
    }
  }
  function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  }
  function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
      case "null":
        return (0, codegen_1._)`${data} ${EQ} null`;
      case "array":
        cond = (0, codegen_1._)`Array.isArray(${data})`;
        break;
      case "object":
        cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
        break;
      case "integer":
        cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
        break;
      case "number":
        cond = numCond();
        break;
      default:
        return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
      return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
    }
  }
  exports.checkDataType = checkDataType;
  function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
      return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types = (0, util_1.toHash)(dataTypes);
    if (types.array && types.object) {
      const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
      cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
      delete types.null;
      delete types.array;
      delete types.object;
    } else {
      cond = codegen_1.nil;
    }
    if (types.number)
      delete types.integer;
    for (const t in types)
      cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
  }
  exports.checkDataTypes = checkDataTypes;
  var typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  };
  function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
  }
  exports.reportTypeError = reportTypeError;
  function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
      gen,
      keyword: "type",
      data,
      schema: schema.type,
      schemaCode,
      schemaValue: schemaCode,
      parentSchema: schema,
      params: {},
      it
    };
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assignDefaults = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
      for (const key in properties) {
        assignDefault(it, key, properties[key].default);
      }
    } else if (ty === "array" && Array.isArray(items)) {
      items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
  }
  exports.assignDefaults = assignDefaults;
  function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
      return;
    const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
      (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
      return;
    }
    let condition = (0, codegen_1._)`${childData} === undefined`;
    if (opts.useDefaults === "empty") {
      condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
    }
    gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var util_2 = require_util();
  function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
      cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
      cxt.error();
    });
  }
  exports.checkReportMissingProp = checkReportMissingProp;
  function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  }
  exports.checkMissingProp = checkMissingProp;
  function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
  }
  exports.reportMissingProp = reportMissingProp;
  function hasPropFunc(gen) {
    return gen.scopeValue("func", {
      ref: Object.prototype.hasOwnProperty,
      code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
    });
  }
  exports.hasPropFunc = hasPropFunc;
  function isOwnProperty(gen, data, property) {
    return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  }
  exports.isOwnProperty = isOwnProperty;
  function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  }
  exports.propertyInData = propertyInData;
  function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  }
  exports.noPropertyInData = noPropertyInData;
  function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  }
  exports.allSchemaProperties = allSchemaProperties;
  function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  }
  exports.schemaProperties = schemaProperties;
  function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
      [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
      [names_1.default.parentData, it.parentData],
      [names_1.default.parentDataProperty, it.parentDataProperty],
      [names_1.default.rootData, names_1.default.rootData]
    ];
    if (it.opts.dynamicRef)
      valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  }
  exports.callValidateCode = callValidateCode;
  var newRegExp = (0, codegen_1._)`new RegExp`;
  function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
      key: rx.toString(),
      ref: rx,
      code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
    });
  }
  exports.usePattern = usePattern;
  function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
      const validArr = gen.let("valid", true);
      validateItems(() => gen.assign(validArr, false));
      return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword,
          dataProp: i,
          dataPropType: util_1.Type.Num
        }, valid);
        gen.if((0, codegen_1.not)(valid), notValid);
      });
    }
  }
  exports.validateArray = validateArray;
  function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    if (!Array.isArray(schema))
      throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
      return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
      const schCxt = cxt.subschema({
        keyword,
        schemaProp: i,
        compositeRule: true
      }, schValid);
      gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
      const merged = cxt.mergeValidEvaluated(schCxt, schValid);
      if (!merged)
        gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  }
  exports.validateUnion = validateUnion;
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var code_1 = require_code2();
  var errors_1 = require_errors();
  function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
      it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
      schema: macroSchema,
      schemaPath: codegen_1.nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
  }
  exports.macroKeywordCode = macroKeywordCode;
  function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== undefined ? _a : valid);
    function validateKeyword() {
      if (def.errors === false) {
        assignValid();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => cxt.error());
      } else {
        const ruleErrs = def.async ? validateAsync() : validateSync();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => addErrs(cxt, ruleErrs));
      }
    }
    function validateAsync() {
      const ruleErrs = gen.let("ruleErrs", null);
      gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
      return ruleErrs;
    }
    function validateSync() {
      const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
      gen.assign(validateErrs, null);
      assignValid(codegen_1.nil);
      return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
      const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
      const passSchema = !(("compile" in def) && !$data || def.schema === false);
      gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors) {
      var _a2;
      gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== undefined ? _a2 : valid), errors);
    }
  }
  exports.funcKeywordCode = funcKeywordCode;
  function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  }
  function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
  }
  function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
      throw new Error("async keyword in sync schema");
  }
  function useKeyword(gen, keyword, result) {
    if (result === undefined)
      throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
  }
  function validSchemaType(schema, schemaType, allowUndefined = false) {
    return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  }
  exports.validSchemaType = validSchemaType;
  function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
      throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === undefined ? undefined : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
      throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
      const valid = def.validateSchema(schema[keyword]);
      if (!valid) {
        const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
  }
  exports.validateKeywordUsage = validateKeywordUsage;
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
      const sch = it.schema[keyword];
      return schemaProp === undefined ? {
        schema: sch,
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`
      } : {
        schema: sch[schemaProp],
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
      };
    }
    if (schema !== undefined) {
      if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      }
      return {
        schema,
        schemaPath,
        topSchemaRef,
        errSchemaPath
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  exports.getSubschema = getSubschema;
  function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
      const { errorPath, dataPathArr, opts } = it;
      const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
      dataContextProps(nextData);
      subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
      subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
      subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
      const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
      dataContextProps(nextData);
      if (propertyName !== undefined)
        subschema.propertyName = propertyName;
    }
    if (dataTypes)
      subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
      subschema.data = _nextData;
      subschema.dataLevel = it.dataLevel + 1;
      subschema.dataTypes = [];
      it.definedProperties = new Set;
      subschema.parentData = it.data;
      subschema.dataNames = [...it.dataNames, _nextData];
    }
  }
  exports.extendSubschemaData = extendSubschemaData;
  function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
      subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
      subschema.createErrors = createErrors;
    if (allErrors !== undefined)
      subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator;
    subschema.jtdMetadata = jtdMetadata;
  }
  exports.extendSubschemaMode = extendSubschemaMode;
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS((exports, module) => {
  module.exports = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length;i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length;i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length;i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS((exports, module) => {
  var traverse = module.exports = function(schema, opts, cb) {
    if (typeof opts == "function") {
      cb = opts;
      opts = {};
    }
    cb = opts.cb || cb;
    var pre = typeof cb == "function" ? cb : cb.pre || function() {};
    var post = cb.post || function() {};
    _traverse(opts, pre, post, schema, "", schema);
  };
  traverse.keywords = {
    additionalItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true
  };
  traverse.arrayKeywords = {
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true
  };
  traverse.propsKeywords = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependencies: true
  };
  traverse.skipKeywords = {
    default: true,
    enum: true,
    const: true,
    required: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true
  };
  function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (schema && typeof schema == "object" && !Array.isArray(schema)) {
      pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      for (var key in schema) {
        var sch = schema[key];
        if (Array.isArray(sch)) {
          if (key in traverse.arrayKeywords) {
            for (var i = 0;i < sch.length; i++)
              _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          }
        } else if (key in traverse.propsKeywords) {
          if (sch && typeof sch == "object") {
            for (var prop in sch)
              _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          }
        } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
          _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
      }
      post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    }
  }
  function escapeJsonPtr(str) {
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = undefined;
  var util_1 = require_util();
  var equal = require_fast_deep_equal();
  var traverse = require_json_schema_traverse();
  var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
      return true;
    if (limit === true)
      return !hasRef(schema);
    if (!limit)
      return false;
    return countKeys(schema) <= limit;
  }
  exports.inlineRef = inlineRef;
  var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function hasRef(schema) {
    for (const key in schema) {
      if (REF_KEYWORDS.has(key))
        return true;
      const sch = schema[key];
      if (Array.isArray(sch) && sch.some(hasRef))
        return true;
      if (typeof sch == "object" && hasRef(sch))
        return true;
    }
    return false;
  }
  function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
      if (key === "$ref")
        return Infinity;
      count++;
      if (SIMPLE_INLINED.has(key))
        continue;
      if (typeof schema[key] == "object") {
        (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
      }
      if (count === Infinity)
        return Infinity;
    }
    return count;
  }
  function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
      id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
  }
  exports.getFullPath = getFullPath;
  function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
  }
  exports._getFullPath = _getFullPath;
  var TRAILING_SLASH_HASH = /#\/?$/;
  function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  }
  exports.normalizeId = normalizeId;
  function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
  }
  exports.resolveUrl = resolveUrl;
  var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
      return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set;
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
      if (parentJsonPtr === undefined)
        return;
      const fullPath = pathPrefix + jsonPtr;
      let innerBaseId = baseIds[parentJsonPtr];
      if (typeof sch[schemaId] == "string")
        innerBaseId = addRef.call(this, sch[schemaId]);
      addAnchor.call(this, sch.$anchor);
      addAnchor.call(this, sch.$dynamicAnchor);
      baseIds[jsonPtr] = innerBaseId;
      function addRef(ref) {
        const _resolve = this.opts.uriResolver.resolve;
        ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
        if (schemaRefs.has(ref))
          throw ambiguos(ref);
        schemaRefs.add(ref);
        let schOrRef = this.refs[ref];
        if (typeof schOrRef == "string")
          schOrRef = this.refs[schOrRef];
        if (typeof schOrRef == "object") {
          checkAmbiguosRef(sch, schOrRef.schema, ref);
        } else if (ref !== normalizeId(fullPath)) {
          if (ref[0] === "#") {
            checkAmbiguosRef(sch, localRefs[ref], ref);
            localRefs[ref] = sch;
          } else {
            this.refs[ref] = fullPath;
          }
        }
        return ref;
      }
      function addAnchor(anchor) {
        if (typeof anchor == "string") {
          if (!ANCHOR.test(anchor))
            throw new Error(`invalid anchor "${anchor}"`);
          addRef.call(this, `#${anchor}`);
        }
      }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
      if (sch2 !== undefined && !equal(sch1, sch2))
        throw ambiguos(ref);
    }
    function ambiguos(ref) {
      return new Error(`reference "${ref}" resolves to more than one schema`);
    }
  }
  exports.getSchemaRefs = getSchemaRefs;
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getData = exports.KeywordCxt = exports.validateFunctionCode = undefined;
  var boolSchema_1 = require_boolSchema();
  var dataType_1 = require_dataType();
  var applicability_1 = require_applicability();
  var dataType_2 = require_dataType();
  var defaults_1 = require_defaults();
  var keyword_1 = require_keyword();
  var subschema_1 = require_subschema();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var errors_1 = require_errors();
  function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        topSchemaObjCode(it);
        return;
      }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  }
  exports.validateFunctionCode = validateFunctionCode;
  function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
        destructureValCxtES5(gen, opts);
        gen.code(body);
      });
    } else {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
  }
  function destructureValCxt(opts) {
    return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  }
  function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
      gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.rootData, names_1.default.data);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
    });
  }
  function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      checkNoDefault(it);
      gen.let(names_1.default.vErrors, null);
      gen.let(names_1.default.errors, 0);
      if (opts.unevaluated)
        resetEvaluated(it);
      typeAndKeywords(it);
      returnResults(it);
    });
    return;
  }
  function resetEvaluated(it) {
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  }
  function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  }
  function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        subSchemaObjCode(it, valid);
        return;
      }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
  }
  function schemaCxtHasRules({ schema, self }) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (self.RULES.all[key])
        return true;
    return false;
  }
  function isSchemaObj(it) {
    return typeof it.schema != "boolean";
  }
  function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
      commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  }
  function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
  }
  function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
      return schemaKeywords(it, [], false, errsCount);
    const types = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
    schemaKeywords(it, types, !checkedTypes, errsCount);
  }
  function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
      self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
  }
  function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
      (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
  }
  function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
      it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  }
  function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
      gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
    } else if (typeof opts.$comment == "function") {
      const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
      const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
      gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
  }
  function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
      gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
      if (opts.unevaluated)
        assignEvaluated(it);
      gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
    }
  }
  function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  }
  function schemaKeywords(it, types, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self } = it;
    const { RULES } = self;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
      gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
      return;
    }
    if (!opts.jtd)
      checkStrictTypes(it, types);
    gen.block(() => {
      for (const group of RULES.rules)
        groupKeywords(group);
      groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
      if (!(0, applicability_1.shouldUseGroup)(schema, group))
        return;
      if (group.type) {
        gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
        iterateKeywords(it, group);
        if (types.length === 1 && types[0] === group.type && typeErrors) {
          gen.else();
          (0, dataType_2.reportTypeError)(it);
        }
        gen.endIf();
      } else {
        iterateKeywords(it, group);
      }
      if (!allErrors)
        gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
    }
  }
  function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults } } = it;
    if (useDefaults)
      (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
      for (const rule of group.rules) {
        if ((0, applicability_1.shouldUseRule)(schema, rule)) {
          keywordCode(it, rule.keyword, rule.definition, group.type);
        }
      }
    });
  }
  function checkStrictTypes(it, types) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
      return;
    checkContextTypes(it, types);
    if (!it.opts.allowUnionTypes)
      checkMultipleTypes(it, types);
    checkKeywordTypes(it, it.dataTypes);
  }
  function checkContextTypes(it, types) {
    if (!types.length)
      return;
    if (!it.dataTypes.length) {
      it.dataTypes = types;
      return;
    }
    types.forEach((t) => {
      if (!includesType(it.dataTypes, t)) {
        strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
      }
    });
    narrowSchemaTypes(it, types);
  }
  function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
      strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
  }
  function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
      const rule = rules[keyword];
      if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
        const { type } = rule.definition;
        if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
  }
  function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  }
  function includesType(ts, t) {
    return ts.includes(t) || t === "integer" && ts.includes("number");
  }
  function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
      if (includesType(withTypes, t))
        ts.push(t);
      else if (withTypes.includes("integer") && t === "number")
        ts.push("integer");
    }
    it.dataTypes = ts;
  }
  function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  }

  class KeywordCxt {
    constructor(it, def, keyword) {
      (0, keyword_1.validateKeywordUsage)(it, def, keyword);
      this.gen = it.gen;
      this.allErrors = it.allErrors;
      this.keyword = keyword;
      this.data = it.data;
      this.schema = it.schema[keyword];
      this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
      this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
      this.schemaType = def.schemaType;
      this.parentSchema = it.schema;
      this.params = {};
      this.it = it;
      this.def = def;
      if (this.$data) {
        this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
      } else {
        this.schemaCode = this.schemaValue;
        if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        }
      }
      if ("code" in def ? def.trackErrors : def.errors !== false) {
        this.errsCount = it.gen.const("_errs", names_1.default.errors);
      }
    }
    result(condition, successAction, failAction) {
      this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
      this.gen.if(condition);
      if (failAction)
        failAction();
      else
        this.error();
      if (successAction) {
        this.gen.else();
        successAction();
        if (this.allErrors)
          this.gen.endIf();
      } else {
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
    }
    pass(condition, failAction) {
      this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
      if (condition === undefined) {
        this.error();
        if (!this.allErrors)
          this.gen.if(false);
        return;
      }
      this.gen.if(condition);
      this.error();
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
    fail$data(condition) {
      if (!this.$data)
        return this.fail(condition);
      const { schemaCode } = this;
      this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
      if (errorParams) {
        this.setParams(errorParams);
        this._error(append, errorPaths);
        this.setParams({});
        return;
      }
      this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
      (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
      (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
      if (this.errsCount === undefined)
        throw new Error('add "trackErrors" to keyword definition');
      (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
      if (!this.allErrors)
        this.gen.if(cond);
    }
    setParams(obj, assign) {
      if (assign)
        Object.assign(this.params, obj);
      else
        this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
      this.gen.block(() => {
        this.check$data(valid, $dataValid);
        codeBlock();
      });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
      if (!this.$data)
        return;
      const { gen, schemaCode, schemaType, def } = this;
      gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
      if (valid !== codegen_1.nil)
        gen.assign(valid, true);
      if (schemaType.length || def.validateSchema) {
        gen.elseIf(this.invalid$data());
        this.$dataError();
        if (valid !== codegen_1.nil)
          gen.assign(valid, false);
      }
      gen.else();
    }
    invalid$data() {
      const { gen, schemaCode, schemaType, def, it } = this;
      return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
      function wrong$DataType() {
        if (schemaType.length) {
          if (!(schemaCode instanceof codegen_1.Name))
            throw new Error("ajv implementation error");
          const st = Array.isArray(schemaType) ? schemaType : [schemaType];
          return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
        }
        return codegen_1.nil;
      }
      function invalid$DataSchema() {
        if (def.validateSchema) {
          const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
          return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
        }
        return codegen_1.nil;
      }
    }
    subschema(appl, valid) {
      const subschema = (0, subschema_1.getSubschema)(this.it, appl);
      (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
      (0, subschema_1.extendSubschemaMode)(subschema, appl);
      const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
      subschemaCode(nextContext, valid);
      return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
      const { it, gen } = this;
      if (!it.opts.unevaluated)
        return;
      if (it.props !== true && schemaCxt.props !== undefined) {
        it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
      }
      if (it.items !== true && schemaCxt.items !== undefined) {
        it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
      }
    }
    mergeValidEvaluated(schemaCxt, valid) {
      const { it, gen } = this;
      if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
        gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
        return true;
      }
    }
  }
  exports.KeywordCxt = KeywordCxt;
  function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
      def.code(cxt, ruleType);
    } else if (cxt.$data && def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    } else if ("macro" in def) {
      (0, keyword_1.macroKeywordCode)(cxt, def);
    } else if (def.compile || def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    }
  }
  var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
      return names_1.default.rootData;
    if ($data[0] === "/") {
      if (!JSON_POINTER.test($data))
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      jsonPointer = $data;
      data = names_1.default.rootData;
    } else {
      const matches = RELATIVE_JSON_POINTER.exec($data);
      if (!matches)
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      const up = +matches[1];
      jsonPointer = matches[2];
      if (jsonPointer === "#") {
        if (up >= dataLevel)
          throw new Error(errorMsg("property/index", up));
        return dataPathArr[dataLevel - up];
      }
      if (up > dataLevel)
        throw new Error(errorMsg("data", up));
      data = dataNames[dataLevel - up];
      if (!jsonPointer)
        return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
      if (segment) {
        data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
        expr = (0, codegen_1._)`${expr} && ${data}`;
      }
    }
    return expr;
    function errorMsg(pointerType, up) {
      return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
  }
  exports.getData = getData;
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class ValidationError extends Error {
    constructor(errors) {
      super("validation failed");
      this.errors = errors;
      this.ajv = this.validation = true;
    }
  }
  exports.default = ValidationError;
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var resolve_1 = require_resolve();

  class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
      super(msg || `can't resolve reference ${ref} from id ${baseId}`);
      this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
      this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
  }
  exports.default = MissingRefError;
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = undefined;
  var codegen_1 = require_codegen();
  var validation_error_1 = require_validation_error();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var validate_1 = require_validate();

  class SchemaEnv {
    constructor(env) {
      var _a;
      this.refs = {};
      this.dynamicAnchors = {};
      let schema;
      if (typeof env.schema == "object")
        schema = env.schema;
      this.schema = env.schema;
      this.schemaId = env.schemaId;
      this.root = env.root || this;
      this.baseId = (_a = env.baseId) !== null && _a !== undefined ? _a : (0, resolve_1.normalizeId)(schema === null || schema === undefined ? undefined : schema[env.schemaId || "$id"]);
      this.schemaPath = env.schemaPath;
      this.localRefs = env.localRefs;
      this.meta = env.meta;
      this.$async = schema === null || schema === undefined ? undefined : schema.$async;
      this.refs = {};
    }
  }
  exports.SchemaEnv = SchemaEnv;
  function compileSchema(sch) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
      return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
      gen,
      allErrors: this.opts.allErrors,
      data: names_1.default.data,
      parentData: names_1.default.parentData,
      parentDataProperty: names_1.default.parentDataProperty,
      dataNames: [names_1.default.data],
      dataPathArr: [codegen_1.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: new Set,
      topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
      validateName,
      ValidationError: _ValidationError,
      schema: sch.schema,
      schemaEnv: sch,
      rootId,
      baseId: sch.baseId || rootId,
      schemaPath: codegen_1.nil,
      errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, codegen_1._)`""`,
      opts: this.opts,
      self: this
    };
    let sourceCode;
    try {
      this._compilations.add(sch);
      (0, validate_1.validateFunctionCode)(schemaCxt);
      gen.optimize(this.opts.code.optimize);
      const validateCode = gen.toString();
      sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
      if (this.opts.code.process)
        sourceCode = this.opts.code.process(sourceCode, sch);
      const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
      const validate = makeValidate(this, this.scope.get());
      this.scope.value(validateName, { ref: validate });
      validate.errors = null;
      validate.schema = sch.schema;
      validate.schemaEnv = sch;
      if (sch.$async)
        validate.$async = true;
      if (this.opts.code.source === true) {
        validate.source = { validateName, validateCode, scopeValues: gen._values };
      }
      if (this.opts.unevaluated) {
        const { props, items } = schemaCxt;
        validate.evaluated = {
          props: props instanceof codegen_1.Name ? undefined : props,
          items: items instanceof codegen_1.Name ? undefined : items,
          dynamicProps: props instanceof codegen_1.Name,
          dynamicItems: items instanceof codegen_1.Name
        };
        if (validate.source)
          validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
      }
      sch.validate = validate;
      return sch;
    } catch (e) {
      delete sch.validate;
      delete sch.validateName;
      if (sourceCode)
        this.logger.error("Error compiling schema, function code:", sourceCode);
      throw e;
    } finally {
      this._compilations.delete(sch);
    }
  }
  exports.compileSchema = compileSchema;
  function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
      return schOrFunc;
    let _sch = resolve.call(this, root, ref);
    if (_sch === undefined) {
      const schema = (_a = root.localRefs) === null || _a === undefined ? undefined : _a[ref];
      const { schemaId } = this.opts;
      if (schema)
        _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
      return;
    return root.refs[ref] = inlineOrCompile.call(this, _sch);
  }
  exports.resolveRef = resolveRef;
  function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
      return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
  }
  function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
      if (sameSchemaEnv(sch, schEnv))
        return sch;
    }
  }
  exports.getCompilingSchema = getCompilingSchema;
  function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  }
  function resolve(root, ref) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
      ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  }
  function resolveSchema(root, ref) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
      return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
      const sch = resolveSchema.call(this, root, schOrRef);
      if (typeof (sch === null || sch === undefined ? undefined : sch.schema) !== "object")
        return;
      return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === undefined ? undefined : schOrRef.schema) !== "object")
      return;
    if (!schOrRef.validate)
      compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
      const { schema } = schOrRef;
      const { schemaId } = this.opts;
      const schId = schema[schemaId];
      if (schId)
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
  }
  exports.resolveSchema = resolveSchema;
  var PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === undefined ? undefined : _a[0]) !== "/")
      return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
      if (typeof schema === "boolean")
        return;
      const partSchema = schema[(0, util_1.unescapeFragment)(part)];
      if (partSchema === undefined)
        return;
      schema = partSchema;
      const schId = typeof schema === "object" && schema[this.opts.schemaId];
      if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
      const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
      env = resolveSchema.call(this, root, $ref);
    }
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
      return env;
    return;
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS((exports, module) => {
  module.exports = {
    $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    type: "object",
    required: ["$data"],
    properties: {
      $data: {
        type: "string",
        anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
      }
    },
    additionalProperties: false
  };
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function stringArrayToHexStripped(input) {
    let acc = "";
    let code = 0;
    let i = 0;
    for (i = 0;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (code === 48) {
        continue;
      }
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
      break;
    }
    for (i += 1;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
    }
    return acc;
  }
  var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function consumeIsZone(buffer) {
    buffer.length = 0;
    return true;
  }
  function consumeHextets(buffer, address, output) {
    if (buffer.length) {
      const hex = stringArrayToHexStripped(buffer);
      if (hex !== "") {
        address.push(hex);
      } else {
        output.error = true;
        return false;
      }
      buffer.length = 0;
    }
    return true;
  }
  function getIPV6(input) {
    let tokenCount = 0;
    const output = { error: false, address: "", zone: "" };
    const address = [];
    const buffer = [];
    let endipv6Encountered = false;
    let endIpv6 = false;
    let consume = consumeHextets;
    for (let i = 0;i < input.length; i++) {
      const cursor = input[i];
      if (cursor === "[" || cursor === "]") {
        continue;
      }
      if (cursor === ":") {
        if (endipv6Encountered === true) {
          endIpv6 = true;
        }
        if (!consume(buffer, address, output)) {
          break;
        }
        if (++tokenCount > 7) {
          output.error = true;
          break;
        }
        if (i > 0 && input[i - 1] === ":") {
          endipv6Encountered = true;
        }
        address.push(":");
        continue;
      } else if (cursor === "%") {
        if (!consume(buffer, address, output)) {
          break;
        }
        consume = consumeIsZone;
      } else {
        buffer.push(cursor);
        continue;
      }
    }
    if (buffer.length) {
      if (consume === consumeIsZone) {
        output.zone = buffer.join("");
      } else if (endIpv6) {
        address.push(buffer.join(""));
      } else {
        address.push(stringArrayToHexStripped(buffer));
      }
    }
    output.address = address.join("");
    return output;
  }
  function normalizeIPv6(host) {
    if (findToken(host, ":") < 2) {
      return { host, isIPV6: false };
    }
    const ipv6 = getIPV6(host);
    if (!ipv6.error) {
      let newHost = ipv6.address;
      let escapedHost = ipv6.address;
      if (ipv6.zone) {
        newHost += "%" + ipv6.zone;
        escapedHost += "%25" + ipv6.zone;
      }
      return { host: newHost, isIPV6: true, escapedHost };
    } else {
      return { host, isIPV6: false };
    }
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  function removeDotSegments(path) {
    let input = path;
    const output = [];
    let nextSlash = -1;
    let len = 0;
    while (len = input.length) {
      if (len === 1) {
        if (input === ".") {
          break;
        } else if (input === "/") {
          output.push("/");
          break;
        } else {
          output.push(input);
          break;
        }
      } else if (len === 2) {
        if (input[0] === ".") {
          if (input[1] === ".") {
            break;
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === "." || input[1] === "/") {
            output.push("/");
            break;
          }
        }
      } else if (len === 3) {
        if (input === "/..") {
          if (output.length !== 0) {
            output.pop();
          }
          output.push("/");
          break;
        }
      }
      if (input[0] === ".") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(3);
            continue;
          }
        } else if (input[1] === "/") {
          input = input.slice(2);
          continue;
        }
      } else if (input[0] === "/") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(2);
            continue;
          } else if (input[2] === ".") {
            if (input[3] === "/") {
              input = input.slice(3);
              if (output.length !== 0) {
                output.pop();
              }
              continue;
            }
          }
        }
      }
      if ((nextSlash = input.indexOf("/", 1)) === -1) {
        output.push(input);
        break;
      } else {
        output.push(input.slice(0, nextSlash));
        input = input.slice(nextSlash);
      }
    }
    return output.join("");
  }
  function normalizeComponentEncoding(component, esc) {
    const func = esc !== true ? escape : unescape;
    if (component.scheme !== undefined) {
      component.scheme = func(component.scheme);
    }
    if (component.userinfo !== undefined) {
      component.userinfo = func(component.userinfo);
    }
    if (component.host !== undefined) {
      component.host = func(component.host);
    }
    if (component.path !== undefined) {
      component.path = func(component.path);
    }
    if (component.query !== undefined) {
      component.query = func(component.query);
    }
    if (component.fragment !== undefined) {
      component.fragment = func(component.fragment);
    }
    return component;
  }
  function recomposeAuthority(component) {
    const uriTokens = [];
    if (component.userinfo !== undefined) {
      uriTokens.push(component.userinfo);
      uriTokens.push("@");
    }
    if (component.host !== undefined) {
      let host = unescape(component.host);
      if (!isIPv4(host)) {
        const ipV6res = normalizeIPv6(host);
        if (ipV6res.isIPV6 === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = component.host;
        }
      }
      uriTokens.push(host);
    }
    if (typeof component.port === "number" || typeof component.port === "string") {
      uriTokens.push(":");
      uriTokens.push(String(component.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    nonSimpleDomain,
    recomposeAuthority,
    normalizeComponentEncoding,
    removeDotSegments,
    isIPv4,
    isUUID,
    normalizeIPv6,
    stringArrayToHexStripped
  };
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS((exports, module) => {
  var { isUUID } = require_utils();
  var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  var supportedSchemeNames = [
    "http",
    "https",
    "ws",
    "wss",
    "urn",
    "urn:uuid"
  ];
  function isValidSchemeName(name) {
    return supportedSchemeNames.indexOf(name) !== -1;
  }
  function wsIsSecure(wsComponent) {
    if (wsComponent.secure === true) {
      return true;
    } else if (wsComponent.secure === false) {
      return false;
    } else if (wsComponent.scheme) {
      return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
    } else {
      return false;
    }
  }
  function httpParse(component) {
    if (!component.host) {
      component.error = component.error || "HTTP URIs must have a host.";
    }
    return component;
  }
  function httpSerialize(component) {
    const secure = String(component.scheme).toLowerCase() === "https";
    if (component.port === (secure ? 443 : 80) || component.port === "") {
      component.port = undefined;
    }
    if (!component.path) {
      component.path = "/";
    }
    return component;
  }
  function wsParse(wsComponent) {
    wsComponent.secure = wsIsSecure(wsComponent);
    wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
    wsComponent.path = undefined;
    wsComponent.query = undefined;
    return wsComponent;
  }
  function wsSerialize(wsComponent) {
    if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
      wsComponent.port = undefined;
    }
    if (typeof wsComponent.secure === "boolean") {
      wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
      wsComponent.secure = undefined;
    }
    if (wsComponent.resourceName) {
      const [path, query] = wsComponent.resourceName.split("?");
      wsComponent.path = path && path !== "/" ? path : undefined;
      wsComponent.query = query;
      wsComponent.resourceName = undefined;
    }
    wsComponent.fragment = undefined;
    return wsComponent;
  }
  function urnParse(urnComponent, options) {
    if (!urnComponent.path) {
      urnComponent.error = "URN can not be parsed";
      return urnComponent;
    }
    const matches = urnComponent.path.match(URN_REG);
    if (matches) {
      const scheme = options.scheme || urnComponent.scheme || "urn";
      urnComponent.nid = matches[1].toLowerCase();
      urnComponent.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      urnComponent.path = undefined;
      if (schemeHandler) {
        urnComponent = schemeHandler.parse(urnComponent, options);
      }
    } else {
      urnComponent.error = urnComponent.error || "URN can not be parsed.";
    }
    return urnComponent;
  }
  function urnSerialize(urnComponent, options) {
    if (urnComponent.nid === undefined) {
      throw new Error("URN without nid cannot be serialized");
    }
    const scheme = options.scheme || urnComponent.scheme || "urn";
    const nid = urnComponent.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = getSchemeHandler(urnScheme);
    if (schemeHandler) {
      urnComponent = schemeHandler.serialize(urnComponent, options);
    }
    const uriComponent = urnComponent;
    const nss = urnComponent.nss;
    uriComponent.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponent;
  }
  function urnuuidParse(urnComponent, options) {
    const uuidComponent = urnComponent;
    uuidComponent.uuid = uuidComponent.nss;
    uuidComponent.nss = undefined;
    if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
      uuidComponent.error = uuidComponent.error || "UUID is not valid.";
    }
    return uuidComponent;
  }
  function urnuuidSerialize(uuidComponent) {
    const urnComponent = uuidComponent;
    urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
    return urnComponent;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  Object.setPrototypeOf(SCHEMES, null);
  function getSchemeHandler(scheme) {
    return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || undefined;
  }
  module.exports = {
    wsIsSecure,
    SCHEMES,
    isValidSchemeName,
    getSchemeHandler
  };
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS((exports, module) => {
  var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
  var { SCHEMES, getSchemeHandler } = require_schemes();
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = serialize(parse(uri, options), options);
    } else if (typeof uri === "object") {
      uri = parse(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve(baseURI, relativeURI, options) {
    const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
    const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
    schemelessOptions.skipEscape = true;
    return serialize(resolved, schemelessOptions);
  }
  function resolveComponent(base, relative, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse(serialize(base, options), options);
      relative = parse(serialize(relative, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
      target.scheme = relative.scheme;
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (!relative.path) {
          target.path = base.path;
          if (relative.query !== undefined) {
            target.query = relative.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative.path[0] === "/") {
            target.path = removeDotSegments(relative.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative.path;
            } else if (!base.path) {
              target.path = relative.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
      uriA = unescape(uriA);
      uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
    } else if (typeof uriA === "object") {
      uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
    }
    if (typeof uriB === "string") {
      uriB = unescape(uriB);
      uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
    } else if (typeof uriB === "object") {
      uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
    }
    return uriA.toLowerCase() === uriB.toLowerCase();
  }
  function serialize(cmpts, opts) {
    const component = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(component, options);
    if (component.path !== undefined) {
      if (!options.skipEscape) {
        component.path = escape(component.path);
        if (component.scheme !== undefined) {
          component.path = component.path.split("%3A").join(":");
        }
      } else {
        component.path = unescape(component.path);
      }
    }
    if (options.reference !== "suffix" && component.scheme) {
      uriTokens.push(component.scheme, ":");
    }
    const authority = recomposeAuthority(component);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (component.path && component.path[0] !== "/") {
        uriTokens.push("/");
      }
    }
    if (component.path !== undefined) {
      let s = component.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (authority === undefined && s[0] === "/" && s[1] === "/") {
        s = "/%2F" + s.slice(2);
      }
      uriTokens.push(s);
    }
    if (component.query !== undefined) {
      uriTokens.push("?", component.query);
    }
    if (component.fragment !== undefined) {
      uriTokens.push("#", component.fragment);
    }
    return uriTokens.join("");
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function parse(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    let isIP = false;
    if (options.reference === "suffix") {
      if (options.scheme) {
        uri = options.scheme + ":" + uri;
      } else {
        uri = "//" + uri;
      }
    }
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      if (parsed.host) {
        const ipv4result = isIPv4(parsed.host);
        if (ipv4result === false) {
          const ipv6result = normalizeIPv6(parsed.host);
          parsed.host = ipv6result.host.toLowerCase();
          isIP = ipv6result.isIPV6;
        } else {
          isIP = true;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
        if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
          try {
            parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
          } catch (e) {
            parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          }
        }
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (uri.indexOf("%") !== -1) {
          if (parsed.scheme !== undefined) {
            parsed.scheme = unescape(parsed.scheme);
          }
          if (parsed.host !== undefined) {
            parsed.host = unescape(parsed.host);
          }
        }
        if (parsed.path) {
          parsed.path = escape(unescape(parsed.path));
        }
        if (parsed.fragment) {
          parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return parsed;
  }
  var fastUri = {
    SCHEMES,
    normalize,
    resolve,
    resolveComponent,
    equal,
    serialize,
    parse
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var uri = require_fast_uri();
  uri.code = 'require("ajv/dist/runtime/uri").default';
  exports.default = uri;
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = undefined;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  var ref_error_1 = require_ref_error();
  var rules_1 = require_rules();
  var compile_1 = require_compile();
  var codegen_2 = require_codegen();
  var resolve_1 = require_resolve();
  var dataType_1 = require_dataType();
  var util_1 = require_util();
  var $dataRefSchema = require_data();
  var uri_1 = require_uri();
  var defaultRegExp = (str, flags) => new RegExp(str, flags);
  defaultRegExp.code = "new RegExp";
  var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  var MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === undefined ? undefined : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === undefined ? undefined : _b.regExp) !== null && _c !== undefined ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== undefined ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== undefined ? _e : s) !== null && _f !== undefined ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== undefined ? _g : s) !== null && _h !== undefined ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== undefined ? _j : s) !== null && _k !== undefined ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== undefined ? _l : s) !== null && _m !== undefined ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== undefined ? _o : s) !== null && _p !== undefined ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== undefined ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== undefined ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== undefined ? _s : true,
      messages: (_t = o.messages) !== null && _t !== undefined ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== undefined ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== undefined ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== undefined ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== undefined ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== undefined ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== undefined ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== undefined ? _0 : true,
      uriResolver
    };
  }

  class Ajv {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = {};
      this._compilations = new Set;
      this._loading = {};
      this._cache = new Map;
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_1.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema, _meta) {
      const sch = this._addSchema(schema, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_1.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref, missingRef }) {
        if (this.refs[ref]) {
          throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref) {
        const _schema = await _loadSchema.call(this, ref);
        if (!this.refs[ref])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref])
          this.addSchema(_schema, ref, meta);
      }
      async function _loadSchema(ref) {
        const p = this._loading[ref];
        if (p)
          return p;
        try {
          return await (this._loading[ref] = loadSchema(ref));
        } finally {
          delete this._loading[ref];
        }
      }
    }
    addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema)) {
        for (const sch of schema)
          this.addSchema(sch, undefined, _meta, _validateSchema);
        return this;
      }
      let id;
      if (typeof schema === "object") {
        const { schemaId } = this.opts;
        id = schema[schemaId];
        if (id !== undefined && typeof id != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_1.normalizeId)(key || id);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
      return this;
    }
    addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema, key, true, _validateSchema);
      return this;
    }
    validateSchema(schema, throwOrLogError) {
      if (typeof schema == "boolean")
        return true;
      let $schema;
      $schema = schema.$schema;
      if ($schema !== undefined && typeof $schema != "string") {
        throw new Error("$schema must be a string");
      }
      $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === undefined) {
        const { schemaId } = this.opts;
        const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
        sch = compile_1.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id = schemaKeyRef[this.opts.schemaId];
          if (id) {
            id = (0, resolve_1.normalizeId)(id);
            delete this.schemas[id];
            delete this.refs[id];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(definitions) {
      for (const def of definitions)
        this.addKeyword(def);
      return this;
    }
    addKeyword(kwdOrDef, def) {
      let keyword;
      if (typeof kwdOrDef == "string") {
        keyword = kwdOrDef;
        if (typeof def == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def.keyword = keyword;
        }
      } else if (typeof kwdOrDef == "object" && def === undefined) {
        def = kwdOrDef;
        keyword = def.keyword;
        if (Array.isArray(keyword) && !keyword.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword, def);
      if (!def) {
        (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def);
      const definition = {
        ...def,
        type: (0, dataType_1.getJSONTypes)(def.type),
        schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
      };
      (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword) {
      const rule = this.RULES.all[keyword];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    removeKeyword(keyword) {
      const { RULES } = this;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this.formats[name] = format;
      return this;
    }
    errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors || errors.length === 0)
        return "No errors";
      return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules) {
          const rule = rules[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema = keywords[key];
          if ($data && schema)
            keywords[key] = schemaOrData(schema);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
      for (const keyRef in schemas) {
        const sch = schemas[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas[keyRef];
          }
        }
      }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id;
      const { schemaId } = this.opts;
      if (typeof schema == "object") {
        id = schema[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema);
      if (sch !== undefined)
        return sch;
      baseId = (0, resolve_1.normalizeId)(id || baseId);
      const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
      sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema, true);
      return sch;
    }
    _checkUnique(id) {
      if (this.schemas[id] || this.refs[id]) {
        throw new Error(`schema with key or id "${id}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_1.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_1.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv.ValidationError = validation_error_1.default;
  Ajv.MissingRefError = ref_error_1.default;
  exports.default = Ajv;
  function checkOptions(checkOpts, options, msg, log2 = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log2](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format = this.opts.formats[name];
      if (format)
        this.addFormat(name, format);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
      const def = defs[keyword];
      if (!def.keyword)
        def.keyword = keyword;
      this.addKeyword(def);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  var noLogs = { log() {}, warn() {}, error() {} };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === undefined)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
      return;
    if (def.$data && !(("code" in def) || ("validate" in def))) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === undefined ? undefined : definition.post;
    if (dataType && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
      return;
    const rule = {
      keyword,
      definition: {
        ...definition,
        type: (0, dataType_1.getJSONTypes)(definition.type),
        schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === undefined || _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
      return;
    if (def.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
  }
  var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var def = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callRef = exports.getValidate = undefined;
  var ref_error_1 = require_ref_error();
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var util_1 = require_util();
  var def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
      const { gen, schema: $ref, it } = cxt;
      const { baseId, schemaEnv: env, validateName, opts, self } = it;
      const { root } = env;
      if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
        return callRootRef();
      const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
      if (schOrEnv === undefined)
        throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
      if (schOrEnv instanceof compile_1.SchemaEnv)
        return callValidate(schOrEnv);
      return inlineRefSchema(schOrEnv);
      function callRootRef() {
        if (env === root)
          return callRef(cxt, validateName, env, env.$async);
        const rootName = gen.scopeValue("root", { ref: root });
        return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
      }
      function callValidate(sch) {
        const v = getValidate(cxt, sch);
        callRef(cxt, v, sch, sch.$async);
      }
      function inlineRefSchema(sch) {
        const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
        const valid = gen.name("valid");
        const schCxt = cxt.subschema({
          schema: sch,
          dataTypes: [],
          schemaPath: codegen_1.nil,
          topSchemaRef: schName,
          errSchemaPath: $ref
        }, valid);
        cxt.mergeEvaluated(schCxt);
        cxt.ok(valid);
      }
    }
  };
  function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  }
  exports.getValidate = getValidate;
  function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
      callAsyncRef();
    else
      callSyncRef();
    function callAsyncRef() {
      if (!env.$async)
        throw new Error("async schema referenced by sync schema");
      const valid = gen.let("valid");
      gen.try(() => {
        gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
        addEvaluatedFrom(v);
        if (!allErrors)
          gen.assign(valid, true);
      }, (e) => {
        gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
        addErrorsFrom(e);
        if (!allErrors)
          gen.assign(valid, false);
      });
      cxt.ok(valid);
    }
    function callSyncRef() {
      cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
      const errs = (0, codegen_1._)`${source}.errors`;
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
      gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
      var _a;
      if (!it.opts.unevaluated)
        return;
      const schEvaluated = (_a = sch === null || sch === undefined ? undefined : sch.validate) === null || _a === undefined ? undefined : _a.evaluated;
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
          }
        } else {
          const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
          it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
          }
        } else {
          const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
          it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
        }
      }
    }
  }
  exports.callRef = callRef;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var id_1 = require_id();
  var ref_1 = require_ref();
  var core = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default
  ];
  exports.default = core;
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  };
  var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, schemaCode, it } = cxt;
      const prec = it.opts.multipleOfPrecision;
      const res = gen.let("res");
      const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
      cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var ucs2length_1 = require_ucs2length();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxLength" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode, it } = cxt;
      const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
      const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
      cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var util_1 = require_util();
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  };
  var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const u = it.opts.unicodeRegExp ? "u" : "";
      if ($data) {
        const { regExp } = it.opts.code;
        const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
        const valid = gen.let("valid");
        gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
        cxt.fail$data((0, codegen_1._)`!${valid}`);
      } else {
        const regExp = (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxProperties" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  };
  var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, schema, schemaCode, data, $data, it } = cxt;
      const { opts } = it;
      if (!$data && schema.length === 0)
        return;
      const useLoop = schema.length >= opts.loopRequired;
      if (it.allErrors)
        allErrorsMode();
      else
        exitOnErrorMode();
      if (opts.strictRequired) {
        const props = cxt.parentSchema.properties;
        const { definedProperties } = cxt.it;
        for (const requiredKey of schema) {
          if ((props === null || props === undefined ? undefined : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
            const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
            const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
            (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
          }
        }
      }
      function allErrorsMode() {
        if (useLoop || $data) {
          cxt.block$data(codegen_1.nil, loopAllRequired);
        } else {
          for (const prop of schema) {
            (0, code_1.checkReportMissingProp)(cxt, prop);
          }
        }
      }
      function exitOnErrorMode() {
        const missing = gen.let("missing");
        if (useLoop || $data) {
          const valid = gen.let("valid", true);
          cxt.block$data(valid, () => loopUntilMissing(missing, valid));
          cxt.ok(valid);
        } else {
          gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
      function loopAllRequired() {
        gen.forOf("prop", schemaCode, (prop) => {
          cxt.setParams({ missingProperty: prop });
          gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
        });
      }
      function loopUntilMissing(missing, valid) {
        cxt.setParams({ missingProperty: missing });
        gen.forOf(missing, schemaCode, () => {
          gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error();
            gen.break();
          });
        }, codegen_1.nil);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxItems" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var equal = require_fast_deep_equal();
  equal.code = 'require("ajv/dist/runtime/equal").default';
  exports.default = equal;
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dataType_1 = require_dataType();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  };
  var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
      if (!$data && !schema)
        return;
      const valid = gen.let("valid");
      const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
      cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
      cxt.ok(valid);
      function validateUniqueItems() {
        const i = gen.let("i", (0, codegen_1._)`${data}.length`);
        const j = gen.let("j");
        cxt.setParams({ i, j });
        gen.assign(valid, true);
        gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
      }
      function canOptimize() {
        return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
      }
      function loopN(i, j) {
        const item = gen.name("item");
        const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
        const indices = gen.const("indices", (0, codegen_1._)`{}`);
        gen.for((0, codegen_1._)`;${i}--;`, () => {
          gen.let(item, (0, codegen_1._)`${data}[${i}]`);
          gen.if(wrongType, (0, codegen_1._)`continue`);
          if (itemTypes.length > 1)
            gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
          gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
            cxt.error();
            gen.assign(valid, false).break();
          }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
        });
      }
      function loopN2(i, j) {
        const eql = (0, util_1.useFunc)(gen, equal_1.default);
        const outer = gen.name("outer");
        gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
          cxt.error();
          gen.assign(valid, false).break(outer);
        })));
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  };
  var def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schemaCode, schema } = cxt;
      if ($data || schema && typeof schema == "object") {
        cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
      } else {
        cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  };
  var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      if (!$data && schema.length === 0)
        throw new Error("enum must have non-empty array");
      const useLoop = schema.length >= it.opts.loopEnum;
      let eql;
      const getEql = () => eql !== null && eql !== undefined ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
      let valid;
      if (useLoop || $data) {
        valid = gen.let("valid");
        cxt.block$data(valid, loopEnum);
      } else {
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const vSchema = gen.const("vSchema", schemaCode);
        valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
      }
      cxt.pass(valid);
      function loopEnum() {
        gen.assign(valid, false);
        gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
      }
      function equalCode(vSchema, i) {
        const sch = schema[i];
        return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var limitNumber_1 = require_limitNumber();
  var multipleOf_1 = require_multipleOf();
  var limitLength_1 = require_limitLength();
  var pattern_1 = require_pattern();
  var limitProperties_1 = require_limitProperties();
  var required_1 = require_required();
  var limitItems_1 = require_limitItems();
  var uniqueItems_1 = require_uniqueItems();
  var const_1 = require_const();
  var enum_1 = require_enum();
  var validation = [
    limitNumber_1.default,
    multipleOf_1.default,
    limitLength_1.default,
    pattern_1.default,
    limitProperties_1.default,
    required_1.default,
    limitItems_1.default,
    uniqueItems_1.default,
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default
  ];
  exports.default = validation;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAdditionalItems = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { parentSchema, it } = cxt;
      const { items } = parentSchema;
      if (!Array.isArray(items)) {
        (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      validateAdditionalItems(cxt, items);
    }
  };
  function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    if (schema === false) {
      cxt.setParams({ len: items.length });
      cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
    } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
      const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
      gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
      cxt.ok(valid);
    }
    function validateItems(valid) {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
        if (!it.allErrors)
          gen.if((0, codegen_1.not)(valid), () => gen.break());
      });
    }
  }
  exports.validateAdditionalItems = validateAdditionalItems;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateTuple = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
      const { schema, it } = cxt;
      if (Array.isArray(schema))
        return validateTuple(cxt, "additionalItems", schema);
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
      it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    schArr.forEach((sch, i) => {
      if ((0, util_1.alwaysValidSchema)(it, sch))
        return;
      gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
        keyword,
        schemaProp: i,
        dataProp: i
      }, valid));
      cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
      const { opts, errSchemaPath } = it;
      const l = schArr.length;
      const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
      if (opts.strictTuples && !fullTuple) {
        const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
        (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
      }
    }
  }
  exports.validateTuple = validateTuple;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var items_1 = require_items();
  var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var additionalItems_1 = require_additionalItems();
  var error = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error,
    code(cxt) {
      const { schema, parentSchema, it } = cxt;
      const { prefixItems } = parentSchema;
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      if (prefixItems)
        (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
      else
        cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params: { min, max } }) => max === undefined ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  };
  var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      let min;
      let max;
      const { minContains, maxContains } = parentSchema;
      if (it.opts.next) {
        min = minContains === undefined ? 1 : minContains;
        max = maxContains;
      } else {
        min = 1;
      }
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      cxt.setParams({ min, max });
      if (max === undefined && min === 0) {
        (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
        return;
      }
      if (max !== undefined && min > max) {
        (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
        cxt.fail();
        return;
      }
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        let cond = (0, codegen_1._)`${len} >= ${min}`;
        if (max !== undefined)
          cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
        cxt.pass(cond);
        return;
      }
      it.items = true;
      const valid = gen.name("valid");
      if (max === undefined && min === 1) {
        validateItems(valid, () => gen.if(valid, () => gen.break()));
      } else if (min === 0) {
        gen.let(valid, true);
        if (max !== undefined)
          gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
      } else {
        gen.let(valid, false);
        validateItemsWithCount();
      }
      cxt.result(valid, () => cxt.reset());
      function validateItemsWithCount() {
        const schValid = gen.name("_valid");
        const count = gen.let("count", 0);
        validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
      }
      function validateItems(_valid, block) {
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword: "contains",
            dataProp: i,
            dataPropType: util_1.Type.Num,
            compositeRule: true
          }, _valid);
          block();
        });
      }
      function checkLimits(count) {
        gen.code((0, codegen_1._)`${count}++`);
        if (max === undefined) {
          gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
        } else {
          gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
          if (min === 1)
            gen.assign(valid, true);
          else
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
  };
  var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_1.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_1.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
        const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
        cxt.mergeValidEvaluated(schCxt, valid);
      }, () => gen.var(valid, true));
      cxt.ok(valid);
    }
  }
  exports.validateSchemaDeps = validateSchemaDeps;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  };
  var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      const valid = gen.name("valid");
      gen.forIn("key", data, (key) => {
        cxt.setParams({ propertyName: key });
        cxt.subschema({
          keyword: "propertyNames",
          data: key,
          dataTypes: ["string"],
          propertyName: key,
          compositeRule: true
        }, valid);
        gen.if((0, codegen_1.not)(valid), () => {
          cxt.error(true);
          if (!it.allErrors)
            gen.break();
        });
      });
      cxt.ok(valid);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var util_1 = require_util();
  var error = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  };
  var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, opts } = it;
      it.props = true;
      if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
        return;
      const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
      const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
      checkAdditionalProperties();
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function checkAdditionalProperties() {
        gen.forIn("key", data, (key) => {
          if (!props.length && !patProps.length)
            additionalPropertyCode(key);
          else
            gen.if(isAdditional(key), () => additionalPropertyCode(key));
        });
      }
      function isAdditional(key) {
        let definedProp;
        if (props.length > 8) {
          const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
          definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
        } else if (props.length) {
          definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
        } else {
          definedProp = codegen_1.nil;
        }
        if (patProps.length) {
          definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
        }
        return (0, codegen_1.not)(definedProp);
      }
      function deleteAdditional(key) {
        gen.code((0, codegen_1._)`delete ${data}[${key}]`);
      }
      function additionalPropertyCode(key) {
        if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
          deleteAdditional(key);
          return;
        }
        if (schema === false) {
          cxt.setParams({ additionalProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          if (opts.removeAdditional === "failing") {
            applyAdditionalSchema(key, valid, false);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset();
              deleteAdditional(key);
            });
          } else {
            applyAdditionalSchema(key, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
      }
      function applyAdditionalSchema(key, valid, errors) {
        const subschema = {
          keyword: "additionalProperties",
          dataProp: key,
          dataPropType: util_1.Type.Str
        };
        if (errors === false) {
          Object.assign(subschema, {
            compositeRule: true,
            createErrors: false,
            allErrors: false
          });
        }
        cxt.subschema(subschema, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var validate_1 = require_validate();
  var code_1 = require_code2();
  var util_1 = require_util();
  var additionalProperties_1 = require_additionalProperties();
  var def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
        additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
      }
      const allProps = (0, code_1.allSchemaProperties)(schema);
      for (const prop of allProps) {
        it.definedProperties.add(prop);
      }
      if (it.opts.unevaluated && allProps.length && it.props !== true) {
        it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
      }
      const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
      if (properties.length === 0)
        return;
      const valid = gen.name("valid");
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop);
        } else {
          gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
          applyPropertySchema(prop);
          if (!it.allErrors)
            gen.else().var(valid, true);
          gen.endIf();
        }
        cxt.it.definedProperties.add(prop);
        cxt.ok(valid);
      }
      function hasDefault(prop) {
        return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
      }
      function applyPropertySchema(prop) {
        cxt.subschema({
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop
        }, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var util_2 = require_util();
  var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, data, parentSchema, it } = cxt;
      const { opts } = it;
      const patterns = (0, code_1.allSchemaProperties)(schema);
      const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
      if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
        return;
      }
      const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
      const valid = gen.name("valid");
      if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
        it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
      }
      const { props } = it;
      validatePatternProperties();
      function validatePatternProperties() {
        for (const pat of patterns) {
          if (checkProperties)
            checkMatchingProperties(pat);
          if (it.allErrors) {
            validateProperties(pat);
          } else {
            gen.var(valid, true);
            validateProperties(pat);
            gen.if(valid);
          }
        }
      }
      function checkMatchingProperties(pat) {
        for (const prop in checkProperties) {
          if (new RegExp(pat).test(prop)) {
            (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
          }
        }
      }
      function validateProperties(pat) {
        gen.forIn("key", data, (key) => {
          gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
            const alwaysValid = alwaysValidPatterns.includes(pat);
            if (!alwaysValid) {
              cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid);
            }
            if (it.opts.unevaluated && props !== true) {
              gen.assign((0, codegen_1._)`${props}[${key}]`, true);
            } else if (!alwaysValid && !it.allErrors) {
              gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
      const { gen, schema, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        cxt.fail();
        return;
      }
      const valid = gen.name("valid");
      cxt.subschema({
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, valid);
      cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  };
  var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, schema, parentSchema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (it.opts.discriminator && parentSchema.discriminator)
        return;
      const schArr = schema;
      const valid = gen.let("valid", false);
      const passing = gen.let("passing", null);
      const schValid = gen.name("_valid");
      cxt.setParams({ passing });
      gen.block(validateOneOf);
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      function validateOneOf() {
        schArr.forEach((sch, i) => {
          let schCxt;
          if ((0, util_1.alwaysValidSchema)(it, sch)) {
            gen.var(schValid, true);
          } else {
            schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true
            }, schValid);
          }
          if (i > 0) {
            gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
          }
          gen.if(schValid, () => {
            gen.assign(valid, true);
            gen.assign(passing, i);
            if (schCxt)
              cxt.mergeEvaluated(schCxt, codegen_1.Name);
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
      const { gen, schema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const valid = gen.name("valid");
      schema.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
        cxt.ok(valid);
        cxt.mergeEvaluated(schCxt);
      });
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error = {
    message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  };
  var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error,
    code(cxt) {
      const { gen, parentSchema, it } = cxt;
      if (parentSchema.then === undefined && parentSchema.else === undefined) {
        (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
      }
      const hasThen = hasSchema(it, "then");
      const hasElse = hasSchema(it, "else");
      if (!hasThen && !hasElse)
        return;
      const valid = gen.let("valid", true);
      const schValid = gen.name("_valid");
      validateIf();
      cxt.reset();
      if (hasThen && hasElse) {
        const ifClause = gen.let("ifClause");
        cxt.setParams({ ifClause });
        gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
      } else if (hasThen) {
        gen.if(schValid, validateClause("then"));
      } else {
        gen.if((0, codegen_1.not)(schValid), validateClause("else"));
      }
      cxt.pass(valid, () => cxt.error(true));
      function validateIf() {
        const schCxt = cxt.subschema({
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, schValid);
        cxt.mergeEvaluated(schCxt);
      }
      function validateClause(keyword, ifClause) {
        return () => {
          const schCxt = cxt.subschema({ keyword }, schValid);
          gen.assign(valid, schValid);
          cxt.mergeValidEvaluated(schCxt, valid);
          if (ifClause)
            gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
          else
            cxt.setParams({ ifClause: keyword });
        };
      }
    }
  };
  function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
  }
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
      if (parentSchema.if === undefined)
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var additionalItems_1 = require_additionalItems();
  var prefixItems_1 = require_prefixItems();
  var items_1 = require_items();
  var items2020_1 = require_items2020();
  var contains_1 = require_contains();
  var dependencies_1 = require_dependencies();
  var propertyNames_1 = require_propertyNames();
  var additionalProperties_1 = require_additionalProperties();
  var properties_1 = require_properties();
  var patternProperties_1 = require_patternProperties();
  var not_1 = require_not();
  var anyOf_1 = require_anyOf();
  var oneOf_1 = require_oneOf();
  var allOf_1 = require_allOf();
  var if_1 = require_if();
  var thenElse_1 = require_thenElse();
  function getApplicator(draft2020 = false) {
    const applicator = [
      not_1.default,
      anyOf_1.default,
      oneOf_1.default,
      allOf_1.default,
      if_1.default,
      thenElse_1.default,
      propertyNames_1.default,
      additionalProperties_1.default,
      dependencies_1.default,
      properties_1.default,
      patternProperties_1.default
    ];
    if (draft2020)
      applicator.push(prefixItems_1.default, items2020_1.default);
    else
      applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
  }
  exports.default = getApplicator;
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  };
  var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error,
    code(cxt, ruleType) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const { opts, errSchemaPath, schemaEnv, self } = it;
      if (!opts.validateFormats)
        return;
      if ($data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self.formats,
          code: opts.code.formats
        });
        const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
        const fType = gen.let("fType");
        const format = gen.let("format");
        gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
        cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
        function unknownFmt() {
          if (opts.strictSchema === false)
            return codegen_1.nil;
          return (0, codegen_1._)`${schemaCode} && !${format}`;
        }
        function invalidFmt() {
          const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
          const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
          return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
        }
      }
      function validateFormat() {
        const formatDef = self.formats[schema];
        if (!formatDef) {
          unknownFormat();
          return;
        }
        if (formatDef === true)
          return;
        const [fmtType, format, fmtRef] = getFormat(formatDef);
        if (fmtType === ruleType)
          cxt.pass(validCondition());
        function unknownFormat() {
          if (opts.strictSchema === false) {
            self.logger.warn(unknownMsg());
            return;
          }
          throw new Error(unknownMsg());
          function unknownMsg() {
            return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
          }
        }
        function getFormat(fmtDef) {
          const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : undefined;
          const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
          if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
            return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
          }
          return ["string", fmtDef, fmt];
        }
        function validCondition() {
          if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
            if (!schemaEnv.$async)
              throw new Error("async format in sync schema");
            return (0, codegen_1._)`await ${fmtRef}(${data})`;
          }
          return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var format_1 = require_format();
  var format = [format_1.default];
  exports.default = format;
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.contentVocabulary = exports.metadataVocabulary = undefined;
  exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ];
  exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ];
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var core_1 = require_core2();
  var validation_1 = require_validation();
  var applicator_1 = require_applicator();
  var format_1 = require_format2();
  var metadata_1 = require_metadata();
  var draft7Vocabularies = [
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary
  ];
  exports.default = draft7Vocabularies;
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiscrError = undefined;
  var DiscrError;
  (function(DiscrError2) {
    DiscrError2["Tag"] = "tag";
    DiscrError2["Mapping"] = "mapping";
  })(DiscrError || (exports.DiscrError = DiscrError = {}));
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var types_1 = require_types();
  var compile_1 = require_compile();
  var ref_error_1 = require_ref_error();
  var util_1 = require_util();
  var error = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  };
  var def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error,
    code(cxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { oneOf } = parentSchema;
      if (!it.opts.discriminator) {
        throw new Error("discriminator: requires discriminator option");
      }
      const tagName = schema.propertyName;
      if (typeof tagName != "string")
        throw new Error("discriminator: requires propertyName");
      if (schema.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!oneOf)
        throw new Error("discriminator: requires oneOf keyword");
      const valid = gen.let("valid", false);
      const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
      gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
      cxt.ok(valid);
      function validateMapping() {
        const mapping = getMapping();
        gen.if(false);
        for (const tagValue in mapping) {
          gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
          gen.assign(valid, applyTagSchema(mapping[tagValue]));
        }
        gen.else();
        cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
        gen.endIf();
      }
      function applyTagSchema(schemaProp) {
        const _valid = gen.name("valid");
        const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
        cxt.mergeEvaluated(schCxt, codegen_1.Name);
        return _valid;
      }
      function getMapping() {
        var _a;
        const oneOfMapping = {};
        const topRequired = hasRequired(parentSchema);
        let tagRequired = true;
        for (let i = 0;i < oneOf.length; i++) {
          let sch = oneOf[i];
          if ((sch === null || sch === undefined ? undefined : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
            const ref = sch.$ref;
            sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
            if (sch instanceof compile_1.SchemaEnv)
              sch = sch.schema;
            if (sch === undefined)
              throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
          }
          const propSch = (_a = sch === null || sch === undefined ? undefined : sch.properties) === null || _a === undefined ? undefined : _a[tagName];
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
          }
          tagRequired = tagRequired && (topRequired || hasRequired(sch));
          addMappings(propSch, i);
        }
        if (!tagRequired)
          throw new Error(`discriminator: "${tagName}" must be required`);
        return oneOfMapping;
        function hasRequired({ required }) {
          return Array.isArray(required) && required.includes(tagName);
        }
        function addMappings(sch, i) {
          if (sch.const) {
            addMapping(sch.const, i);
          } else if (sch.enum) {
            for (const tagValue of sch.enum) {
              addMapping(tagValue, i);
            }
          } else {
            throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
        }
        function addMapping(tagValue, i) {
          if (typeof tagValue != "string" || tagValue in oneOfMapping) {
            throw new Error(`discriminator: "${tagName}" values must be unique strings`);
          }
          oneOfMapping[tagValue] = i;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://json-schema.org/draft-07/schema#",
    title: "Core schema meta-schema",
    definitions: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $ref: "#" }
      },
      nonNegativeInteger: {
        type: "integer",
        minimum: 0
      },
      nonNegativeIntegerDefault0: {
        allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
      },
      simpleTypes: {
        enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: []
      }
    },
    type: ["object", "boolean"],
    properties: {
      $id: {
        type: "string",
        format: "uri-reference"
      },
      $schema: {
        type: "string",
        format: "uri"
      },
      $ref: {
        type: "string",
        format: "uri-reference"
      },
      $comment: {
        type: "string"
      },
      title: {
        type: "string"
      },
      description: {
        type: "string"
      },
      default: true,
      readOnly: {
        type: "boolean",
        default: false
      },
      examples: {
        type: "array",
        items: true
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0
      },
      maximum: {
        type: "number"
      },
      exclusiveMaximum: {
        type: "number"
      },
      minimum: {
        type: "number"
      },
      exclusiveMinimum: {
        type: "number"
      },
      maxLength: { $ref: "#/definitions/nonNegativeInteger" },
      minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex"
      },
      additionalItems: { $ref: "#" },
      items: {
        anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
        default: true
      },
      maxItems: { $ref: "#/definitions/nonNegativeInteger" },
      minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false
      },
      contains: { $ref: "#" },
      maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
      minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      required: { $ref: "#/definitions/stringArray" },
      additionalProperties: { $ref: "#" },
      definitions: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      properties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        propertyNames: { format: "regex" },
        default: {}
      },
      dependencies: {
        type: "object",
        additionalProperties: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
        }
      },
      propertyNames: { $ref: "#" },
      const: true,
      enum: {
        type: "array",
        items: true,
        minItems: 1,
        uniqueItems: true
      },
      type: {
        anyOf: [
          { $ref: "#/definitions/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/definitions/simpleTypes" },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      format: { type: "string" },
      contentMediaType: { type: "string" },
      contentEncoding: { type: "string" },
      if: { $ref: "#" },
      then: { $ref: "#" },
      else: { $ref: "#" },
      allOf: { $ref: "#/definitions/schemaArray" },
      anyOf: { $ref: "#/definitions/schemaArray" },
      oneOf: { $ref: "#/definitions/schemaArray" },
      not: { $ref: "#" }
    },
    default: true
  };
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = undefined;
  var core_1 = require_core();
  var draft7_1 = require_draft7();
  var discriminator_1 = require_discriminator();
  var draft7MetaSchema = require_json_schema_draft_07();
  var META_SUPPORT_DATA = ["/properties"];
  var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";

  class Ajv extends core_1.default {
    _addVocabularies() {
      super._addVocabularies();
      draft7_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      if (!this.opts.meta)
        return;
      const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
      this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined);
    }
  }
  exports.Ajv = Ajv;
  module.exports = exports = Ajv;
  module.exports.Ajv = Ajv;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = Ajv;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return validation_error_1.default;
  } });
  var ref_error_1 = require_ref_error();
  Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_1.default;
  } });
});

// node_modules/@iggy.rs/sdk/dist/wire/client/client.utils.js
var transportString = (t) => {
  switch (t.toString()) {
    case "1":
      return "tcp";
    case "2":
      return "quic";
    default:
      return `unknown_transport_${t}`;
  }
}, deserializeClient = (r, pos = 0) => {
  const addressLength = r.readUInt32LE(pos + 9);
  return {
    bytesRead: 13 + addressLength + 4,
    data: {
      clientId: r.readUInt32LE(pos),
      userId: r.readUInt32LE(pos + 4),
      transport: transportString(r.readUInt8(pos + 8)),
      address: r.subarray(pos + 13, pos + 13 + addressLength).toString(),
      consumerGroupCount: r.readUInt32LE(pos + 13 + addressLength)
    }
  };
};

// node_modules/@iggy.rs/sdk/dist/wire/command.utils.js
function wrapCommand(cmd) {
  return (getClient) => async (arg) => cmd.deserialize(await (await getClient()).sendCommand(cmd.code, cmd.serialize(arg)));
}

// node_modules/@iggy.rs/sdk/dist/wire/client/get-client.command.js
var GET_CLIENT, getClient;
var init_get_client_command = __esm(() => {
  GET_CLIENT = {
    code: 21,
    serialize: ({ clientId }) => {
      const b = Buffer.alloc(4);
      b.writeUInt32LE(clientId);
      return b;
    },
    deserialize: (r) => deserializeClient(r.data).data
  };
  getClient = wrapCommand(GET_CLIENT);
});

// node_modules/@iggy.rs/sdk/dist/wire/client/get-clients.command.js
var GET_CLIENTS, getClients;
var init_get_clients_command = __esm(() => {
  GET_CLIENTS = {
    code: 22,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => {
      const payloadSize = r.data.length;
      const clients = [];
      let pos = 0;
      while (pos < payloadSize) {
        const { bytesRead, data } = deserializeClient(r.data, pos);
        clients.push(data);
        pos += bytesRead;
      }
      return clients;
    }
  };
  getClients = wrapCommand(GET_CLIENTS);
});

// node_modules/@iggy.rs/sdk/dist/wire/client/get-me.command.js
var GET_ME, getMe;
var init_get_me_command = __esm(() => {
  GET_ME = {
    code: 20,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => deserializeClient(r.data).data
  };
  getMe = wrapCommand(GET_ME);
});

// node_modules/@iggy.rs/sdk/dist/wire/client/index.js
var init_client = __esm(() => {
  init_get_client_command();
  init_get_clients_command();
  init_get_me_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/identifier.utils.js
var NUMERIC = 1, STRING = 2, serializeIdentifier = (id) => {
  if (typeof id === "string") {
    return serializeStringId(id);
  }
  if (typeof id === "number") {
    return serializeNumericId(id);
  }
  throw new Error(`Unsuported id type (${id} - ${typeof id})`);
}, serializeStringId = (id) => {
  const b = Buffer.alloc(1 + 1);
  const bId = Buffer.from(id);
  if (bId.length < 1 || bId.length > 255)
    throw new Error("identifier/name should be between 1 and 255 bytes");
  b.writeUInt8(STRING);
  b.writeUInt8(bId.length, 1);
  return Buffer.concat([
    b,
    bId
  ]);
}, serializeNumericId = (id) => {
  const b = Buffer.alloc(1 + 1 + 4);
  b.writeUInt8(NUMERIC);
  b.writeUInt8(4, 1);
  b.writeUInt32LE(id, 2);
  return b;
};

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/group.utils.js
var serializeTargetGroup = (streamId, topicId, groupId) => {
  return Buffer.concat([
    serializeIdentifier(streamId),
    serializeIdentifier(topicId),
    serializeIdentifier(groupId)
  ]);
}, deserializeConsumerGroup = (r, pos = 0) => {
  const id = r.readUInt32LE(pos);
  const partitionsCount = r.readUInt32LE(pos + 4);
  const membersCount = r.readUInt32LE(pos + 8);
  const nameLength = r.readUInt8(pos + 12);
  const name = r.subarray(pos + 13, pos + 13 + nameLength).toString();
  return {
    bytesRead: 4 + 4 + 4 + 1 + nameLength,
    data: {
      id,
      name,
      partitionsCount,
      membersCount
    }
  };
}, deserializeConsumerGroups = (r, pos = 0) => {
  const end = r.length;
  const cgroups = [];
  while (pos < end) {
    const { bytesRead, data } = deserializeConsumerGroup(r, pos);
    cgroups.push(data);
    pos += bytesRead;
  }
  return cgroups;
};
var init_group_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/create-group.command.js
var CREATE_GROUP, createGroup;
var init_create_group_command = __esm(() => {
  init_group_utils();
  CREATE_GROUP = {
    code: 602,
    serialize: ({ streamId, topicId, groupId, name }) => {
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Consumer group name should be between 1 and 255 bytes");
      const b = Buffer.allocUnsafe(5);
      b.writeUInt32LE(groupId);
      b.writeUInt8(bName.length, 4);
      return Buffer.concat([
        serializeIdentifier(streamId),
        serializeIdentifier(topicId),
        b,
        bName
      ]);
    },
    deserialize: (r) => {
      return deserializeConsumerGroup(r.data).data;
    }
  };
  createGroup = wrapCommand(CREATE_GROUP);
});

// node_modules/@iggy.rs/sdk/dist/type.utils.js
function reverseRecord(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [
    value,
    key
  ]));
}

// node_modules/@iggy.rs/sdk/dist/wire/command.code.js
var COMMAND_CODE, reverseCommandCodeMap, translateCommandCode = (code) => {
  return reverseCommandCodeMap[code.toString()] || `unknow_command_code_${code}`;
};
var init_command_code = __esm(() => {
  COMMAND_CODE = {
    Ping: "1",
    GetStats: "10",
    GetMe: "20",
    GetClient: "21",
    GetClients: "22",
    GetUser: "31",
    GetUsers: "32",
    CreateUser: "33",
    DeleteUser: "34",
    UpdateUser: "35",
    UpdatePermissions: "36",
    ChangePassword: "37",
    LoginUser: "38",
    LogoutUser: "39",
    GetAccessTokens: "41",
    CreateAccessToken: "42",
    DeleteAccessToken: "43",
    LoginWithAccessToken: "44",
    PollMessages: "100",
    SendMessages: "101",
    GetOffset: "120",
    StoreOffset: "121",
    GetStream: "200",
    GetStreams: "201",
    CreateStream: "202",
    DeleteStream: "203",
    UpdateStream: "204",
    PurgeStream: "205",
    GetTopic: "300",
    GetTopics: "301",
    CreateTopic: "302",
    DeleteTopic: "303",
    UpdateTopic: "304",
    PurgeTopic: "305",
    CreatePartitions: "402",
    DeletePartitions: "403",
    GetGroup: "600",
    GetGroups: "601",
    CreateGroup: "602",
    DeleteGroup: "603",
    JoinGroup: "604",
    LeaveGroup: "605"
  };
  reverseCommandCodeMap = reverseRecord(COMMAND_CODE);
});

// node_modules/ms/index.js
var require_ms = __commonJS((exports, module) => {
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS((exports, module) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0;i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self, args);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      let i;
      const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      const len = split.length;
      for (i = 0;i < len; i++) {
        if (!split[i]) {
          continue;
        }
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
        } else {
          createDebug.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      const namespaces = [
        ...createDebug.names.map(toNamespace),
        ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      if (name[name.length - 1] === "*") {
        return true;
      }
      let i;
      let len;
      for (i = 0, len = createDebug.skips.length;i < len; i++) {
        if (createDebug.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = createDebug.names.length;i < len; i++) {
        if (createDebug.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function toNamespace(regexp) {
      return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module.exports = setup;
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS((exports, module) => {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {}
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error) {}
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = process.env.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module.exports = require_common()(exports);
  var { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS((exports, module) => {
  module.exports = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS((exports, module) => {
  var os = __require("os");
  var tty = __require("tty");
  var hasFlag = require_has_flag();
  var { env } = process;
  var forceColor;
  if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
    forceColor = 0;
  } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === undefined) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  module.exports = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
});

// node_modules/debug/src/node.js
var require_node = __commonJS((exports, module) => {
  var tty = __require("tty");
  var util = __require("util");
  exports.init = init;
  exports.log = log2;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  exports.colors = [6, 2, 3, 4, 5, 1];
  try {
    const supportsColor = require_supports_color();
    if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
      exports.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ];
    }
  } catch (error) {}
  exports.inspectOpts = Object.keys(process.env).filter((key) => {
    return /^debug_/i.test(key);
  }).reduce((obj, key) => {
    const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
      return k.toUpperCase();
    });
    let val = process.env[key];
    if (/^(yes|on|true|enabled)$/i.test(val)) {
      val = true;
    } else if (/^(no|off|false|disabled)$/i.test(val)) {
      val = false;
    } else if (val === "null") {
      val = null;
    } else {
      val = Number(val);
    }
    obj[prop] = val;
    return obj;
  }, {});
  function useColors() {
    return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
  }
  function formatArgs(args) {
    const { namespace: name, useColors: useColors2 } = this;
    if (useColors2) {
      const c = this.color;
      const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
      const prefix = `  ${colorCode};1m${name} \x1B[0m`;
      args[0] = prefix + args[0].split(`
`).join(`
` + prefix);
      args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
    } else {
      args[0] = getDate() + name + " " + args[0];
    }
  }
  function getDate() {
    if (exports.inspectOpts.hideDate) {
      return "";
    }
    return new Date().toISOString() + " ";
  }
  function log2(...args) {
    return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + `
`);
  }
  function save(namespaces) {
    if (namespaces) {
      process.env.DEBUG = namespaces;
    } else {
      delete process.env.DEBUG;
    }
  }
  function load() {
    return process.env.DEBUG;
  }
  function init(debug) {
    debug.inspectOpts = {};
    const keys = Object.keys(exports.inspectOpts);
    for (let i = 0;i < keys.length; i++) {
      debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
    }
  }
  module.exports = require_common()(exports);
  var { formatters } = module.exports;
  formatters.o = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts).split(`
`).map((str) => str.trim()).join(" ");
  };
  formatters.O = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts);
  };
});

// node_modules/debug/src/index.js
var require_src = __commonJS((exports, module) => {
  if (typeof process === "undefined" || process.type === "renderer" || false || process.__nwjs) {
    module.exports = require_browser();
  } else {
    module.exports = require_node();
  }
});

// node_modules/@iggy.rs/sdk/dist/client/client.debug.js
var import_debug, debug;
var init_client_debug = __esm(() => {
  import_debug = __toESM(require_src(), 1);
  debug = import_debug.default("iggy:client");
});

// node_modules/@iggy.rs/sdk/dist/client/client.utils.js
import { Transform } from "node:stream";
var handleResponse = (r) => {
  const status = r.readUint32LE(0);
  const length = r.readUint32LE(4);
  debug("<== handleResponse", { status, length });
  return {
    status,
    length,
    data: r.subarray(8)
  };
}, handleResponseTransform = () => new Transform({
  transform(chunk, encoding, cb) {
    try {
      const r = handleResponse(chunk);
      debug("response::", r);
      return cb(null, r.data);
    } catch (err) {
      return cb(new Error("handleResponseTransform error", { cause: err }), null);
    }
  }
}), deserializeVoidResponse = (r) => r.status === 0 && r.data.length === 0, COMMAND_LENGTH = 4, serializeCommand = (command, payload) => {
  const payloadSize = payload.length + COMMAND_LENGTH;
  const head = Buffer.allocUnsafe(8);
  head.writeUint32LE(payloadSize, 0);
  head.writeUint32LE(command, 4);
  debug("==> CMD", command, translateCommandCode(command), head.subarray(4, 8).toString("hex"), "LENGTH", payloadSize, head.subarray(0, 4).toString("hex"));
  debug("message#HEAD", head.toString("hex"));
  debug("message#PAYLOAD", payload.toString("hex"));
  const pl = Buffer.concat([head, payload]);
  debug("FullMessage#Base64", pl.toString("base64"));
  return pl;
};
var init_client_utils = __esm(() => {
  init_command_code();
  init_client_debug();
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/delete-group.command.js
var DELETE_GROUP, deleteGroup;
var init_delete_group_command = __esm(() => {
  init_group_utils();
  init_client_utils();
  DELETE_GROUP = {
    code: 603,
    serialize: ({ streamId, topicId, groupId }) => {
      return serializeTargetGroup(streamId, topicId, groupId);
    },
    deserialize: deserializeVoidResponse
  };
  deleteGroup = wrapCommand(DELETE_GROUP);
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/get-group.command.js
var GET_GROUP, getGroup;
var init_get_group_command = __esm(() => {
  init_group_utils();
  GET_GROUP = {
    code: 600,
    serialize: ({ streamId, topicId, groupId }) => {
      return serializeTargetGroup(streamId, topicId, groupId);
    },
    deserialize: (r) => {
      return deserializeConsumerGroup(r.data).data;
    }
  };
  getGroup = wrapCommand(GET_GROUP);
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/get-groups.command.js
var GET_GROUPS, getGroups;
var init_get_groups_command = __esm(() => {
  init_group_utils();
  GET_GROUPS = {
    code: 601,
    serialize: ({ streamId, topicId }) => {
      return Buffer.concat([
        serializeIdentifier(streamId),
        serializeIdentifier(topicId)
      ]);
    },
    deserialize: (r) => {
      return deserializeConsumerGroups(r.data);
    }
  };
  getGroups = wrapCommand(GET_GROUPS);
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/join-group.command.js
var JOIN_GROUP, joinGroup;
var init_join_group_command = __esm(() => {
  init_group_utils();
  init_client_utils();
  JOIN_GROUP = {
    code: 604,
    serialize: ({ streamId, topicId, groupId }) => {
      return serializeTargetGroup(streamId, topicId, groupId);
    },
    deserialize: deserializeVoidResponse
  };
  joinGroup = wrapCommand(JOIN_GROUP);
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/leave-group.command.js
var LEAVE_GROUP, leaveGroup;
var init_leave_group_command = __esm(() => {
  init_group_utils();
  init_client_utils();
  LEAVE_GROUP = {
    code: 605,
    serialize: ({ streamId, topicId, groupId }) => {
      return serializeTargetGroup(streamId, topicId, groupId);
    },
    deserialize: deserializeVoidResponse
  };
  leaveGroup = wrapCommand(LEAVE_GROUP);
});

// node_modules/@iggy.rs/sdk/dist/wire/consumer-group/index.js
var init_consumer_group = __esm(() => {
  init_create_group_command();
  init_delete_group_command();
  init_get_group_command();
  init_get_groups_command();
  init_join_group_command();
  init_leave_group_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/serialize.utils.js
var toDate = (n) => new Date(Number(n / BigInt(1000))), deserializeUUID = (p) => {
  const v = p.toString("hex");
  return `${v.slice(0, 8)}-` + `${v.slice(8, 12)}-${v.slice(12, 16)}-${v.slice(16, 20)}-` + `${v.slice(20, 32)}`;
};

// node_modules/@iggy.rs/sdk/dist/wire/number.utils.js
var boolToBuf = (v) => {
  const b = Buffer.allocUnsafe(1);
  b.writeUInt8(!v ? 0 : 1);
  return b;
}, int8ToBuf = (v) => {
  const b = Buffer.allocUnsafe(1);
  b.writeInt8(v);
  return b;
}, int16ToBuf = (v) => {
  const b = Buffer.allocUnsafe(2);
  b.writeInt16LE(v);
  return b;
}, int32ToBuf = (v) => {
  const b = Buffer.allocUnsafe(4);
  b.writeInt32LE(v);
  return b;
}, int64ToBuf = (v) => {
  const b = Buffer.allocUnsafe(8);
  b.writeBigInt64LE(v);
  return b;
}, uint8ToBuf = (v) => {
  const b = Buffer.allocUnsafe(1);
  b.writeUInt8(v);
  return b;
}, uint16ToBuf = (v) => {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16LE(v);
  return b;
}, uint32ToBuf = (v) => {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(v);
  return b;
}, uint64ToBuf = (v) => {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(v);
  return b;
}, floatToBuf = (v) => {
  const b = Buffer.allocUnsafe(4);
  b.writeFloatLE(v);
  return b;
}, doubleToBuf = (v) => {
  const b = Buffer.allocUnsafe(8);
  b.writeDoubleLE(v);
  return b;
};

// node_modules/@iggy.rs/sdk/dist/wire/offset/offset.utils.js
var ConsumerKind, serializeGetOffset = (streamId, topicId, consumer, partitionId) => {
  if (consumer.kind === ConsumerKind.Single && (!partitionId || partitionId < 1))
    throw new Error("getOffset error: partitionId must be > 0 for single consumer kind");
  const streamIdentifier = serializeIdentifier(streamId);
  const topicIdentifier = serializeIdentifier(topicId);
  const consumerIdentifier = serializeIdentifier(consumer.id);
  const b1 = uint8ToBuf(consumer.kind);
  const b2 = uint32ToBuf(partitionId || 0);
  return Buffer.concat([
    b1,
    consumerIdentifier,
    streamIdentifier,
    topicIdentifier,
    b2
  ]);
}, serializeStoreOffset = (streamId, topicId, consumer, partitionId, offset) => {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(offset, 0);
  return Buffer.concat([
    serializeGetOffset(streamId, topicId, consumer, partitionId),
    b
  ]);
};
var init_offset_utils = __esm(() => {
  ConsumerKind = {
    Single: 1,
    Group: 2
  };
});

// node_modules/@iggy.rs/sdk/dist/wire/message/header.type.js
var HeaderKind, ReverseHeaderKind;
var init_header_type = __esm(() => {
  HeaderKind = {
    Raw: 1,
    String: 2,
    Bool: 3,
    Int8: 4,
    Int16: 5,
    Int32: 6,
    Int64: 7,
    Int128: 8,
    Uint8: 9,
    Uint16: 10,
    Uint32: 11,
    Uint64: 12,
    Uint128: 13,
    Float: 14,
    Double: 15
  };
  ReverseHeaderKind = reverseRecord(HeaderKind);
});

// node_modules/@iggy.rs/sdk/dist/wire/message/header.utils.js
var serializeHeaderValue = (header) => {
  const { kind, value } = header;
  switch (kind) {
    case HeaderKind.Raw:
      return value;
    case HeaderKind.String:
      return Buffer.from(value);
    case HeaderKind.Bool:
      return boolToBuf(value);
    case HeaderKind.Int8:
      return int8ToBuf(value);
    case HeaderKind.Int16:
      return int16ToBuf(value);
    case HeaderKind.Int32:
      return int32ToBuf(value);
    case HeaderKind.Int64:
      return int64ToBuf(value);
    case HeaderKind.Int128:
      return value;
    case HeaderKind.Uint8:
      return uint8ToBuf(value);
    case HeaderKind.Uint16:
      return uint16ToBuf(value);
    case HeaderKind.Uint32:
      return uint32ToBuf(value);
    case HeaderKind.Uint64:
      return uint64ToBuf(value);
    case HeaderKind.Uint128:
      return value;
    case HeaderKind.Float:
      return floatToBuf(value);
    case HeaderKind.Double:
      return doubleToBuf(value);
  }
}, serializeHeader = (key, v) => {
  const bKey = Buffer.from(key);
  const b1 = uint32ToBuf(bKey.length);
  const b2 = Buffer.alloc(5);
  b2.writeUInt8(v.kind);
  b2.writeUInt32LE(v.value.length, 1);
  return Buffer.concat([
    b1,
    bKey,
    b2,
    v.value
  ]);
}, EMPTY_HEADERS, createHeaderValue = (header) => ({
  kind: header.kind,
  value: serializeHeaderValue(header)
}), serializeHeaders = (headers) => {
  if (!headers)
    return EMPTY_HEADERS;
  return Buffer.concat(Object.keys(headers).map((c) => serializeHeader(c, createHeaderValue(headers[c]))));
}, mapHeaderKind = (k) => {
  if (!ReverseHeaderKind[k])
    throw new Error(`unknow header kind: ${k}`);
  return ReverseHeaderKind[k];
}, deserializeHeaderValue = (kind, value) => {
  switch (kind) {
    case HeaderKind.Int128:
    case HeaderKind.Uint128:
    case HeaderKind.Raw:
      return value;
    case HeaderKind.String:
      return value.toString();
    case HeaderKind.Int8:
      return value.readInt8();
    case HeaderKind.Int16:
      return value.readInt16LE();
    case HeaderKind.Int32:
      return value.readInt32LE();
    case HeaderKind.Int64:
      return value.readBigInt64LE();
    case HeaderKind.Uint8:
      return value.readUint8();
    case HeaderKind.Uint16:
      return value.readUint16LE();
    case HeaderKind.Uint32:
      return value.readUInt32LE();
    case HeaderKind.Uint64:
      return value.readBigUInt64LE();
    case HeaderKind.Bool:
      return value.readUInt8() === 1;
    case HeaderKind.Float:
      return value.readFloatLE();
    case HeaderKind.Double:
      return value.readDoubleLE();
    default:
      throw new Error(`deserializeHeaderValue: invalid HeaderKind ${kind}`);
  }
}, deserializeHeader = (p, pos = 0) => {
  const keyLength = p.readUInt32LE(pos);
  const key = p.subarray(pos + 4, pos + 4 + keyLength).toString();
  pos += keyLength + 4;
  const rawKind = p.readUInt8(pos);
  const valueLength = p.readUInt32LE(pos + 1);
  const value = deserializeHeaderValue(rawKind, p.subarray(pos + 5, pos + 5 + valueLength));
  return {
    bytesRead: 4 + 4 + 1 + keyLength + valueLength,
    data: {
      key,
      kind: rawKind,
      value
    }
  };
}, deserializeHeaders = (p, pos = 0) => {
  const headers = {};
  const len = p.length;
  while (pos < len) {
    const { bytesRead, data: { kind, key, value } } = deserializeHeader(p, pos);
    headers[key] = { kind, value };
    pos += bytesRead;
  }
  return headers;
}, Raw = (value) => ({
  kind: HeaderKind.Raw,
  value
}), String2 = (value) => ({
  kind: HeaderKind.String,
  value
}), Bool = (value) => ({
  kind: HeaderKind.Bool,
  value
}), Int8 = (value) => ({
  kind: HeaderKind.Int8,
  value
}), Int16 = (value) => ({
  kind: HeaderKind.Int16,
  value
}), Int32 = (value) => ({
  kind: HeaderKind.Int32,
  value
}), Int64 = (value) => ({
  kind: HeaderKind.Int64,
  value
}), Int128 = (value) => ({
  kind: HeaderKind.Int128,
  value
}), Uint8 = (value) => ({
  kind: HeaderKind.Uint8,
  value
}), Uint16 = (value) => ({
  kind: HeaderKind.Uint16,
  value
}), Uint32 = (value) => ({
  kind: HeaderKind.Uint32,
  value
}), Uint64 = (value) => ({
  kind: HeaderKind.Uint64,
  value
}), Uint128 = (value) => ({
  kind: HeaderKind.Uint128,
  value
}), Float = (value) => ({
  kind: HeaderKind.Float,
  value
}), Double = (value) => ({
  kind: HeaderKind.Double,
  value
}), getKind = (h) => mapHeaderKind(h.kind), getValue = (h) => h.value, HeaderValue;
var init_header_utils = __esm(() => {
  init_header_type();
  EMPTY_HEADERS = Buffer.alloc(0);
  HeaderValue = {
    Raw,
    String: String2,
    Bool,
    Int8,
    Int16,
    Int32,
    Int64,
    Int128,
    Uint8,
    Uint16,
    Uint32,
    Uint64,
    Uint128,
    Float,
    Double,
    getKind,
    getValue
  };
});

// node_modules/@iggy.rs/sdk/dist/wire/message/poll.utils.js
var PollingStrategyKind, Next, First, Last, Offset = (n) => ({
  kind: PollingStrategyKind.Offset,
  value: n
}), Timestamp = (n) => ({
  kind: PollingStrategyKind.Timestamp,
  value: n
}), PollingStrategy, serializePollMessages = (streamId, topicId, consumer, partitionId, pollingStrategy, count = 10, autocommit = false) => {
  const b = Buffer.allocUnsafe(14);
  b.writeUInt8(pollingStrategy.kind, 0);
  b.writeBigUInt64LE(pollingStrategy.value, 1);
  b.writeUInt32LE(count, 9);
  b.writeUInt8(autocommit ? 1 : 0, 13);
  return Buffer.concat([
    serializeGetOffset(streamId, topicId, consumer, partitionId),
    b
  ]);
}, MessageState, ReverseMessageState, mapMessageState = (k) => {
  if (!ReverseMessageState[k])
    throw new Error(`unknow message state: ${k}`);
  return ReverseMessageState[k];
}, deserializePollMessages = (r, pos = 0) => {
  const len = r.length;
  const partitionId = r.readUInt32LE(pos);
  const currentOffset = r.readBigUInt64LE(pos + 4);
  const messageCount = r.readUInt32LE(pos + 12);
  const messages = [];
  pos += 16;
  if (pos >= len) {
    return {
      partitionId,
      currentOffset,
      messageCount,
      messages
    };
  }
  while (pos < len) {
    const offset = r.readBigUInt64LE(pos);
    const state = mapMessageState(r.readUInt8(pos + 8));
    const timestamp = toDate(r.readBigUInt64LE(pos + 9));
    const id = deserializeUUID(r.subarray(pos + 17, pos + 17 + 16));
    const checksum = r.readUInt32LE(pos + 33);
    const headersLength = r.readUInt32LE(pos + 37);
    const headers = deserializeHeaders(r.subarray(pos + 41, pos + 41 + headersLength));
    pos += headersLength;
    const messageLength = r.readUInt32LE(pos + 41);
    const payload = r.subarray(pos + 45, pos + 45 + messageLength);
    pos += 45 + messageLength;
    messages.push({
      id,
      state,
      timestamp,
      offset,
      headers,
      payload,
      checksum
    });
  }
  return {
    partitionId,
    currentOffset,
    messageCount,
    messages
  };
};
var init_poll_utils = __esm(() => {
  init_offset_utils();
  init_header_utils();
  PollingStrategyKind = {
    Offset: 1,
    Timestamp: 2,
    First: 3,
    Last: 4,
    Next: 5
  };
  Next = {
    kind: PollingStrategyKind.Next,
    value: 0n
  };
  First = {
    kind: PollingStrategyKind.First,
    value: 0n
  };
  Last = {
    kind: PollingStrategyKind.Last,
    value: 0n
  };
  PollingStrategy = {
    Next,
    First,
    Last,
    Offset,
    Timestamp
  };
  MessageState = {
    Available: 1,
    Unavailable: 10,
    Poisoned: 20,
    MarkedForDeletion: 30
  };
  ReverseMessageState = reverseRecord(MessageState);
});

// node_modules/@iggy.rs/sdk/dist/wire/message/poll-messages.command.js
var POLL_MESSAGES, pollMessages;
var init_poll_messages_command = __esm(() => {
  init_poll_utils();
  POLL_MESSAGES = {
    code: 100,
    serialize: ({ streamId, topicId, consumer, partitionId, pollingStrategy, count, autocommit }) => {
      return serializePollMessages(streamId, topicId, consumer, partitionId, pollingStrategy, count, autocommit);
    },
    deserialize: (r) => {
      return deserializePollMessages(r.data);
    }
  };
  pollMessages = wrapCommand(POLL_MESSAGES);
});

// node_modules/@iggy.rs/sdk/dist/wire/message/partitioning.utils.js
var PartitionKind, Balanced, PartitionId = (id) => ({
  kind: PartitionKind.PartitionId,
  value: id
}), MessageKey = (key) => ({
  kind: PartitionKind.MessageKey,
  value: key
}), Partitioning, serializeMessageKey = (v) => {
  if (v instanceof Buffer)
    return v;
  if (typeof v === "string")
    return Buffer.from(v);
  if (typeof v === "number")
    return uint32ToBuf(v);
  if (typeof v === "bigint")
    return uint64ToBuf(v);
  throw new Error(`cannot serialize messageKey ${v}, ${typeof v}`);
}, serializePartitioningValue = (part) => {
  const { kind, value } = part;
  switch (kind) {
    case PartitionKind.Balanced:
      return Buffer.alloc(0);
    case PartitionKind.PartitionId:
      return uint32ToBuf(value);
    case PartitionKind.MessageKey:
      return serializeMessageKey(value);
  }
}, default_partionning, serializePartitioning = (p) => {
  const part = p || default_partionning;
  const b = Buffer.alloc(2);
  const bValue = serializePartitioningValue(part);
  b.writeUint8(part.kind);
  b.writeUint8(bValue.length, 1);
  return Buffer.concat([
    b,
    bValue
  ]);
};
var init_partitioning_utils = __esm(() => {
  PartitionKind = {
    Balanced: 1,
    PartitionId: 2,
    MessageKey: 3
  };
  Balanced = {
    kind: PartitionKind.Balanced,
    value: null
  };
  Partitioning = {
    Balanced,
    PartitionId,
    MessageKey
  };
  default_partionning = {
    kind: PartitionKind.Balanced,
    value: null
  };
});

// node_modules/uuidv7/dist/index.js
class UUID {
  constructor(bytes) {
    this.bytes = bytes;
  }
  static ofInner(bytes) {
    if (bytes.length !== 16) {
      throw new TypeError("not 128-bit length");
    } else {
      return new UUID(bytes);
    }
  }
  static fromFieldsV7(unixTsMs, randA, randBHi, randBLo) {
    if (!Number.isInteger(unixTsMs) || !Number.isInteger(randA) || !Number.isInteger(randBHi) || !Number.isInteger(randBLo) || unixTsMs < 0 || randA < 0 || randBHi < 0 || randBLo < 0 || unixTsMs > 281474976710655 || randA > 4095 || randBHi > 1073741823 || randBLo > 4294967295) {
      throw new RangeError("invalid field value");
    }
    const bytes = new Uint8Array(16);
    bytes[0] = unixTsMs / 2 ** 40;
    bytes[1] = unixTsMs / 2 ** 32;
    bytes[2] = unixTsMs / 2 ** 24;
    bytes[3] = unixTsMs / 2 ** 16;
    bytes[4] = unixTsMs / 2 ** 8;
    bytes[5] = unixTsMs;
    bytes[6] = 112 | randA >>> 8;
    bytes[7] = randA;
    bytes[8] = 128 | randBHi >>> 24;
    bytes[9] = randBHi >>> 16;
    bytes[10] = randBHi >>> 8;
    bytes[11] = randBHi;
    bytes[12] = randBLo >>> 24;
    bytes[13] = randBLo >>> 16;
    bytes[14] = randBLo >>> 8;
    bytes[15] = randBLo;
    return new UUID(bytes);
  }
  static parse(uuid) {
    var _a, _b, _c, _d;
    let hex = undefined;
    switch (uuid.length) {
      case 32:
        hex = (_a = /^[0-9a-f]{32}$/i.exec(uuid)) === null || _a === undefined ? undefined : _a[0];
        break;
      case 36:
        hex = (_b = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(uuid)) === null || _b === undefined ? undefined : _b.slice(1, 6).join("");
        break;
      case 38:
        hex = (_c = /^\{([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\}$/i.exec(uuid)) === null || _c === undefined ? undefined : _c.slice(1, 6).join("");
        break;
      case 45:
        hex = (_d = /^urn:uuid:([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(uuid)) === null || _d === undefined ? undefined : _d.slice(1, 6).join("");
        break;
      default:
        break;
    }
    if (hex) {
      const inner = new Uint8Array(16);
      for (let i = 0;i < 16; i += 4) {
        const n = parseInt(hex.substring(2 * i, 2 * i + 8), 16);
        inner[i + 0] = n >>> 24;
        inner[i + 1] = n >>> 16;
        inner[i + 2] = n >>> 8;
        inner[i + 3] = n;
      }
      return new UUID(inner);
    } else {
      throw new SyntaxError("could not parse UUID string");
    }
  }
  toString() {
    let text = "";
    for (let i = 0;i < this.bytes.length; i++) {
      text += DIGITS.charAt(this.bytes[i] >>> 4);
      text += DIGITS.charAt(this.bytes[i] & 15);
      if (i === 3 || i === 5 || i === 7 || i === 9) {
        text += "-";
      }
    }
    return text;
  }
  toHex() {
    let text = "";
    for (let i = 0;i < this.bytes.length; i++) {
      text += DIGITS.charAt(this.bytes[i] >>> 4);
      text += DIGITS.charAt(this.bytes[i] & 15);
    }
    return text;
  }
  toJSON() {
    return this.toString();
  }
  getVariant() {
    const n = this.bytes[8] >>> 4;
    if (n < 0) {
      throw new Error("unreachable");
    } else if (n <= 7) {
      return this.bytes.every((e) => e === 0) ? "NIL" : "VAR_0";
    } else if (n <= 11) {
      return "VAR_10";
    } else if (n <= 13) {
      return "VAR_110";
    } else if (n <= 15) {
      return this.bytes.every((e) => e === 255) ? "MAX" : "VAR_RESERVED";
    } else {
      throw new Error("unreachable");
    }
  }
  getVersion() {
    return this.getVariant() === "VAR_10" ? this.bytes[6] >>> 4 : undefined;
  }
  clone() {
    return new UUID(this.bytes.slice(0));
  }
  equals(other) {
    return this.compareTo(other) === 0;
  }
  compareTo(other) {
    for (let i = 0;i < 16; i++) {
      const diff = this.bytes[i] - other.bytes[i];
      if (diff !== 0) {
        return Math.sign(diff);
      }
    }
    return 0;
  }
}
var DIGITS = "0123456789abcdef";

// node_modules/@iggy.rs/sdk/dist/wire/uuid.utils.js
var parse = (uid) => UUID.parse(uid);
var init_uuid_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/message/message.utils.js
var import_debug2, debug2, isValidMessageId = (x) => x === undefined || x === 0 || x === 0n || typeof x === "string", serializeMessageId = (id) => {
  if (!isValidMessageId(id))
    throw new Error(`invalid message id: '${id}' (use uuid string or 0)`);
  if (id === undefined || id === 0 || id === 0n) {
    return Buffer.alloc(16, 0);
  }
  try {
    const uuid = parse(id);
    return Buffer.from(uuid.toHex(), "hex");
  } catch (err) {
    throw new Error(`invalid message id: '${id}' (use uuid string or 0)`, { cause: err });
  }
}, serializeMessage = (msg) => {
  const { id, headers, payload } = msg;
  const bId = serializeMessageId(id);
  const bHeaders = serializeHeaders(headers);
  const bHLen = uint32ToBuf(bHeaders.length);
  const bPayload = typeof payload === "string" ? Buffer.from(payload) : payload;
  const bPLen = uint32ToBuf(bPayload.length);
  const r = Buffer.concat([
    bId,
    bHLen,
    bHeaders,
    bPLen,
    bPayload
  ]);
  debug2("id", bId.length, bId.toString("hex"), "headers", bHeaders.length, bHeaders.toString("hex"), "binLength/PL", bPLen.length, bPLen.toString("hex"), "payload", bPayload.length, bPayload.toString("hex"), "full len", r.length);
  return r;
}, serializeMessages = (messages) => Buffer.concat(messages.map((c) => serializeMessage(c))), serializeSendMessages = (streamId, topicId, messages, partitioning) => {
  const streamIdentifier = serializeIdentifier(streamId);
  const topicIdentifier = serializeIdentifier(topicId);
  const bPartitioning = serializePartitioning(partitioning);
  const bMessages = serializeMessages(messages);
  return Buffer.concat([
    streamIdentifier,
    topicIdentifier,
    bPartitioning,
    bMessages
  ]);
};
var init_message_utils = __esm(() => {
  init_header_utils();
  init_partitioning_utils();
  init_uuid_utils();
  import_debug2 = __toESM(require_src(), 1);
  debug2 = import_debug2.default("iggy:client");
});

// node_modules/@iggy.rs/sdk/dist/wire/message/send-messages.command.js
var SEND_MESSAGES, sendMessages;
var init_send_messages_command = __esm(() => {
  init_message_utils();
  init_client_utils();
  SEND_MESSAGES = {
    code: 101,
    serialize: ({ streamId, topicId, messages, partition }) => {
      return serializeSendMessages(streamId, topicId, messages, partition);
    },
    deserialize: deserializeVoidResponse
  };
  sendMessages = wrapCommand(SEND_MESSAGES);
});

// node_modules/@iggy.rs/sdk/dist/wire/message/index.js
var init_message = __esm(() => {
  init_poll_utils();
  init_partitioning_utils();
  init_header_utils();
  init_poll_messages_command();
  init_send_messages_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/offset/get-offset.command.js
var GET_OFFSET, getOffset;
var init_get_offset_command = __esm(() => {
  init_offset_utils();
  GET_OFFSET = {
    code: 120,
    serialize: ({ streamId, topicId, consumer, partitionId = 1 }) => {
      return serializeGetOffset(streamId, topicId, consumer, partitionId);
    },
    deserialize: (r) => {
      const partitionId = r.data.readUInt32LE(0);
      const currentOffset = r.data.readBigUInt64LE(4);
      const storedOffset = r.data.readBigUInt64LE(12);
      return {
        partitionId,
        currentOffset,
        storedOffset
      };
    }
  };
  getOffset = wrapCommand(GET_OFFSET);
});

// node_modules/@iggy.rs/sdk/dist/wire/offset/store-offset.command.js
var STORE_OFFSET, storeOffset;
var init_store_offset_command = __esm(() => {
  init_client_utils();
  init_offset_utils();
  STORE_OFFSET = {
    code: 121,
    serialize: ({ streamId, topicId, consumer, partitionId, offset }) => serializeStoreOffset(streamId, topicId, consumer, partitionId, offset),
    deserialize: deserializeVoidResponse
  };
  storeOffset = wrapCommand(STORE_OFFSET);
});

// node_modules/@iggy.rs/sdk/dist/wire/offset/index.js
var init_offset = __esm(() => {
  init_offset_utils();
  init_get_offset_command();
  init_store_offset_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/partition/partition.utils.js
var serializePartitionParams = (streamId, topicId, partitionCount = 1) => {
  if (partitionCount < 1 || partitionCount > 1000)
    throw new Error("Topic partition_count must be between 1 and 1000");
  const streamIdentifier = serializeIdentifier(streamId);
  const topicIdentifier = serializeIdentifier(topicId);
  const b = Buffer.alloc(4);
  b.writeUInt32LE(partitionCount, 0);
  return Buffer.concat([
    streamIdentifier,
    topicIdentifier,
    b
  ]);
};
var init_partition_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/partition/create-partition.command.js
var CREATE_PARTITION, createPartition;
var init_create_partition_command = __esm(() => {
  init_client_utils();
  init_partition_utils();
  CREATE_PARTITION = {
    code: 402,
    serialize: ({ streamId, topicId, partitionCount = 1 }) => {
      return serializePartitionParams(streamId, topicId, partitionCount);
    },
    deserialize: deserializeVoidResponse
  };
  createPartition = wrapCommand(CREATE_PARTITION);
});

// node_modules/@iggy.rs/sdk/dist/wire/partition/delete-partition.command.js
var DELETE_PARTITION, deletePartition;
var init_delete_partition_command = __esm(() => {
  init_client_utils();
  init_partition_utils();
  DELETE_PARTITION = {
    code: 403,
    serialize: ({ streamId, topicId, partitionCount }) => {
      return serializePartitionParams(streamId, topicId, partitionCount);
    },
    deserialize: deserializeVoidResponse
  };
  deletePartition = wrapCommand(DELETE_PARTITION);
});

// node_modules/@iggy.rs/sdk/dist/wire/partition/index.js
var init_partition = __esm(() => {
  init_create_partition_command();
  init_delete_partition_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/session/login.command.js
var LOGIN, login;
var init_login_command = __esm(() => {
  LOGIN = {
    code: 38,
    serialize: ({ username, password, version, context }) => {
      const bUsername = Buffer.from(username);
      const bPassword = Buffer.from(password);
      if (bUsername.length < 1 || bUsername.length > 255)
        throw new Error("Username should be between 1 and 255 bytes");
      if (bPassword.length < 1 || bPassword.length > 255)
        throw new Error("Password should be between 1 and 255 bytes");
      const l1 = Buffer.allocUnsafe(1);
      const l2 = Buffer.allocUnsafe(1);
      l1.writeUInt8(bUsername.length);
      l2.writeUInt8(bPassword.length);
      const binVersion = [];
      const l3 = Buffer.allocUnsafe(4);
      if (version && version.length > 0) {
        const bVersion = Buffer.from(version);
        l3.writeUInt32LE(bVersion.length);
        binVersion.push(l3, bVersion);
      } else {
        l3.writeUInt32LE(0);
        binVersion.push(l3);
      }
      const binContext = [];
      const l4 = Buffer.allocUnsafe(4);
      if (context && context.length > 0) {
        const bContext = Buffer.from(context);
        l4.writeUInt32LE(bContext.length);
        binContext.push(l4, bContext);
      } else {
        l4.writeUInt32LE(0);
        binContext.push(l4);
      }
      return Buffer.concat([
        l1,
        bUsername,
        l2,
        bPassword,
        ...binVersion,
        ...binContext
      ]);
    },
    deserialize: (r) => ({
      userId: r.data.readUInt32LE(0)
    })
  };
  login = wrapCommand(LOGIN);
});

// node_modules/@iggy.rs/sdk/dist/wire/session/login-with-token.command.js
var LOGIN_WITH_TOKEN, loginWithToken;
var init_login_with_token_command = __esm(() => {
  LOGIN_WITH_TOKEN = {
    code: 44,
    serialize: ({ token }) => {
      const bToken = Buffer.from(token);
      if (bToken.length < 1 || bToken.length > 255)
        throw new Error("Token length should be between 1 and 255 bytes");
      const b = Buffer.alloc(1);
      b.writeUInt8(bToken.length);
      return Buffer.concat([
        b,
        bToken
      ]);
    },
    deserialize: (r) => ({
      userId: r.data.readUInt32LE(0)
    })
  };
  loginWithToken = wrapCommand(LOGIN_WITH_TOKEN);
});

// node_modules/@iggy.rs/sdk/dist/wire/session/logout.command.js
var LOGOUT, logout;
var init_logout_command = __esm(() => {
  init_client_utils();
  LOGOUT = {
    code: 39,
    serialize: () => {
      return Buffer.alloc(0);
    },
    deserialize: deserializeVoidResponse
  };
  logout = wrapCommand(LOGOUT);
});

// node_modules/@iggy.rs/sdk/dist/wire/session/index.js
var init_session = __esm(() => {
  init_login_command();
  init_login_with_token_command();
  init_logout_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/stream.utils.js
var deserializeToStream = (r, pos = 0) => {
  const id = r.readUInt32LE(pos);
  const createdAt = toDate(r.readBigUint64LE(pos + 4));
  const topicsCount = r.readUInt32LE(pos + 12);
  const sizeBytes = r.readBigUint64LE(pos + 16);
  const messagesCount = r.readBigUint64LE(pos + 24);
  const nameLength = r.readUInt8(pos + 32);
  const name = r.subarray(pos + 33, pos + 33 + nameLength).toString();
  return {
    bytesRead: 33 + nameLength,
    data: {
      id,
      name,
      topicsCount,
      messagesCount,
      sizeBytes,
      createdAt
    }
  };
};
var init_stream_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/stream/create-stream.command.js
var CREATE_STREAM, createStream;
var init_create_stream_command = __esm(() => {
  init_stream_utils();
  CREATE_STREAM = {
    code: 202,
    serialize: ({ streamId, name }) => {
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Stream name should be between 1 and 255 bytes");
      const b = Buffer.allocUnsafe(4 + 1);
      b.writeUInt32LE(streamId, 0);
      b.writeUInt8(bName.length, 4);
      return Buffer.concat([
        b,
        bName
      ]);
    },
    deserialize: (r) => {
      return deserializeToStream(r.data, 0).data;
    }
  };
  createStream = wrapCommand(CREATE_STREAM);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/delete-stream.command.js
var DELETE_STREAM, deleteStream;
var init_delete_stream_command = __esm(() => {
  init_client_utils();
  DELETE_STREAM = {
    code: 203,
    serialize: ({ streamId }) => {
      return serializeIdentifier(streamId);
    },
    deserialize: deserializeVoidResponse
  };
  deleteStream = wrapCommand(DELETE_STREAM);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/get-stream.command.js
var GET_STREAM, getStream;
var init_get_stream_command = __esm(() => {
  init_stream_utils();
  GET_STREAM = {
    code: 200,
    serialize: ({ streamId }) => {
      return serializeIdentifier(streamId);
    },
    deserialize: (r) => {
      return deserializeToStream(r.data, 0).data;
    }
  };
  getStream = wrapCommand(GET_STREAM);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/get-streams.command.js
var GET_STREAMS, getStreams;
var init_get_streams_command = __esm(() => {
  init_stream_utils();
  GET_STREAMS = {
    code: 201,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => {
      const payloadSize = r.data.length;
      const streams = [];
      let pos = 0;
      while (pos < payloadSize) {
        const { bytesRead, data } = deserializeToStream(r.data, pos);
        streams.push(data);
        pos += bytesRead;
      }
      return streams;
    }
  };
  getStreams = wrapCommand(GET_STREAMS);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/purge-stream.command.js
var PURGE_STREAM, purgeStream;
var init_purge_stream_command = __esm(() => {
  init_client_utils();
  PURGE_STREAM = {
    code: 205,
    serialize: ({ streamId }) => {
      return serializeIdentifier(streamId);
    },
    deserialize: deserializeVoidResponse
  };
  purgeStream = wrapCommand(PURGE_STREAM);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/update-stream.command.js
var UPDATE_STREAM, updateStream;
var init_update_stream_command = __esm(() => {
  init_client_utils();
  UPDATE_STREAM = {
    code: 204,
    serialize: ({ streamId, name }) => {
      const bId = serializeIdentifier(streamId);
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Stream name should be between 1 and 255 bytes");
      return Buffer.concat([
        bId,
        uint8ToBuf(bName.length),
        bName
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  updateStream = wrapCommand(UPDATE_STREAM);
});

// node_modules/@iggy.rs/sdk/dist/wire/stream/index.js
var init_stream = __esm(() => {
  init_create_stream_command();
  init_delete_stream_command();
  init_get_stream_command();
  init_get_streams_command();
  init_purge_stream_command();
  init_update_stream_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/system/get-stats.command.js
var GET_STATS, getStats;
var init_get_stats_command = __esm(() => {
  GET_STATS = {
    code: 10,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => {
      const processId = r.data.readUInt32LE(0);
      const cpuUsage = r.data.readFloatLE(4);
      const totalCpuUsage = r.data.readFloatLE(8);
      const memoryUsage = r.data.readBigUInt64LE(12);
      const totalMemory = r.data.readBigUInt64LE(20);
      const availableMemory = r.data.readBigUInt64LE(28);
      const runTime = r.data.readBigUInt64LE(36);
      const startTime = r.data.readBigUInt64LE(44);
      const readBytes = r.data.readBigUInt64LE(52);
      const writtenBytes = r.data.readBigUInt64LE(60);
      const messagesSizeBytes = r.data.readBigUInt64LE(68);
      const streamsCount = r.data.readUInt32LE(76);
      const topicsCount = r.data.readUInt32LE(80);
      const partitionsCount = r.data.readUInt32LE(84);
      const segmentsCount = r.data.readUInt32LE(88);
      const messagesCount = r.data.readBigUInt64LE(92);
      const clientsCount = r.data.readUInt32LE(100);
      const consumersGroupsCount = r.data.readUInt32LE(104);
      let position = 104 + 4;
      const hostnameLength = r.data.readUInt32LE(position);
      const hostname = r.data.subarray(position + 4, position + 4 + hostnameLength).toString();
      position += 4 + hostnameLength;
      const osNameLength = r.data.readUInt32LE(position);
      const osName = r.data.subarray(position + 4, position + 4 + osNameLength).toString();
      position += 4 + osNameLength;
      const osVersionLength = r.data.readUInt32LE(position);
      const osVersion = r.data.subarray(position + 4, position + 4 + osVersionLength).toString();
      position += 4 + osVersionLength;
      const kernelVersionLength = r.data.readUInt32LE(position);
      const kernelVersion = r.data.subarray(position + 4, position + 4 + kernelVersionLength).toString();
      return {
        processId,
        cpuUsage,
        totalCpuUsage,
        memoryUsage,
        totalMemory,
        availableMemory,
        runTime,
        startTime,
        readBytes,
        writtenBytes,
        messagesSizeBytes,
        streamsCount,
        topicsCount,
        partitionsCount,
        segmentsCount,
        messagesCount,
        clientsCount,
        consumersGroupsCount,
        hostname,
        osName,
        osVersion,
        kernelVersion
      };
    }
  };
  getStats = wrapCommand(GET_STATS);
});

// node_modules/@iggy.rs/sdk/dist/wire/system/ping.command.js
var PING, ping;
var init_ping_command = __esm(() => {
  init_client_utils();
  PING = {
    code: 1,
    serialize: () => {
      return Buffer.alloc(0);
    },
    deserialize: deserializeVoidResponse
  };
  ping = wrapCommand(PING);
});

// node_modules/@iggy.rs/sdk/dist/wire/system/index.js
var init_system = __esm(() => {
  init_get_stats_command();
  init_ping_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/token/token.utils.js
var deserializeCreateToken = (p, pos = 0) => {
  const len = p.readUInt8(pos);
  const token = p.subarray(pos + 1, pos + 1 + len).toString();
  return { bytesRead: 1 + len, data: { token } };
}, deserializeToken = (p, pos = 0) => {
  const nameLength = p.readUInt8(pos);
  const name = p.subarray(pos + 1, pos + 1 + nameLength).toString();
  const rest = p.subarray(pos + 1 + nameLength);
  let expiry = null;
  let bytesRead = pos + 1 + nameLength;
  if (rest.length >= 8) {
    expiry = toDate(rest.readBigUInt64LE(0));
    bytesRead += 8;
  }
  return {
    bytesRead,
    data: {
      name,
      expiry
    }
  };
}, deserializeTokens = (p, pos = 0) => {
  const tokens = [];
  const len = p.length;
  while (pos < len) {
    const { bytesRead, data } = deserializeToken(p, pos);
    tokens.push(data);
    pos += bytesRead;
  }
  return tokens;
};
var init_token_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/token/create-token.command.js
var CREATE_TOKEN, createToken;
var init_create_token_command = __esm(() => {
  init_token_utils();
  CREATE_TOKEN = {
    code: 42,
    serialize: ({ name, expiry = 600n }) => {
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Token name should be between 1 and 255 bytes");
      const b1 = Buffer.alloc(1);
      b1.writeUInt8(bName.length);
      const b2 = Buffer.alloc(8);
      b2.writeBigUInt64LE(expiry);
      return Buffer.concat([
        b1,
        bName,
        b2
      ]);
    },
    deserialize: (r) => deserializeCreateToken(r.data).data
  };
  createToken = wrapCommand(CREATE_TOKEN);
});

// node_modules/@iggy.rs/sdk/dist/wire/token/delete-token.command.js
var DELETE_TOKEN, deleteToken;
var init_delete_token_command = __esm(() => {
  init_client_utils();
  DELETE_TOKEN = {
    code: 43,
    serialize: ({ name }) => {
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Token name should be between 1 and 255 bytes");
      const b = Buffer.alloc(1);
      b.writeUInt8(bName.length);
      return Buffer.concat([
        b,
        bName
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  deleteToken = wrapCommand(DELETE_TOKEN);
});

// node_modules/@iggy.rs/sdk/dist/wire/token/get-tokens.command.js
var GET_TOKENS, getTokens;
var init_get_tokens_command = __esm(() => {
  init_token_utils();
  GET_TOKENS = {
    code: 41,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => deserializeTokens(r.data)
  };
  getTokens = wrapCommand(GET_TOKENS);
});

// node_modules/@iggy.rs/sdk/dist/wire/token/index.js
var init_token = __esm(() => {
  init_create_token_command();
  init_delete_token_command();
  init_get_tokens_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/topic.utils.js
var exports_topic_utils = {};
__export(exports_topic_utils, {
  isValidCompressionAlgorithm: () => isValidCompressionAlgorithm,
  deserializeTopics: () => deserializeTopics,
  deserializeTopic: () => deserializeTopic,
  deserializePartition: () => deserializePartition,
  deserializeBaseTopic: () => deserializeBaseTopic,
  CompressionAlgorithmKind: () => CompressionAlgorithmKind
});
var CompressionAlgorithmKind, isValidCompressionAlgorithm = (ca) => Object.values(CompressionAlgorithmKind).includes(ca), deserializeBaseTopic = (p, pos = 0) => {
  const id = p.readUInt32LE(pos);
  const createdAt = toDate(p.readBigUint64LE(pos + 4));
  const partitionsCount = p.readUInt32LE(pos + 12);
  const compressionAlgorithm = p.readUInt8(pos + 16);
  const messageExpiry = p.readBigUInt64LE(pos + 17);
  const maxTopicSize = p.readBigUInt64LE(pos + 25);
  const replicationFactor = p.readUInt8(pos + 33);
  const sizeBytes = p.readBigUInt64LE(pos + 34);
  const messagesCount = p.readBigUInt64LE(pos + 42);
  const nameLength = p.readUInt8(pos + 50);
  const name = p.subarray(pos + 51, pos + 51 + nameLength).toString();
  return {
    bytesRead: 4 + 8 + 4 + 1 + 8 + 8 + 1 + 8 + 8 + 1 + nameLength,
    data: {
      id,
      name,
      createdAt,
      partitionsCount,
      compressionAlgorithm,
      maxTopicSize,
      replicationFactor,
      messageExpiry,
      messagesCount,
      sizeBytes
    }
  };
}, deserializePartition = (p, pos = 0) => {
  return {
    bytesRead: 4 + 8 + 4 + 8 + 8 + 8,
    data: {
      id: p.readUInt32LE(pos),
      createdAt: toDate(p.readBigUint64LE(pos + 4)),
      segmentsCount: p.readUInt32LE(pos + 12),
      currentOffset: p.readBigUint64LE(pos + 16),
      sizeBytes: p.readBigUint64LE(pos + 24),
      messagesCount: p.readBigUint64LE(pos + 24)
    }
  };
}, deserializeTopic = (p, pos = 0) => {
  const start = pos;
  const { bytesRead, data } = deserializeBaseTopic(p, pos);
  pos += bytesRead;
  const partitions = [];
  const end = p.length;
  while (pos < end) {
    const { bytesRead: bytesRead2, data: data2 } = deserializePartition(p, pos);
    partitions.push(data2);
    pos += bytesRead2;
  }
  return { bytesRead: pos - start, data: { ...data, partitions } };
}, deserializeTopics = (p, pos = 0) => {
  const topics = [];
  const len = p.length;
  while (pos < len) {
    const { bytesRead, data } = deserializeTopic(p, pos);
    topics.push(data);
    pos += bytesRead;
  }
  return topics;
};
var init_topic_utils = __esm(() => {
  CompressionAlgorithmKind = {
    None: 1,
    Gzip: 2
  };
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/create-topic.command.js
var CREATE_TOPIC, createTopic;
var init_create_topic_command = __esm(() => {
  init_topic_utils();
  CREATE_TOPIC = {
    code: 302,
    serialize: ({ streamId, topicId, name, partitionCount, compressionAlgorithm = CompressionAlgorithmKind.None, messageExpiry = 0n, maxTopicSize = 0n, replicationFactor = 1 }) => {
      const streamIdentifier = serializeIdentifier(streamId);
      const bName = Buffer.from(name);
      if (replicationFactor < 1 || replicationFactor > 255)
        throw new Error("Topic replication factor should be between 1 and 255");
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Topic name should be between 1 and 255 bytes");
      if (!isValidCompressionAlgorithm(compressionAlgorithm))
        throw new Error(`createTopic: invalid compressionAlgorithm (${compressionAlgorithm})`);
      const b = Buffer.allocUnsafe(4 + 4 + 1 + 8 + 8 + 1 + 1);
      b.writeUInt32LE(topicId, 0);
      b.writeUInt32LE(partitionCount, 4);
      b.writeUInt8(compressionAlgorithm, 8);
      b.writeBigUInt64LE(messageExpiry, 9);
      b.writeBigUInt64LE(maxTopicSize, 17);
      b.writeUInt8(replicationFactor, 25);
      b.writeUInt8(bName.length, 26);
      return Buffer.concat([
        streamIdentifier,
        b,
        bName
      ]);
    },
    deserialize: (r) => {
      return deserializeTopic(r.data).data;
    }
  };
  createTopic = wrapCommand(CREATE_TOPIC);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/delete-topic.command.js
var DELETE_TOPIC, deleteTopic;
var init_delete_topic_command = __esm(() => {
  init_client_utils();
  DELETE_TOPIC = {
    code: 303,
    serialize: ({ streamId, topicId, partitionsCount }) => {
      return Buffer.concat([
        serializeIdentifier(streamId),
        serializeIdentifier(topicId),
        uint32ToBuf(partitionsCount)
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  deleteTopic = wrapCommand(DELETE_TOPIC);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/get-topic.command.js
var GET_TOPIC, getTopic;
var init_get_topic_command = __esm(() => {
  init_topic_utils();
  GET_TOPIC = {
    code: 300,
    serialize: ({ streamId, topicId }) => {
      return Buffer.concat([
        serializeIdentifier(streamId),
        serializeIdentifier(topicId)
      ]);
    },
    deserialize: (r) => {
      return deserializeTopic(r.data).data;
    }
  };
  getTopic = wrapCommand(GET_TOPIC);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/get-topics.command.js
var GET_TOPICS, getTopics;
var init_get_topics_command = __esm(() => {
  init_topic_utils();
  GET_TOPICS = {
    code: 301,
    serialize: ({ streamId }) => {
      return serializeIdentifier(streamId);
    },
    deserialize: (r) => {
      return deserializeTopics(r.data);
    }
  };
  getTopics = wrapCommand(GET_TOPICS);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/purge-topic.command.js
var PURGE_TOPIC, purgeTopic;
var init_purge_topic_command = __esm(() => {
  init_client_utils();
  PURGE_TOPIC = {
    code: 305,
    serialize: ({ streamId, topicId }) => {
      return Buffer.concat([
        serializeIdentifier(streamId),
        serializeIdentifier(topicId)
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  purgeTopic = wrapCommand(PURGE_TOPIC);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/update-topic.command.js
var UPDATE_TOPIC, updateTopic;
var init_update_topic_command = __esm(() => {
  init_client_utils();
  init_topic_utils();
  UPDATE_TOPIC = {
    code: 304,
    serialize: ({ streamId, topicId, name, compressionAlgorithm = CompressionAlgorithmKind.None, messageExpiry = 0n, maxTopicSize = 0n, replicationFactor = 1 }) => {
      const streamIdentifier = serializeIdentifier(streamId);
      const topicIdentifier = serializeIdentifier(topicId);
      const bName = Buffer.from(name);
      if (bName.length < 1 || bName.length > 255)
        throw new Error("Topic name should be between 1 and 255 bytes");
      if (!isValidCompressionAlgorithm(compressionAlgorithm))
        throw new Error(`createTopic: invalid compressionAlgorithm (${compressionAlgorithm})`);
      const b = Buffer.allocUnsafe(8 + 8 + 1 + 1 + 1);
      b.writeUInt8(compressionAlgorithm, 0);
      b.writeBigUInt64LE(messageExpiry, 1);
      b.writeBigUInt64LE(maxTopicSize, 9);
      b.writeUInt8(replicationFactor, 17);
      b.writeUInt8(bName.length, 18);
      return Buffer.concat([
        streamIdentifier,
        topicIdentifier,
        b,
        bName
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  updateTopic = wrapCommand(UPDATE_TOPIC);
});

// node_modules/@iggy.rs/sdk/dist/wire/topic/index.js
var init_topic = __esm(() => {
  init_create_topic_command();
  init_delete_topic_command();
  init_get_topic_command();
  init_get_topics_command();
  init_purge_topic_command();
  init_update_topic_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/user/change-password.command.js
var CHANGE_PASSWORD, changePassword;
var init_change_password_command = __esm(() => {
  init_client_utils();
  CHANGE_PASSWORD = {
    code: 37,
    serialize: ({ userId, currentPassword, newPassword }) => {
      const bId = serializeIdentifier(userId);
      const bCur = Buffer.from(currentPassword);
      const bNew = Buffer.from(newPassword);
      if (bCur.length < 1 || bCur.length > 255)
        throw new Error("User password should be between 1 and 255 bytes (current)");
      if (bNew.length < 1 || bNew.length > 255)
        throw new Error("User password should be between 1 and 255 bytes (new)");
      return Buffer.concat([
        bId,
        uint8ToBuf(bCur.length),
        bCur,
        uint8ToBuf(bNew.length),
        bNew
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  changePassword = wrapCommand(CHANGE_PASSWORD);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/permissions.utils.js
var toBool = (u) => u === 1, boolToByte = (b) => b ? 1 : 0, deserializeGlobalPermissions = (p, pos = 0) => {
  return {
    bytesRead: 10,
    data: {
      ManageServers: toBool(p.readUInt8(pos)),
      ReadServers: toBool(p.readUInt8(pos + 1)),
      ManageUsers: toBool(p.readUInt8(pos + 2)),
      ReadUsers: toBool(p.readUInt8(pos + 3)),
      ManageStreams: toBool(p.readUInt8(pos + 4)),
      ReadStreams: toBool(p.readUInt8(pos + 5)),
      ManageTopics: toBool(p.readUInt8(pos + 6)),
      ReadTopics: toBool(p.readUInt8(pos + 7)),
      PollMessages: toBool(p.readUInt8(pos + 8)),
      SendMessages: toBool(p.readUInt8(pos + 9))
    }
  };
}, serializeGlobalPermission = (p) => {
  return Buffer.concat([
    uint8ToBuf(boolToByte(p.ManageServers)),
    uint8ToBuf(boolToByte(p.ReadServers)),
    uint8ToBuf(boolToByte(p.ManageUsers)),
    uint8ToBuf(boolToByte(p.ReadUsers)),
    uint8ToBuf(boolToByte(p.ManageStreams)),
    uint8ToBuf(boolToByte(p.ReadStreams)),
    uint8ToBuf(boolToByte(p.ManageTopics)),
    uint8ToBuf(boolToByte(p.ReadTopics)),
    uint8ToBuf(boolToByte(p.PollMessages)),
    uint8ToBuf(boolToByte(p.SendMessages))
  ]);
}, deserializeTopicPermissions = (p, pos = 0) => {
  const topicId = p.readUInt32LE(pos);
  const permissions = {
    manage: toBool(p.readUInt8(pos + 4)),
    read: toBool(p.readUInt8(pos + 5)),
    pollMessages: toBool(p.readUInt8(pos + 6)),
    sendMessages: toBool(p.readUInt8(pos + 7))
  };
  return {
    bytesRead: 8,
    topicId,
    permissions
  };
}, serializeTopicPermissions = (p) => {
  return Buffer.concat([
    uint32ToBuf(p.topicId),
    uint8ToBuf(boolToByte(p.permissions.manage)),
    uint8ToBuf(boolToByte(p.permissions.read)),
    uint8ToBuf(boolToByte(p.permissions.pollMessages)),
    uint8ToBuf(boolToByte(p.permissions.sendMessages))
  ]);
}, deserializeStreamPermissions = (p, pos = 0) => {
  const start = pos;
  const streamId = p.readUInt32LE(pos);
  const permissions = {
    manageStream: toBool(p.readUInt8(pos + 4)),
    readStream: toBool(p.readUInt8(pos + 5)),
    manageTopics: toBool(p.readUInt8(pos + 6)),
    readTopics: toBool(p.readUInt8(pos + 7)),
    pollMessages: toBool(p.readUInt8(pos + 8)),
    sendMessages: toBool(p.readUInt8(pos + 9))
  };
  pos += 10;
  const topics = [];
  const hasTopics = toBool(p.readUInt8(pos));
  if (hasTopics) {
    let read = true;
    pos += 1;
    while (read) {
      const { bytesRead, topicId, permissions: permissions2 } = deserializeTopicPermissions(p, pos);
      pos += bytesRead;
      topics.push({ topicId, permissions: permissions2 });
      if (p.readUInt8(pos) === 0)
        read = false;
    }
  }
  return {
    bytesRead: pos - start,
    streamId,
    permissions,
    topics
  };
}, serializeStreamPermissions = (p) => {
  const bStream = Buffer.concat([
    uint32ToBuf(p.streamId),
    uint8ToBuf(boolToByte(p.permissions.manageStream)),
    uint8ToBuf(boolToByte(p.permissions.readStream)),
    uint8ToBuf(boolToByte(p.permissions.manageTopics)),
    uint8ToBuf(boolToByte(p.permissions.readTopics)),
    uint8ToBuf(boolToByte(p.permissions.pollMessages)),
    uint8ToBuf(boolToByte(p.permissions.sendMessages))
  ]);
  const hasTopic = p.topics.length > 0;
  const bHasTopic = uint8ToBuf(boolToByte(hasTopic));
  const bHead = Buffer.concat([bStream, bHasTopic]);
  if (!hasTopic)
    return bHead;
  return p.topics.reduce((ac, c) => Buffer.concat([
    ac,
    serializeTopicPermissions(c)
  ]), bHead);
}, deserializePermissions = (p, pos = 0) => {
  const { bytesRead, data } = deserializeGlobalPermissions(p, pos);
  pos += bytesRead;
  const streams = [];
  const hasStream = toBool(p.readUInt8(pos));
  if (hasStream) {
    let readStream = true;
    pos += 1;
    while (readStream) {
      const { bytesRead: bytesRead2, streamId, permissions, topics } = deserializeStreamPermissions(p, pos);
      streams.push({ streamId, permissions, topics });
      pos += bytesRead2;
      if (p.readUInt8(pos) === 0)
        readStream = false;
    }
  }
  return {
    global: data,
    streams
  };
}, serializePermissions = (p) => {
  if (!p)
    return uint8ToBuf(0);
  const bGlobal = serializeGlobalPermission(p.global);
  const hasStream = p.streams.length > 0;
  const bHasStream = uint8ToBuf(boolToByte(hasStream));
  const bHead = Buffer.concat([bGlobal, bHasStream]);
  if (!hasStream)
    return bHead;
  return p.streams.reduce((ac, c) => Buffer.concat([
    ac,
    serializeStreamPermissions(c)
  ]), bHead);
};
var init_permissions_utils = () => {};

// node_modules/@iggy.rs/sdk/dist/wire/user/user.utils.js
var UserStatus, statusString = (t) => {
  switch (t.toString()) {
    case "1":
      return "Active";
    case "2":
      return "Inactive";
    default:
      return `unknown_status_${t}`;
  }
}, deserializeBaseUser = (p, pos = 0) => {
  const id = p.readUInt32LE(pos);
  const createdAt = toDate(p.readBigUInt64LE(pos + 4));
  const status = statusString(p.readUInt8(pos + 12));
  const userNameLength = p.readUInt8(pos + 13);
  const userName = p.subarray(pos + 14, pos + 14 + userNameLength).toString();
  return {
    bytesRead: 14 + userNameLength,
    data: {
      id,
      createdAt,
      status,
      userName
    }
  };
}, deserializeUser = (p, pos = 0) => {
  const { bytesRead, data } = deserializeBaseUser(p, pos);
  pos += bytesRead;
  const hasPerm = p.readUInt8(pos) === 1;
  let permissions = null;
  if (hasPerm) {
    pos += 1;
    const permLength = p.readUInt32LE(pos);
    const permBuffer = p.subarray(pos + 4, pos + 4 + permLength);
    permissions = deserializePermissions(permBuffer, 0);
  }
  return { ...data, permissions };
}, deserializeUsers = (p, pos = 0) => {
  const users = [];
  const end = p.length;
  while (pos < end) {
    const { bytesRead, data } = deserializeBaseUser(p, pos);
    users.push(data);
    pos += bytesRead;
  }
  return users;
};
var init_user_utils = __esm(() => {
  init_permissions_utils();
  (function(UserStatus2) {
    UserStatus2[UserStatus2["Active"] = 1] = "Active";
    UserStatus2[UserStatus2["Inactive"] = 2] = "Inactive";
  })(UserStatus || (UserStatus = {}));
});

// node_modules/@iggy.rs/sdk/dist/wire/user/create-user.command.js
var CREATE_USER, createUser;
var init_create_user_command = __esm(() => {
  init_user_utils();
  init_permissions_utils();
  CREATE_USER = {
    code: 33,
    serialize: ({ username, password, status, permissions }) => {
      const bUsername = Buffer.from(username);
      const bPassword = Buffer.from(password);
      if (bUsername.length < 1 || bUsername.length > 255)
        throw new Error("User username should be between 1 and 255 bytes");
      if (bPassword.length < 1 || bPassword.length > 255)
        throw new Error("User password should be between 1 and 255 bytes");
      const bPermissions = serializePermissions(permissions);
      return Buffer.concat([
        uint8ToBuf(bUsername.length),
        bUsername,
        uint8ToBuf(bPassword.length),
        bPassword,
        uint8ToBuf(status),
        boolToBuf(!!permissions),
        uint32ToBuf(bPermissions.length),
        bPermissions
      ]);
    },
    deserialize: (r) => deserializeUser(r.data)
  };
  createUser = wrapCommand(CREATE_USER);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/delete-user.command.js
var DELETE_USER, deleteUser;
var init_delete_user_command = __esm(() => {
  init_client_utils();
  DELETE_USER = {
    code: 34,
    serialize: ({ userId }) => {
      return serializeIdentifier(userId);
    },
    deserialize: deserializeVoidResponse
  };
  deleteUser = wrapCommand(DELETE_USER);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/get-user.command.js
var GET_USER, getUser;
var init_get_user_command = __esm(() => {
  init_user_utils();
  GET_USER = {
    code: 31,
    serialize: ({ userId }) => {
      return serializeIdentifier(userId);
    },
    deserialize: (r) => deserializeUser(r.data)
  };
  getUser = wrapCommand(GET_USER);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/get-users.command.js
var GET_USERS, getUsers;
var init_get_users_command = __esm(() => {
  init_user_utils();
  GET_USERS = {
    code: 32,
    serialize: () => Buffer.alloc(0),
    deserialize: (r) => deserializeUsers(r.data)
  };
  getUsers = wrapCommand(GET_USERS);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/update-permissions.command.js
var UPDATE_PERMISSIONS, updatePermissions;
var init_update_permissions_command = __esm(() => {
  init_client_utils();
  init_permissions_utils();
  UPDATE_PERMISSIONS = {
    code: 36,
    serialize: ({ userId, permissions }) => {
      const bPermissions = serializePermissions(permissions);
      return Buffer.concat([
        serializeIdentifier(userId),
        boolToBuf(!!permissions),
        uint32ToBuf(bPermissions.length),
        bPermissions
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  updatePermissions = wrapCommand(UPDATE_PERMISSIONS);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/update-user.command.js
var UPDATE_USER, updateUser;
var init_update_user_command = __esm(() => {
  init_client_utils();
  UPDATE_USER = {
    code: 35,
    serialize: ({ userId, username, status }) => {
      const bId = serializeIdentifier(userId);
      let bUsername, bStatus;
      if (username) {
        const bn = Buffer.from(username);
        if (bn.length < 1 || bn.length > 255)
          throw new Error("User username should be between 1 and 255 bytes");
        bUsername = Buffer.concat([
          uint8ToBuf(1),
          uint8ToBuf(bn.length),
          bn
        ]);
      } else
        bUsername = uint8ToBuf(0);
      if (status)
        bStatus = Buffer.concat([uint8ToBuf(1), uint8ToBuf(status)]);
      else
        bStatus = uint8ToBuf(0);
      return Buffer.concat([
        bId,
        bUsername,
        bStatus
      ]);
    },
    deserialize: deserializeVoidResponse
  };
  updateUser = wrapCommand(UPDATE_USER);
});

// node_modules/@iggy.rs/sdk/dist/wire/user/index.js
var init_user = __esm(() => {
  init_change_password_command();
  init_create_user_command();
  init_delete_user_command();
  init_get_user_command();
  init_get_users_command();
  init_update_permissions_command();
  init_update_user_command();
});

// node_modules/@iggy.rs/sdk/dist/wire/command-set.js
class AbstractAPI {
  clientProvider;
  constructor(getClient2) {
    this.clientProvider = getClient2;
  }
}
var userAPI = (c) => ({
  get: getUser(c),
  list: getUsers(c),
  create: createUser(c),
  update: updateUser(c),
  updatePermissions: updatePermissions(c),
  changePassword: changePassword(c),
  delete: deleteUser(c)
}), sessionAPI = (c) => ({
  login: login(c),
  loginWithToken: loginWithToken(c),
  logout: logout(c)
}), clientAPI = (c) => ({
  get: getClient(c),
  getMe: getMe(c),
  list: getClients(c)
}), tokenAPI = (c) => ({
  list: getTokens(c),
  create: createToken(c),
  delete: deleteToken(c)
}), streamAPI = (c) => ({
  get: getStream(c),
  list: getStreams(c),
  create: createStream(c),
  update: updateStream(c),
  delete: deleteStream(c),
  purge: purgeStream(c)
}), topicAPI = (c) => ({
  get: getTopic(c),
  list: getTopics(c),
  create: createTopic(c),
  update: updateTopic(c),
  delete: deleteTopic(c),
  purge: purgeTopic(c)
}), partitionAPI = (c) => ({
  create: createPartition(c),
  delete: deletePartition(c)
}), groupAPI = (c) => ({
  get: getGroup(c),
  list: getGroups(c),
  create: createGroup(c),
  join: joinGroup(c),
  leave: leaveGroup(c),
  delete: deleteGroup(c)
}), offsetAPI = (c) => ({
  get: getOffset(c),
  store: storeOffset(c)
}), messageAPI = (c) => ({
  poll: pollMessages(c),
  send: sendMessages(c)
}), systemAPI = (c) => ({
  ping: ping(c),
  getStats: getStats(c)
}), CommandAPI;
var init_command_set = __esm(() => {
  init_login_command();
  init_logout_command();
  init_login_with_token_command();
  init_get_me_command();
  init_get_clients_command();
  init_get_client_command();
  init_create_group_command();
  init_join_group_command();
  init_get_group_command();
  init_get_groups_command();
  init_leave_group_command();
  init_delete_group_command();
  init_purge_topic_command();
  init_create_topic_command();
  init_update_topic_command();
  init_get_topic_command();
  init_get_topics_command();
  init_delete_topic_command();
  init_get_offset_command();
  init_store_offset_command();
  init_send_messages_command();
  init_poll_messages_command();
  init_create_stream_command();
  init_update_stream_command();
  init_get_stream_command();
  init_get_streams_command();
  init_delete_stream_command();
  init_purge_stream_command();
  init_create_partition_command();
  init_delete_partition_command();
  init_get_stats_command();
  init_ping_command();
  init_get_tokens_command();
  init_create_token_command();
  init_delete_token_command();
  init_get_user_command();
  init_create_user_command();
  init_change_password_command();
  init_update_user_command();
  init_update_permissions_command();
  init_delete_user_command();
  init_get_users_command();
  CommandAPI = class CommandAPI extends AbstractAPI {
    user = userAPI(this.clientProvider);
    session = sessionAPI(this.clientProvider);
    client = clientAPI(this.clientProvider);
    token = tokenAPI(this.clientProvider);
    stream = streamAPI(this.clientProvider);
    topic = topicAPI(this.clientProvider);
    partition = partitionAPI(this.clientProvider);
    group = groupAPI(this.clientProvider);
    offset = offsetAPI(this.clientProvider);
    message = messageAPI(this.clientProvider);
    system = systemAPI(this.clientProvider);
    constructor(c) {
      super(c);
    }
  };
});

// node_modules/@iggy.rs/sdk/dist/wire/index.js
var init_wire = __esm(() => {
  init_client();
  init_consumer_group();
  init_message();
  init_offset();
  init_partition();
  init_session();
  init_stream();
  init_system();
  init_token();
  init_topic();
  init_user();
  init_command_set();
});

// node_modules/generic-pool/lib/factoryValidator.js
var require_factoryValidator = __commonJS((exports, module) => {
  module.exports = function(factory) {
    if (typeof factory.create !== "function") {
      throw new TypeError("factory.create must be a function");
    }
    if (typeof factory.destroy !== "function") {
      throw new TypeError("factory.destroy must be a function");
    }
    if (typeof factory.validate !== "undefined" && typeof factory.validate !== "function") {
      throw new TypeError("factory.validate must be a function");
    }
  };
});

// node_modules/generic-pool/lib/PoolDefaults.js
var require_PoolDefaults = __commonJS((exports, module) => {
  class PoolDefaults {
    constructor() {
      this.fifo = true;
      this.priorityRange = 1;
      this.testOnBorrow = false;
      this.testOnReturn = false;
      this.autostart = true;
      this.evictionRunIntervalMillis = 0;
      this.numTestsPerEvictionRun = 3;
      this.softIdleTimeoutMillis = -1;
      this.idleTimeoutMillis = 30000;
      this.acquireTimeoutMillis = null;
      this.destroyTimeoutMillis = null;
      this.maxWaitingClients = null;
      this.min = null;
      this.max = null;
      this.Promise = Promise;
    }
  }
  module.exports = PoolDefaults;
});

// node_modules/generic-pool/lib/PoolOptions.js
var require_PoolOptions = __commonJS((exports, module) => {
  var PoolDefaults = require_PoolDefaults();

  class PoolOptions {
    constructor(opts) {
      const poolDefaults = new PoolDefaults;
      opts = opts || {};
      this.fifo = typeof opts.fifo === "boolean" ? opts.fifo : poolDefaults.fifo;
      this.priorityRange = opts.priorityRange || poolDefaults.priorityRange;
      this.testOnBorrow = typeof opts.testOnBorrow === "boolean" ? opts.testOnBorrow : poolDefaults.testOnBorrow;
      this.testOnReturn = typeof opts.testOnReturn === "boolean" ? opts.testOnReturn : poolDefaults.testOnReturn;
      this.autostart = typeof opts.autostart === "boolean" ? opts.autostart : poolDefaults.autostart;
      if (opts.acquireTimeoutMillis) {
        this.acquireTimeoutMillis = parseInt(opts.acquireTimeoutMillis, 10);
      }
      if (opts.destroyTimeoutMillis) {
        this.destroyTimeoutMillis = parseInt(opts.destroyTimeoutMillis, 10);
      }
      if (opts.maxWaitingClients !== undefined) {
        this.maxWaitingClients = parseInt(opts.maxWaitingClients, 10);
      }
      this.max = parseInt(opts.max, 10);
      this.min = parseInt(opts.min, 10);
      this.max = Math.max(isNaN(this.max) ? 1 : this.max, 1);
      this.min = Math.min(isNaN(this.min) ? 0 : this.min, this.max);
      this.evictionRunIntervalMillis = opts.evictionRunIntervalMillis || poolDefaults.evictionRunIntervalMillis;
      this.numTestsPerEvictionRun = opts.numTestsPerEvictionRun || poolDefaults.numTestsPerEvictionRun;
      this.softIdleTimeoutMillis = opts.softIdleTimeoutMillis || poolDefaults.softIdleTimeoutMillis;
      this.idleTimeoutMillis = opts.idleTimeoutMillis || poolDefaults.idleTimeoutMillis;
      this.Promise = opts.Promise != null ? opts.Promise : poolDefaults.Promise;
    }
  }
  module.exports = PoolOptions;
});

// node_modules/generic-pool/lib/Deferred.js
var require_Deferred = __commonJS((exports, module) => {
  class Deferred {
    constructor(Promise2) {
      this._state = Deferred.PENDING;
      this._resolve = undefined;
      this._reject = undefined;
      this._promise = new Promise2((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      });
    }
    get state() {
      return this._state;
    }
    get promise() {
      return this._promise;
    }
    reject(reason) {
      if (this._state !== Deferred.PENDING) {
        return;
      }
      this._state = Deferred.REJECTED;
      this._reject(reason);
    }
    resolve(value) {
      if (this._state !== Deferred.PENDING) {
        return;
      }
      this._state = Deferred.FULFILLED;
      this._resolve(value);
    }
  }
  Deferred.PENDING = "PENDING";
  Deferred.FULFILLED = "FULFILLED";
  Deferred.REJECTED = "REJECTED";
  module.exports = Deferred;
});

// node_modules/generic-pool/lib/errors.js
var require_errors2 = __commonJS((exports, module) => {
  class ExtendableError extends Error {
    constructor(message2) {
      super(message2);
      this.name = this.constructor.name;
      this.message = message2;
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error(message2).stack;
      }
    }
  }

  class TimeoutError extends ExtendableError {
    constructor(m) {
      super(m);
    }
  }
  module.exports = {
    TimeoutError
  };
});

// node_modules/generic-pool/lib/ResourceRequest.js
var require_ResourceRequest = __commonJS((exports, module) => {
  var Deferred = require_Deferred();
  var errors = require_errors2();
  function fbind(fn, ctx) {
    return function bound() {
      return fn.apply(ctx, arguments);
    };
  }

  class ResourceRequest extends Deferred {
    constructor(ttl, Promise2) {
      super(Promise2);
      this._creationTimestamp = Date.now();
      this._timeout = null;
      if (ttl !== undefined) {
        this.setTimeout(ttl);
      }
    }
    setTimeout(delay) {
      if (this._state !== ResourceRequest.PENDING) {
        return;
      }
      const ttl = parseInt(delay, 10);
      if (isNaN(ttl) || ttl <= 0) {
        throw new Error("delay must be a positive int");
      }
      const age = Date.now() - this._creationTimestamp;
      if (this._timeout) {
        this.removeTimeout();
      }
      this._timeout = setTimeout(fbind(this._fireTimeout, this), Math.max(ttl - age, 0));
    }
    removeTimeout() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._timeout = null;
    }
    _fireTimeout() {
      this.reject(new errors.TimeoutError("ResourceRequest timed out"));
    }
    reject(reason) {
      this.removeTimeout();
      super.reject(reason);
    }
    resolve(value) {
      this.removeTimeout();
      super.resolve(value);
    }
  }
  module.exports = ResourceRequest;
});

// node_modules/generic-pool/lib/ResourceLoan.js
var require_ResourceLoan = __commonJS((exports, module) => {
  var Deferred = require_Deferred();

  class ResourceLoan extends Deferred {
    constructor(pooledResource, Promise2) {
      super(Promise2);
      this._creationTimestamp = Date.now();
      this.pooledResource = pooledResource;
    }
    reject() {}
  }
  module.exports = ResourceLoan;
});

// node_modules/generic-pool/lib/PooledResourceStateEnum.js
var require_PooledResourceStateEnum = __commonJS((exports, module) => {
  var PooledResourceStateEnum = {
    ALLOCATED: "ALLOCATED",
    IDLE: "IDLE",
    INVALID: "INVALID",
    RETURNING: "RETURNING",
    VALIDATION: "VALIDATION"
  };
  module.exports = PooledResourceStateEnum;
});

// node_modules/generic-pool/lib/PooledResource.js
var require_PooledResource = __commonJS((exports, module) => {
  var PooledResourceStateEnum = require_PooledResourceStateEnum();

  class PooledResource {
    constructor(resource) {
      this.creationTime = Date.now();
      this.lastReturnTime = null;
      this.lastBorrowTime = null;
      this.lastIdleTime = null;
      this.obj = resource;
      this.state = PooledResourceStateEnum.IDLE;
    }
    allocate() {
      this.lastBorrowTime = Date.now();
      this.state = PooledResourceStateEnum.ALLOCATED;
    }
    deallocate() {
      this.lastReturnTime = Date.now();
      this.state = PooledResourceStateEnum.IDLE;
    }
    invalidate() {
      this.state = PooledResourceStateEnum.INVALID;
    }
    test() {
      this.state = PooledResourceStateEnum.VALIDATION;
    }
    idle() {
      this.lastIdleTime = Date.now();
      this.state = PooledResourceStateEnum.IDLE;
    }
    returning() {
      this.state = PooledResourceStateEnum.RETURNING;
    }
  }
  module.exports = PooledResource;
});

// node_modules/generic-pool/lib/DefaultEvictor.js
var require_DefaultEvictor = __commonJS((exports, module) => {
  class DefaultEvictor {
    evict(config, pooledResource, availableObjectsCount) {
      const idleTime = Date.now() - pooledResource.lastIdleTime;
      if (config.softIdleTimeoutMillis > 0 && config.softIdleTimeoutMillis < idleTime && config.min < availableObjectsCount) {
        return true;
      }
      if (config.idleTimeoutMillis < idleTime) {
        return true;
      }
      return false;
    }
  }
  module.exports = DefaultEvictor;
});

// node_modules/generic-pool/lib/DoublyLinkedList.js
var require_DoublyLinkedList = __commonJS((exports, module) => {
  class DoublyLinkedList {
    constructor() {
      this.head = null;
      this.tail = null;
      this.length = 0;
    }
    insertBeginning(node) {
      if (this.head === null) {
        this.head = node;
        this.tail = node;
        node.prev = null;
        node.next = null;
        this.length++;
      } else {
        this.insertBefore(this.head, node);
      }
    }
    insertEnd(node) {
      if (this.tail === null) {
        this.insertBeginning(node);
      } else {
        this.insertAfter(this.tail, node);
      }
    }
    insertAfter(node, newNode) {
      newNode.prev = node;
      newNode.next = node.next;
      if (node.next === null) {
        this.tail = newNode;
      } else {
        node.next.prev = newNode;
      }
      node.next = newNode;
      this.length++;
    }
    insertBefore(node, newNode) {
      newNode.prev = node.prev;
      newNode.next = node;
      if (node.prev === null) {
        this.head = newNode;
      } else {
        node.prev.next = newNode;
      }
      node.prev = newNode;
      this.length++;
    }
    remove(node) {
      if (node.prev === null) {
        this.head = node.next;
      } else {
        node.prev.next = node.next;
      }
      if (node.next === null) {
        this.tail = node.prev;
      } else {
        node.next.prev = node.prev;
      }
      node.prev = null;
      node.next = null;
      this.length--;
    }
    static createNode(data) {
      return {
        prev: null,
        next: null,
        data
      };
    }
  }
  module.exports = DoublyLinkedList;
});

// node_modules/generic-pool/lib/DoublyLinkedListIterator.js
var require_DoublyLinkedListIterator = __commonJS((exports, module) => {
  class DoublyLinkedListIterator {
    constructor(doublyLinkedList, reverse) {
      this._list = doublyLinkedList;
      this._direction = reverse === true ? "prev" : "next";
      this._startPosition = reverse === true ? "tail" : "head";
      this._started = false;
      this._cursor = null;
      this._done = false;
    }
    _start() {
      this._cursor = this._list[this._startPosition];
      this._started = true;
    }
    _advanceCursor() {
      if (this._started === false) {
        this._started = true;
        this._cursor = this._list[this._startPosition];
        return;
      }
      this._cursor = this._cursor[this._direction];
    }
    reset() {
      this._done = false;
      this._started = false;
      this._cursor = null;
    }
    remove() {
      if (this._started === false || this._done === true || this._isCursorDetached()) {
        return false;
      }
      this._list.remove(this._cursor);
    }
    next() {
      if (this._done === true) {
        return { done: true };
      }
      this._advanceCursor();
      if (this._cursor === null || this._isCursorDetached()) {
        this._done = true;
        return { done: true };
      }
      return {
        value: this._cursor,
        done: false
      };
    }
    _isCursorDetached() {
      return this._cursor.prev === null && this._cursor.next === null && this._list.tail !== this._cursor && this._list.head !== this._cursor;
    }
  }
  module.exports = DoublyLinkedListIterator;
});

// node_modules/generic-pool/lib/DequeIterator.js
var require_DequeIterator = __commonJS((exports, module) => {
  var DoublyLinkedListIterator = require_DoublyLinkedListIterator();

  class DequeIterator extends DoublyLinkedListIterator {
    next() {
      const result = super.next();
      if (result.value) {
        result.value = result.value.data;
      }
      return result;
    }
  }
  module.exports = DequeIterator;
});

// node_modules/generic-pool/lib/Deque.js
var require_Deque = __commonJS((exports, module) => {
  var DoublyLinkedList = require_DoublyLinkedList();
  var DequeIterator = require_DequeIterator();

  class Deque {
    constructor() {
      this._list = new DoublyLinkedList;
    }
    shift() {
      if (this.length === 0) {
        return;
      }
      const node = this._list.head;
      this._list.remove(node);
      return node.data;
    }
    unshift(element) {
      const node = DoublyLinkedList.createNode(element);
      this._list.insertBeginning(node);
    }
    push(element) {
      const node = DoublyLinkedList.createNode(element);
      this._list.insertEnd(node);
    }
    pop() {
      if (this.length === 0) {
        return;
      }
      const node = this._list.tail;
      this._list.remove(node);
      return node.data;
    }
    [Symbol.iterator]() {
      return new DequeIterator(this._list);
    }
    iterator() {
      return new DequeIterator(this._list);
    }
    reverseIterator() {
      return new DequeIterator(this._list, true);
    }
    get head() {
      if (this.length === 0) {
        return;
      }
      const node = this._list.head;
      return node.data;
    }
    get tail() {
      if (this.length === 0) {
        return;
      }
      const node = this._list.tail;
      return node.data;
    }
    get length() {
      return this._list.length;
    }
  }
  module.exports = Deque;
});

// node_modules/generic-pool/lib/Queue.js
var require_Queue = __commonJS((exports, module) => {
  var DoublyLinkedList = require_DoublyLinkedList();
  var Deque = require_Deque();

  class Queue extends Deque {
    push(resourceRequest) {
      const node = DoublyLinkedList.createNode(resourceRequest);
      resourceRequest.promise.catch(this._createTimeoutRejectionHandler(node));
      this._list.insertEnd(node);
    }
    _createTimeoutRejectionHandler(node) {
      return (reason) => {
        if (reason.name === "TimeoutError") {
          this._list.remove(node);
        }
      };
    }
  }
  module.exports = Queue;
});

// node_modules/generic-pool/lib/PriorityQueue.js
var require_PriorityQueue = __commonJS((exports, module) => {
  var Queue = require_Queue();

  class PriorityQueue {
    constructor(size) {
      this._size = Math.max(+size | 0, 1);
      this._slots = [];
      for (let i = 0;i < this._size; i++) {
        this._slots.push(new Queue);
      }
    }
    get length() {
      let _length = 0;
      for (let i = 0, slots = this._slots.length;i < slots; i++) {
        _length += this._slots[i].length;
      }
      return _length;
    }
    enqueue(obj, priority) {
      priority = priority && +priority | 0 || 0;
      if (priority) {
        if (priority < 0 || priority >= this._size) {
          priority = this._size - 1;
        }
      }
      this._slots[priority].push(obj);
    }
    dequeue() {
      for (let i = 0, sl = this._slots.length;i < sl; i += 1) {
        if (this._slots[i].length) {
          return this._slots[i].shift();
        }
      }
      return;
    }
    get head() {
      for (let i = 0, sl = this._slots.length;i < sl; i += 1) {
        if (this._slots[i].length > 0) {
          return this._slots[i].head;
        }
      }
      return;
    }
    get tail() {
      for (let i = this._slots.length - 1;i >= 0; i--) {
        if (this._slots[i].length > 0) {
          return this._slots[i].tail;
        }
      }
      return;
    }
  }
  module.exports = PriorityQueue;
});

// node_modules/generic-pool/lib/utils.js
var require_utils2 = __commonJS((exports) => {
  function noop() {}
  exports.reflector = function(promise) {
    return promise.then(noop, noop);
  };
});

// node_modules/generic-pool/lib/Pool.js
var require_Pool = __commonJS((exports, module) => {
  var EventEmitter = __require("events").EventEmitter;
  var factoryValidator = require_factoryValidator();
  var PoolOptions = require_PoolOptions();
  var ResourceRequest = require_ResourceRequest();
  var ResourceLoan = require_ResourceLoan();
  var PooledResource = require_PooledResource();
  var DefaultEvictor = require_DefaultEvictor();
  var Deque = require_Deque();
  var Deferred = require_Deferred();
  var PriorityQueue = require_PriorityQueue();
  var DequeIterator = require_DequeIterator();
  var reflector = require_utils2().reflector;
  var FACTORY_CREATE_ERROR = "factoryCreateError";
  var FACTORY_DESTROY_ERROR = "factoryDestroyError";

  class Pool extends EventEmitter {
    constructor(Evictor, Deque2, PriorityQueue2, factory, options) {
      super();
      factoryValidator(factory);
      this._config = new PoolOptions(options);
      this._Promise = this._config.Promise;
      this._factory = factory;
      this._draining = false;
      this._started = false;
      this._waitingClientsQueue = new PriorityQueue2(this._config.priorityRange);
      this._factoryCreateOperations = new Set;
      this._factoryDestroyOperations = new Set;
      this._availableObjects = new Deque2;
      this._testOnBorrowResources = new Set;
      this._testOnReturnResources = new Set;
      this._validationOperations = new Set;
      this._allObjects = new Set;
      this._resourceLoans = new Map;
      this._evictionIterator = this._availableObjects.iterator();
      this._evictor = new Evictor;
      this._scheduledEviction = null;
      if (this._config.autostart === true) {
        this.start();
      }
    }
    _destroy(pooledResource) {
      pooledResource.invalidate();
      this._allObjects.delete(pooledResource);
      const destroyPromise = this._factory.destroy(pooledResource.obj);
      const wrappedDestroyPromise = this._config.destroyTimeoutMillis ? this._Promise.resolve(this._applyDestroyTimeout(destroyPromise)) : this._Promise.resolve(destroyPromise);
      this._trackOperation(wrappedDestroyPromise, this._factoryDestroyOperations).catch((reason) => {
        this.emit(FACTORY_DESTROY_ERROR, reason);
      });
      this._ensureMinimum();
    }
    _applyDestroyTimeout(promise) {
      const timeoutPromise = new this._Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("destroy timed out"));
        }, this._config.destroyTimeoutMillis).unref();
      });
      return this._Promise.race([timeoutPromise, promise]);
    }
    _testOnBorrow() {
      if (this._availableObjects.length < 1) {
        return false;
      }
      const pooledResource = this._availableObjects.shift();
      pooledResource.test();
      this._testOnBorrowResources.add(pooledResource);
      const validationPromise = this._factory.validate(pooledResource.obj);
      const wrappedValidationPromise = this._Promise.resolve(validationPromise);
      this._trackOperation(wrappedValidationPromise, this._validationOperations).then((isValid) => {
        this._testOnBorrowResources.delete(pooledResource);
        if (isValid === false) {
          pooledResource.invalidate();
          this._destroy(pooledResource);
          this._dispense();
          return;
        }
        this._dispatchPooledResourceToNextWaitingClient(pooledResource);
      });
      return true;
    }
    _dispatchResource() {
      if (this._availableObjects.length < 1) {
        return false;
      }
      const pooledResource = this._availableObjects.shift();
      this._dispatchPooledResourceToNextWaitingClient(pooledResource);
      return false;
    }
    _dispense() {
      const numWaitingClients = this._waitingClientsQueue.length;
      if (numWaitingClients < 1) {
        return;
      }
      const resourceShortfall = numWaitingClients - this._potentiallyAllocableResourceCount;
      const actualNumberOfResourcesToCreate = Math.min(this.spareResourceCapacity, resourceShortfall);
      for (let i = 0;actualNumberOfResourcesToCreate > i; i++) {
        this._createResource();
      }
      if (this._config.testOnBorrow === true) {
        const desiredNumberOfResourcesToMoveIntoTest = numWaitingClients - this._testOnBorrowResources.size;
        const actualNumberOfResourcesToMoveIntoTest = Math.min(this._availableObjects.length, desiredNumberOfResourcesToMoveIntoTest);
        for (let i = 0;actualNumberOfResourcesToMoveIntoTest > i; i++) {
          this._testOnBorrow();
        }
      }
      if (this._config.testOnBorrow === false) {
        const actualNumberOfResourcesToDispatch = Math.min(this._availableObjects.length, numWaitingClients);
        for (let i = 0;actualNumberOfResourcesToDispatch > i; i++) {
          this._dispatchResource();
        }
      }
    }
    _dispatchPooledResourceToNextWaitingClient(pooledResource) {
      const clientResourceRequest = this._waitingClientsQueue.dequeue();
      if (clientResourceRequest === undefined || clientResourceRequest.state !== Deferred.PENDING) {
        this._addPooledResourceToAvailableObjects(pooledResource);
        return false;
      }
      const loan = new ResourceLoan(pooledResource, this._Promise);
      this._resourceLoans.set(pooledResource.obj, loan);
      pooledResource.allocate();
      clientResourceRequest.resolve(pooledResource.obj);
      return true;
    }
    _trackOperation(operation, set) {
      set.add(operation);
      return operation.then((v) => {
        set.delete(operation);
        return this._Promise.resolve(v);
      }, (e) => {
        set.delete(operation);
        return this._Promise.reject(e);
      });
    }
    _createResource() {
      const factoryPromise = this._factory.create();
      const wrappedFactoryPromise = this._Promise.resolve(factoryPromise).then((resource) => {
        const pooledResource = new PooledResource(resource);
        this._allObjects.add(pooledResource);
        this._addPooledResourceToAvailableObjects(pooledResource);
      });
      this._trackOperation(wrappedFactoryPromise, this._factoryCreateOperations).then(() => {
        this._dispense();
        return null;
      }).catch((reason) => {
        this.emit(FACTORY_CREATE_ERROR, reason);
        this._dispense();
      });
    }
    _ensureMinimum() {
      if (this._draining === true) {
        return;
      }
      const minShortfall = this._config.min - this._count;
      for (let i = 0;i < minShortfall; i++) {
        this._createResource();
      }
    }
    _evict() {
      const testsToRun = Math.min(this._config.numTestsPerEvictionRun, this._availableObjects.length);
      const evictionConfig = {
        softIdleTimeoutMillis: this._config.softIdleTimeoutMillis,
        idleTimeoutMillis: this._config.idleTimeoutMillis,
        min: this._config.min
      };
      for (let testsHaveRun = 0;testsHaveRun < testsToRun; ) {
        const iterationResult = this._evictionIterator.next();
        if (iterationResult.done === true && this._availableObjects.length < 1) {
          this._evictionIterator.reset();
          return;
        }
        if (iterationResult.done === true && this._availableObjects.length > 0) {
          this._evictionIterator.reset();
          continue;
        }
        const resource = iterationResult.value;
        const shouldEvict = this._evictor.evict(evictionConfig, resource, this._availableObjects.length);
        testsHaveRun++;
        if (shouldEvict === true) {
          this._evictionIterator.remove();
          this._destroy(resource);
        }
      }
    }
    _scheduleEvictorRun() {
      if (this._config.evictionRunIntervalMillis > 0) {
        this._scheduledEviction = setTimeout(() => {
          this._evict();
          this._scheduleEvictorRun();
        }, this._config.evictionRunIntervalMillis).unref();
      }
    }
    _descheduleEvictorRun() {
      if (this._scheduledEviction) {
        clearTimeout(this._scheduledEviction);
      }
      this._scheduledEviction = null;
    }
    start() {
      if (this._draining === true) {
        return;
      }
      if (this._started === true) {
        return;
      }
      this._started = true;
      this._scheduleEvictorRun();
      this._ensureMinimum();
    }
    acquire(priority) {
      if (this._started === false && this._config.autostart === false) {
        this.start();
      }
      if (this._draining) {
        return this._Promise.reject(new Error("pool is draining and cannot accept work"));
      }
      if (this.spareResourceCapacity < 1 && this._availableObjects.length < 1 && this._config.maxWaitingClients !== undefined && this._waitingClientsQueue.length >= this._config.maxWaitingClients) {
        return this._Promise.reject(new Error("max waitingClients count exceeded"));
      }
      const resourceRequest = new ResourceRequest(this._config.acquireTimeoutMillis, this._Promise);
      this._waitingClientsQueue.enqueue(resourceRequest, priority);
      this._dispense();
      return resourceRequest.promise;
    }
    use(fn, priority) {
      return this.acquire(priority).then((resource) => {
        return fn(resource).then((result) => {
          this.release(resource);
          return result;
        }, (err) => {
          this.destroy(resource);
          throw err;
        });
      });
    }
    isBorrowedResource(resource) {
      return this._resourceLoans.has(resource);
    }
    release(resource) {
      const loan = this._resourceLoans.get(resource);
      if (loan === undefined) {
        return this._Promise.reject(new Error("Resource not currently part of this pool"));
      }
      this._resourceLoans.delete(resource);
      loan.resolve();
      const pooledResource = loan.pooledResource;
      pooledResource.deallocate();
      this._addPooledResourceToAvailableObjects(pooledResource);
      this._dispense();
      return this._Promise.resolve();
    }
    destroy(resource) {
      const loan = this._resourceLoans.get(resource);
      if (loan === undefined) {
        return this._Promise.reject(new Error("Resource not currently part of this pool"));
      }
      this._resourceLoans.delete(resource);
      loan.resolve();
      const pooledResource = loan.pooledResource;
      pooledResource.deallocate();
      this._destroy(pooledResource);
      this._dispense();
      return this._Promise.resolve();
    }
    _addPooledResourceToAvailableObjects(pooledResource) {
      pooledResource.idle();
      if (this._config.fifo === true) {
        this._availableObjects.push(pooledResource);
      } else {
        this._availableObjects.unshift(pooledResource);
      }
    }
    drain() {
      this._draining = true;
      return this.__allResourceRequestsSettled().then(() => {
        return this.__allResourcesReturned();
      }).then(() => {
        this._descheduleEvictorRun();
      });
    }
    __allResourceRequestsSettled() {
      if (this._waitingClientsQueue.length > 0) {
        return reflector(this._waitingClientsQueue.tail.promise);
      }
      return this._Promise.resolve();
    }
    __allResourcesReturned() {
      const ps = Array.from(this._resourceLoans.values()).map((loan) => loan.promise).map(reflector);
      return this._Promise.all(ps);
    }
    clear() {
      const reflectedCreatePromises = Array.from(this._factoryCreateOperations).map(reflector);
      return this._Promise.all(reflectedCreatePromises).then(() => {
        for (const resource of this._availableObjects) {
          this._destroy(resource);
        }
        const reflectedDestroyPromises = Array.from(this._factoryDestroyOperations).map(reflector);
        return reflector(this._Promise.all(reflectedDestroyPromises));
      });
    }
    ready() {
      return new this._Promise((resolve) => {
        const isReady = () => {
          if (this.available >= this.min) {
            resolve();
          } else {
            setTimeout(isReady, 100);
          }
        };
        isReady();
      });
    }
    get _potentiallyAllocableResourceCount() {
      return this._availableObjects.length + this._testOnBorrowResources.size + this._testOnReturnResources.size + this._factoryCreateOperations.size;
    }
    get _count() {
      return this._allObjects.size + this._factoryCreateOperations.size;
    }
    get spareResourceCapacity() {
      return this._config.max - (this._allObjects.size + this._factoryCreateOperations.size);
    }
    get size() {
      return this._count;
    }
    get available() {
      return this._availableObjects.length;
    }
    get borrowed() {
      return this._resourceLoans.size;
    }
    get pending() {
      return this._waitingClientsQueue.length;
    }
    get max() {
      return this._config.max;
    }
    get min() {
      return this._config.min;
    }
  }
  module.exports = Pool;
});

// node_modules/generic-pool/index.js
var require_generic_pool = __commonJS((exports, module) => {
  var Pool = require_Pool();
  var Deque = require_Deque();
  var PriorityQueue = require_PriorityQueue();
  var DefaultEvictor = require_DefaultEvictor();
  module.exports = {
    Pool,
    Deque,
    PriorityQueue,
    DefaultEvictor,
    createPool: function(factory, config) {
      return new Pool(DefaultEvictor, Deque, PriorityQueue, factory, config);
    }
  };
});

// node_modules/@iggy.rs/sdk/dist/wire/error.code.js
var translateErrorCode = (code) => {
  switch (code.toString()) {
    case "1":
      return "error";
    case "2":
      return "invalid_configuration";
    case "3":
      return "invalid_command";
    case "4":
      return "invalid_format";
    case "5":
      return "feature_unavailable";
    case "10":
      return "cannot_create_base_directory";
    case "20":
      return "resource_not_found";
    case "21":
      return "cannot_load_resource";
    case "22":
      return "cannot_save_resource";
    case "23":
      return "cannot_delete_resource";
    case "24":
      return "cannot_serialize_resource";
    case "25":
      return "cannot_deserialize_resource";
    case "40":
      return "unauthenticated";
    case "41":
      return "unauthorized";
    case "42":
      return "invalid_credentials";
    case "43":
      return "invalid_username";
    case "44":
      return "invalid_password";
    case "51":
      return "not_connected";
    case "52":
      return "request_error";
    case "60":
      return "invalid_encryption_key";
    case "61":
      return "cannot_encrypt_data";
    case "62":
      return "cannot_decrypt_data";
    case "100":
      return "client_not_found";
    case "101":
      return "invalid_client_id";
    case "200":
      return "io_error";
    case "201":
      return "write_error";
    case "202":
      return "cannot_parse_utf8";
    case "203":
      return "cannot_parse_int";
    case "204":
      return "cannot_parse_slice";
    case "300":
      return "http_response_error";
    case "301":
      return "request_middleware_error";
    case "302":
      return "cannot_create_endpoint";
    case "303":
      return "cannot_parse_url";
    case "304":
      return "invalid_response";
    case "305":
      return "empty_response";
    case "306":
      return "cannot_parse_address";
    case "307":
      return "read_error";
    case "308":
      return "connection_error";
    case "309":
      return "read_to_end_error";
    case "1000":
      return "cannot_create_streams_directory";
    case "1001":
      return "cannot_create_stream_directory";
    case "1002":
      return "cannot_create_stream_info";
    case "1003":
      return "cannot_update_stream_info";
    case "1004":
      return "cannot_open_stream_info";
    case "1005":
      return "cannot_read_stream_info";
    case "1006":
      return "cannot_create_stream";
    case "1007":
      return "cannot_delete_stream";
    case "1008":
      return "cannot_delete_stream_directory";
    case "1009":
      return "stream_id_not_found";
    case "1010":
      return "stream_name_not_found";
    case "1011":
      return "stream_id_already_exists";
    case "1012":
      return "stream_name_already_exists";
    case "1013":
      return "invalid_stream_name";
    case "1014":
      return "invalid_stream_id";
    case "1015":
      return "cannot_read_streams";
    case "2000":
      return "cannot_create_topics_directory";
    case "2001":
      return "cannot_create_topic_directory";
    case "2002":
      return "cannot_create_topic_info";
    case "2003":
      return "cannot_update_topic_info";
    case "2004":
      return "cannot_open_topic_info";
    case "2005":
      return "cannot_read_topic_info";
    case "2006":
      return "cannot_create_topic";
    case "2007":
      return "cannot_delete_topic";
    case "2008":
      return "cannot_delete_topic_directory";
    case "2009":
      return "cannot_poll_topic";
    case "2010":
      return "topic_id_not_found";
    case "2011":
      return "topic_name_not_found";
    case "2012":
      return "topic_id_already_exists";
    case "2013":
      return "topic_name_already_exists";
    case "2014":
      return "invalid_topic_name";
    case "2015":
      return "too_many_partitions";
    case "2016":
      return "invalid_topic_id";
    case "2017":
      return "cannot_read_topics";
    case "3000":
      return "cannot_create_partition";
    case "3001":
      return "cannot_create_partitions_directory";
    case "3002":
      return "cannot_create_partition_directory";
    case "3003":
      return "cannot_open_partition_log_file";
    case "3004":
      return "cannot_read_partitions";
    case "3005":
      return "cannot_delete_partition";
    case "3006":
      return "cannot_delete_partition_directory";
    case "3007":
      return "partition_not_found";
    case "3008":
      return "no_partitions";
    case "4000":
      return "segment_not_found";
    case "4001":
      return "segment_closed";
    case "4002":
      return "invalid_segment_size";
    case "4003":
      return "cannot_create_segment_log_file";
    case "4004":
      return "cannot_create_segment_index_file";
    case "4005":
      return "cannot_create_segment_time_index_file";
    case "4006":
      return "cannot_save_messages_to_segment";
    case "4007":
      return "cannot_save_index_to_segment";
    case "4008":
      return "cannot_save_time_index_to_segment";
    case "4009":
      return "invalid_messages_count";
    case "4010":
      return "cannot_append_message";
    case "4011":
      return "cannot_read_message";
    case "4012":
      return "cannot_read_message_id";
    case "4013":
      return "cannot_read_message_state";
    case "4014":
      return "cannot_read_message_timestamp";
    case "4015":
      return "cannot_read_headers_length";
    case "4016":
      return "cannot_read_headers_payload";
    case "4017":
      return "too_big_headers_payload";
    case "4018":
      return "invalid_header_key";
    case "4019":
      return "invalid_header_value";
    case "4020":
      return "cannot_read_message_length";
    case "4021":
      return "cannot_read_message_payload";
    case "4022":
      return "too_big_message_payload";
    case "4023":
      return "too_many_messages";
    case "4024":
      return "empty_message_payload";
    case "4025":
      return "invalid_message_payload_length";
    case "4026":
      return "cannot_read_message_checksum";
    case "4027":
      return "invalid_message_checksum";
    case "4028":
      return "invalid_key_value_length";
    case "4100":
      return "invalid_offset";
    case "4101":
      return "cannot_read_consumer_offsets";
    case "5000":
      return "consumer_group_not_found";
    case "5001":
      return "consumer_group_already_exists";
    case "5002":
      return "consumer_group_member_not_found";
    case "5003":
      return "invalid_consumer_group_id";
    case "5004":
      return "cannot_create_consumer_groups_directory";
    case "5005":
      return "cannot_read_consumer_groups";
    case "5006":
      return "cannot_create_consumer_group_info";
    case "5007":
      return "cannot_delete_consumer_group_info";
    default:
      return "error";
  }
};

// node_modules/@iggy.rs/sdk/dist/wire/error.utils.js
var responseError = (cmdCode, errCode) => new Error(`command: { code: ${cmdCode}, name: ${translateCommandCode(cmdCode)} } ` + `error: {code: ${errCode}, message: ${translateErrorCode(errCode)} }`);
var init_error_utils = __esm(() => {
  init_command_code();
});

// node_modules/@iggy.rs/sdk/dist/client/client.socket.js
import { Duplex } from "node:stream";
var wrapSocket = (socket) => new Promise((resolve, reject) => {
  const responseStream = new CommandResponseStream(socket);
  socket.on("error", (err) => {
    console.error("RESPONSESTREAM ERROR", err);
    reject(err);
  });
  socket.once("connect", () => {
    debug("responseStream.connect event");
    resolve(responseStream);
  });
  socket.on("close", () => {
    debug("socket#close");
    reject();
  });
  socket.on("end", () => {
    console.error("socket#end");
    reject();
  });
}), CommandResponseStream;
var init_client_socket = __esm(() => {
  init_client_utils();
  init_error_utils();
  init_login_command();
  init_login_with_token_command();
  init_client_debug();
  CommandResponseStream = class CommandResponseStream extends Duplex {
    _socket;
    _readPaused;
    _execQueue;
    busy;
    isAuthenticated;
    userId;
    constructor(socket) {
      super();
      this._socket = this._wrapSocket(socket);
      this._readPaused = false;
      this.busy = false;
      this._execQueue = [];
      this.isAuthenticated = false;
    }
    _destroy() {
      this._socket.destroy();
    }
    _read(size) {
      this._readPaused = false;
      debug("stream#_read", size);
      setImmediate(this._onReadable.bind(this));
    }
    _write(chunk, encoding, cb) {
      return this._socket.write(chunk, encoding, cb);
    }
    writeCommand(command, payload) {
      const cmd = serializeCommand(command, payload);
      return this._socket.write(cmd);
    }
    sendCommand(command, payload, handleResponse2 = true) {
      return new Promise((resolve, reject) => {
        this._execQueue.push({ command, payload, resolve, reject });
        this._processQueue(handleResponse2);
      });
    }
    async authenticate(creds) {
      const r = "token" in creds ? await this._authWithToken(creds) : await this._authWithPassword(creds);
      this.isAuthenticated = true;
      this.userId = r.userId;
      return this.isAuthenticated;
    }
    async _authWithPassword(creds) {
      const pl = LOGIN.serialize(creds);
      const logr = await this.sendCommand(LOGIN.code, pl);
      return LOGIN.deserialize(logr);
    }
    async _authWithToken(creds) {
      const pl = LOGIN_WITH_TOKEN.serialize(creds);
      const logr = await this.sendCommand(LOGIN_WITH_TOKEN.code, pl);
      return LOGIN_WITH_TOKEN.deserialize(logr);
    }
    async _processQueue(handleResponse2 = true) {
      if (this.busy)
        return;
      this.busy = true;
      while (this._execQueue.length > 0) {
        const next = this._execQueue.shift();
        if (!next)
          break;
        const { command, payload, resolve, reject } = next;
        try {
          resolve(await this._processNext(command, payload, handleResponse2));
        } catch (err) {
          reject(err);
        }
      }
      this.busy = false;
      this.emit("finishQueue");
    }
    _processNext(command, payload, handleResp = true) {
      debug("==> writeCommand", this.writeCommand(command, payload));
      return new Promise((resolve, reject) => {
        const errCb = (err) => reject(err);
        this.once("error", errCb);
        this.once("data", (resp) => {
          this.removeListener("error", errCb);
          if (!handleResp)
            return resolve(resp);
          const r = handleResponse(resp);
          if (r.status !== 0) {
            return reject(responseError(command, r.status));
          }
          return resolve(r);
        });
      });
    }
    getReadStream() {
      return this;
    }
    _wrapSocket(socket) {
      socket.on("close", (hadError) => this.emit("close", hadError));
      socket.on("connect", () => this.emit("connect"));
      socket.on("drain", () => this.emit("drain"));
      socket.on("end", () => this.emit("end"));
      socket.on("error", (err) => this.emit("error", err));
      socket.on("lookup", (err, address, family, host) => this.emit("lookup", err, address, family, host));
      socket.on("ready", () => this.emit("ready"));
      socket.on("timeout", () => this.emit("timeout"));
      socket.on("readable", () => this._onReadable());
      return socket;
    }
    _onReadable() {
      while (!this._readPaused) {
        const head = this._socket.read(8);
        if (!head || head.length === 0)
          return;
        if (head.length < 8) {
          this._socket.unshift(head);
          return;
        }
        const responseSize = head.readUInt32LE(4);
        if (responseSize === 0) {
          this.push(head);
          return;
        }
        const payload = this._socket.read(responseSize);
        debug("payload", payload, responseSize, head.readUInt32LE(0));
        if (!payload) {
          this._socket.unshift(head);
          return;
        }
        if (payload.length < responseSize) {
          this._socket.unshift(Buffer.concat([head, payload]));
          return;
        }
        const pushOk = this.push(Buffer.concat([head, payload]));
        if (!pushOk)
          this._readPaused = true;
      }
    }
  };
});

// node_modules/@iggy.rs/sdk/dist/client/tcp.client.js
import { createConnection } from "node:net";
var createTcpSocket = (options) => {
  const socket = createConnection(options);
  return wrapSocket(socket);
}, TcpClient = ({ host, port, keepAlive = true }) => createTcpSocket({ host, port, keepAlive });
var init_tcp_client = __esm(() => {
  init_client_socket();
});

// node_modules/@iggy.rs/sdk/dist/client/tls.client.js
import { connect } from "node:tls";
var createTlsSocket = (port, options) => {
  const socket = connect(port, options);
  socket.setEncoding("utf8");
  return wrapSocket(socket);
}, TlsClient = ({ port, ...options }) => {
  return createTlsSocket(port, options);
};
var init_tls_client = __esm(() => {
  init_client_socket();
});

// node_modules/@iggy.rs/sdk/dist/client/client.js
var import_generic_pool, rawClientGetter = (config) => {
  const { transport, options } = config;
  switch (transport) {
    case "TLS":
      return TlsClient(options);
    case "TCP":
    default:
      return TcpClient(options);
  }
}, createPoolFactory = (config) => ({
  create: function() {
    return rawClientGetter(config);
  },
  destroy: async function(client2) {
    return client2.destroy();
  }
}), Client, SingleClient, SimpleClient;
var init_client2 = __esm(() => {
  init_command_set();
  init_tcp_client();
  init_tls_client();
  init_client_debug();
  import_generic_pool = __toESM(require_generic_pool(), 1);
  Client = class Client extends CommandAPI {
    _config;
    _pool;
    destroy;
    constructor(config) {
      const min = config.poolSize?.min || 1;
      const max = config.poolSize?.max || 4;
      const pool = import_generic_pool.createPool(createPoolFactory(config), { min, max });
      const getFromPool = async () => {
        const c = await pool.acquire();
        if (!c.isAuthenticated)
          await c.authenticate(config.credentials);
        debug("client acquired from pool. pool size is", pool.size);
        c.once("finishQueue", () => {
          pool.release(c);
          debug("client released to pool. pool size is", pool.size);
        });
        return c;
      };
      super(getFromPool);
      this._config = config;
      this._pool = pool;
      this.destroy = async () => {
        debug("destroying client pool. pool size is", pool.size);
        await this._pool.drain();
        await this._pool.clear();
        debug("destroyed client pool. pool size is", pool.size);
      };
    }
  };
  SingleClient = class SingleClient extends CommandAPI {
    _config;
    destroy;
    constructor(config) {
      const cliP = rawClientGetter(config);
      const init = async () => {
        const c = await cliP;
        if (!c.isAuthenticated)
          await c.authenticate(config.credentials);
        return c;
      };
      super(init);
      this._config = config;
      this.destroy = async () => {
        const s = await this.clientProvider();
        s.destroy();
      };
    }
  };
  SimpleClient = class SimpleClient extends CommandAPI {
    constructor(client2) {
      super(() => Promise.resolve(client2));
    }
  };
});

// node_modules/@iggy.rs/sdk/dist/client/client.type.js
var Transports;
var init_client_type = __esm(() => {
  Transports = ["TCP", "TLS"];
});

// node_modules/@iggy.rs/sdk/dist/client/index.js
var init_client3 = __esm(() => {
  init_client2();
  init_tcp_client();
  init_tls_client();
  init_client_utils();
  init_client_socket();
  init_client_type();
});

// node_modules/@iggy.rs/sdk/dist/stream/consumer-stream.js
import { Readable, pipeline, PassThrough } from "node:stream";
async function* genAutoCommitedPoll(c, poll, interval = 1000) {
  const state = new Map;
  while (true) {
    const r = await c.message.poll(poll);
    yield r;
    const k = `${r.partitionId}`;
    let part = state.get(k) || 0;
    part = r.messageCount;
    state.set(k, part);
    if (Array.from(state).every(([, last]) => last === 0)) {
      await wait(interval);
    }
  }
}
async function* genPoll(c, poll) {
  const pl = POLL_MESSAGES.serialize(poll);
  yield await c.sendCommand(POLL_MESSAGES.code, pl, false);
}
var wait = (interval, cb) => new Promise((resolve) => {
  setTimeout(() => resolve(cb ? cb() : undefined), interval);
}), singleConsumerStream = (config) => async (poll) => {
  const c = await rawClientGetter(config);
  if (!c.isAuthenticated)
    await c.authenticate(config.credentials);
  const ps = Readable.from(genPoll(c, poll), { objectMode: true });
  return pipeline(ps, new PassThrough({ objectMode: true }), (err) => console.error("pipeline error", err));
}, groupConsumerStream = (config) => async function groupConsumerStream2({ groupId, streamId, topicId, pollingStrategy, count, interval = 1000, autocommit = true }) {
  const c = await rawClientGetter(config);
  const s = new SimpleClient(c);
  if (!c.isAuthenticated)
    await c.authenticate(config.credentials);
  try {
    await s.group.get({ streamId, topicId, groupId });
  } catch (err) {
    await s.group.create({ streamId, topicId, groupId, name: `auto-${groupId}` });
  }
  await s.group.join({ streamId, topicId, groupId });
  const poll = {
    streamId,
    topicId,
    consumer: { kind: ConsumerKind.Group, id: groupId },
    partitionId: 0,
    pollingStrategy,
    count,
    autocommit
  };
  const ps = Readable.from(genAutoCommitedPoll(s, poll, interval), { objectMode: true });
  return ps;
};
var init_consumer_stream = __esm(() => {
  init_client2();
  init_poll_messages_command();
  init_wire();
});

// node_modules/@iggy.rs/sdk/dist/stream/index.js
var init_stream2 = __esm(() => {
  init_consumer_stream();
});

// node_modules/@iggy.rs/sdk/dist/index.js
var exports_dist = {};
__export(exports_dist, {
  wrapSocket: () => wrapSocket,
  singleConsumerStream: () => singleConsumerStream,
  serializeCommand: () => serializeCommand,
  handleResponseTransform: () => handleResponseTransform,
  handleResponse: () => handleResponse,
  groupConsumerStream: () => groupConsumerStream,
  deserializeVoidResponse: () => deserializeVoidResponse,
  Transports: () => Transports,
  TlsClient: () => TlsClient,
  TcpClient: () => TcpClient,
  SingleClient: () => SingleClient,
  SimpleClient: () => SimpleClient,
  PollingStrategy: () => PollingStrategy,
  Partitioning: () => Partitioning,
  HeaderValue: () => HeaderValue,
  ConsumerKind: () => ConsumerKind,
  CommandResponseStream: () => CommandResponseStream,
  Client: () => Client
});
var init_dist = __esm(() => {
  init_wire();
  init_client3();
  init_stream2();
});

// src/util/log.ts
function log(level, module, message, data) {
  const entry = {
    level,
    module,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

// src/util/circuitBreaker.ts
var DEFAULT_THRESHOLD = 5;
var DEFAULT_COOLDOWN_MS = 30000;

class CircuitBreaker {
  state = "closed";
  failures = 0;
  lastFailureTime = 0;
  threshold;
  cooldownMs;
  label;
  constructor(config) {
    this.threshold = config?.threshold ?? DEFAULT_THRESHOLD;
    this.cooldownMs = config?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.label = config?.label ?? "circuit-breaker";
  }
  async execute(fn) {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "half-open";
        log("info", this.label, "circuit half-open, attempting recovery");
      } else {
        throw new Error(`${this.label}: service unavailable (circuit open)`);
      }
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  isOpen() {
    if (this.state !== "open")
      return false;
    if (Date.now() - this.lastFailureTime > this.cooldownMs) {
      this.state = "half-open";
      return false;
    }
    return true;
  }
  reset() {
    if (this.failures > 0 || this.state !== "closed") {
      log("info", this.label, "circuit closed");
    }
    this.failures = 0;
    this.state = "closed";
  }
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "open";
      log("error", this.label, `circuit opened after ${this.failures} consecutive failures`);
    }
  }
}

// src/util/traceContext.ts
var randomHex = (bytes) => {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};
var generateTraceparent = () => {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return `00-${traceId}-${spanId}-01`;
};
var getTraceHeaders = () => {
  try {
    const otel = globalThis;
    const api = otel.__OTEL_API__;
    const span = api?.trace?.getActiveSpan?.();
    if (span?.spanContext) {
      const ctx = span.spanContext();
      if (ctx.traceId && ctx.spanId) {
        const flags = ctx.traceFlags.toString(16).padStart(2, "0");
        return {
          traceparent: `00-${ctx.traceId}-${ctx.spanId}-${flags}`
        };
      }
    }
  } catch {}
  return { traceparent: generateTraceparent() };
};

// src/events/buffer.ts
class EventBuffer {
  #config;
  #flushFn;
  #queue = [];
  #timer = null;
  #closed = false;
  constructor(config, flushFn) {
    this.#config = config;
    this.#flushFn = flushFn;
    this.#startTimer();
  }
  async add(event) {
    if (this.#closed) {
      throw new Error("EventBuffer is closed");
    }
    this.#queue.push(event);
    if (this.#queue.length >= this.#config.maxSize) {
      await this.flush();
    }
  }
  async flush() {
    if (this.#queue.length === 0)
      return [];
    const batch = this.#queue.splice(0);
    try {
      const results = await this.#flushFn(batch);
      log("info", "events", "buffer flushed", {
        count: batch.length
      });
      return results;
    } catch (err) {
      log("error", "events", "buffer flush failed", {
        count: batch.length,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async close() {
    this.#closed = true;
    this.#stopTimer();
    await this.flush();
  }
  #startTimer() {
    this.#timer = setInterval(() => {
      if (this.#queue.length > 0) {
        this.flush().catch((err) => {
          log("error", "events", "interval flush failed", {
            error: err instanceof Error ? err.message : String(err)
          });
        });
      }
    }, this.#config.flushIntervalMs);
  }
  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }
}

// src/events/validation.ts
var import_ajv = __toESM(require_ajv(), 1);
var ajv = new import_ajv.default({ allErrors: true });

class SchemaCache {
  #schemas = new Map;
  set(name, schema) {
    this.#schemas.set(name, schema);
  }
  get(name) {
    return this.#schemas.get(name);
  }
  populate(schemas) {
    for (const s of schemas) {
      if (s.enforcement === "strict" && s.payloadSchema) {
        this.#schemas.set(s.name, s.payloadSchema);
      }
    }
  }
  has(name) {
    return this.#schemas.has(name);
  }
  clear() {
    this.#schemas.clear();
  }
}
var validateEventData = (data, schema) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return {
    valid,
    errors: valid ? [] : (validate.errors ?? []).map((e) => `${e.instancePath || "/"}: ${e.message ?? "unknown"}`)
  };
};

// src/events/http.ts
var REQUEST_TIMEOUT_MS = 5000;
var DEFAULT_MAX_RETRIES = 3;
var BASE_DELAY_MS = 200;

class HttpEventsProvider {
  config;
  circuitBreaker;
  maxRetries;
  timeoutMs;
  buffer;
  schemaCache;
  constructor(config) {
    this.config = config;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
    this.schemaCache = new SchemaCache;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "vortex-events"
    });
    this.buffer = config.batch ? new EventBuffer(config.batch, (events) => this.#emitDirect(events)) : null;
  }
  async emit(event) {
    if (this.buffer) {
      await this.buffer.add(event);
      return {
        eventId: "buffered",
        timestamp: new Date().toISOString()
      };
    }
    return this.#emitSingle(event);
  }
  async#emitDirect(events) {
    const results = await Promise.allSettled(events.map((e) => this.#emitSingle(e)));
    return results.map((r) => r.status === "fulfilled" ? r.value : {
      eventId: "failed",
      timestamp: new Date().toISOString()
    });
  }
  async#emitSingle(event) {
    if (this.config.validation?.enabled) {
      const schema = this.schemaCache.get(event.type);
      if (schema) {
        const result = validateEventData(event.data, schema);
        if (!result.valid) {
          throw new Error(`Schema validation failed for "${event.type}": ${result.errors.join(", ")}`);
        }
      }
    }
    const startTime = Date.now();
    const body = {
      type: event.type,
      data: event.data,
      source: event.source ?? this.config.source,
      subject: event.subject,
      correlationId: event.correlationId,
      schemaId: event.schemaId,
      specversion: event.specversion,
      datacontenttype: event.datacontenttype,
      dataschema: event.dataschema,
      omniworkspaceid: event.omniworkspaceid,
      omnischemaversion: event.omnischemaversion
    };
    try {
      const result = await this.circuitBreaker.execute(() => retryWithBackoff(async () => {
        const response = await fetch(`${this.config.baseUrl}/api/v1/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders(),
            ...getTraceHeaders()
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!response.ok) {
          throw new Error(`Event emit failed: ${response.status}`);
        }
        return await response.json();
      }, this.maxRetries));
      log("info", "events", "event emitted", {
        eventId: result.eventId,
        type: event.type,
        durationMs: Date.now() - startTime
      });
      return result;
    } catch (err) {
      log("error", "events", "event emit failed", {
        type: event.type,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async emitBatch(events) {
    const results = [];
    for (const event of events) {
      results.push(await this.emit(event));
    }
    return results;
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      return {
        healthy: response.ok,
        message: response.ok ? "OK" : `Status ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async subscribe(input) {
    const response = await fetch(`${this.config.baseUrl}/api/v1/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) {
      throw new Error(`Failed to create subscription: ${response.status}`);
    }
    return await response.json();
  }
  async unsubscribe(subscriptionId) {
    const response = await fetch(`${this.config.baseUrl}/api/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) {
      throw new Error(`Failed to delete subscription: ${response.status}`);
    }
  }
  async listSubscriptions() {
    const response = await fetch(`${this.config.baseUrl}/api/v1/subscriptions`, {
      headers: this.authHeaders(),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) {
      throw new Error(`Failed to list subscriptions: ${response.status}`);
    }
    const result = await response.json();
    return result.nodes;
  }
  async close() {
    await this.buffer?.close();
  }
  authHeaders() {
    return { Authorization: this.config.apiKey };
  }
}
async function retryWithBackoff(fn, maxRetries) {
  let lastError;
  for (let attempt = 0;attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = BASE_DELAY_MS * 2 ** attempt * (0.5 + Math.random() * 0.5);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// src/events/iggy.ts
var DEFAULT_PORT = 8090;
var DEFAULT_STREAM_NAME = "omni-events";
var STREAM_ID = 1;
var DEFAULT_PARTITION_COUNT = 3;
var RETENTION_SECONDS = 90 * 24 * 60 * 60;

class IggyEventsProvider {
  config;
  port;
  streamName;
  partitionCount;
  client = null;
  knownTopics = new Set;
  constructor(config) {
    this.config = config;
    this.port = config.port ?? DEFAULT_PORT;
    this.streamName = config.streamName ?? DEFAULT_STREAM_NAME;
    this.partitionCount = config.partitionCount ?? DEFAULT_PARTITION_COUNT;
  }
  async emit(event) {
    const client3 = await this.#requireClient();
    const topicName = event.organizationId ?? this.config.organizationId ?? "system";
    await this.#ensureTopic(topicName);
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const envelope = {
      id: eventId,
      type: event.type,
      data: event.data,
      source: event.source ?? this.config.source,
      subject: event.subject,
      organizationId: topicName,
      correlationId: event.correlationId,
      schemaId: event.schemaId,
      timestamp,
      traceContext: {
        traceparent: generateTraceparent()
      }
    };
    const { Partitioning: Partitioning2 } = await Promise.resolve().then(() => (init_dist(), exports_dist));
    const partition2 = event.subject ? Partitioning2.MessageKey(event.subject) : Partitioning2.Balanced;
    await client3.message.send({
      streamId: STREAM_ID,
      topicId: topicName,
      messages: [{ payload: Buffer.from(JSON.stringify(envelope)) }],
      partition: partition2
    });
    log("info", "events", "event published to Iggy", {
      eventId,
      type: event.type,
      topic: topicName
    });
    return { eventId, timestamp };
  }
  async emitBatch(events) {
    const results = [];
    for (const event of events) {
      results.push(await this.emit(event));
    }
    return results;
  }
  async healthCheck() {
    try {
      await this.#requireClient();
      return { healthy: true, message: "OK" };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async subscribe(_input) {
    throw new Error("Subscriptions must be managed via the HTTP provider");
  }
  async unsubscribe(_subscriptionId) {
    throw new Error("Subscriptions must be managed via the HTTP provider");
  }
  async listSubscriptions() {
    throw new Error("Subscriptions must be managed via the HTTP provider");
  }
  async close() {
    this.client?.destroy();
    this.client = null;
    this.knownTopics.clear();
    log("info", "events", "Iggy client closed");
  }
  async#requireClient() {
    if (this.client)
      return this.client;
    const { Client: Client2 } = await Promise.resolve().then(() => (init_dist(), exports_dist));
    this.client = new Client2({
      transport: "TCP",
      options: { host: this.config.host, port: this.port },
      credentials: {
        username: this.config.username,
        password: this.config.password
      }
    });
    await this.#ensureStream();
    log("info", "events", "Iggy client connected", {
      host: this.config.host,
      port: this.port
    });
    return this.client;
  }
  async#ensureStream() {
    const client3 = this.client;
    try {
      await client3.stream.get({ streamId: STREAM_ID });
    } catch {
      await client3.stream.create({
        streamId: STREAM_ID,
        name: this.streamName
      });
      log("info", "events", "created Iggy stream", {
        streamId: STREAM_ID,
        name: this.streamName
      });
    }
  }
  async#ensureTopic(name) {
    if (this.knownTopics.has(name))
      return;
    const client3 = await this.#requireClient();
    const { CompressionAlgorithmKind: CompressionAlgorithmKind2 } = await Promise.resolve().then(() => (init_topic_utils(), exports_topic_utils));
    try {
      await client3.topic.get({ streamId: STREAM_ID, topicId: name });
    } catch {
      await client3.topic.create({
        streamId: STREAM_ID,
        topicId: 0,
        name,
        partitionCount: this.partitionCount,
        compressionAlgorithm: CompressionAlgorithmKind2.None,
        messageExpiry: BigInt(RETENTION_SECONDS)
      });
      log("info", "events", "created Iggy topic", {
        streamId: STREAM_ID,
        topic: name
      });
    }
    this.knownTopics.add(name);
  }
}

// src/events/noop.ts
class NoopEventsProvider {
  async emit(_event) {
    return {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
  async emitBatch(events) {
    return events.map(() => ({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }));
  }
  async healthCheck() {
    return { healthy: true, message: "noop" };
  }
  async subscribe(input) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      typePattern: input.typePattern,
      targetUrl: input.targetUrl,
      sourcePattern: input.sourcePattern ?? null,
      signatureHeader: input.signatureHeader ?? "x-vortex-signature",
      enabled: true,
      createdAt: new Date().toISOString(),
      hmacSecret: "noop-secret"
    };
  }
  async unsubscribe(_subscriptionId) {}
  async listSubscriptions() {
    return [];
  }
  async close() {}
}
// src/events/helpers.ts
var REQUEST_TIMEOUT_MS2 = 5000;
var registerSchemas = async (baseUrl, apiKey, schemas, schemaCache) => {
  const results = [];
  for (const schema of schemas) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/schemas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey
        },
        body: JSON.stringify({
          name: schema.name,
          source: schema.source,
          version: schema.version ?? 1,
          description: schema.description,
          payloadSchema: schema.payloadSchema,
          enforcement: schema.enforcement,
          compatibilityMode: schema.compatibilityMode,
          migrationTransform: schema.migrationTransform
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS2)
      });
      if (!response.ok) {
        log("error", "events", "schema registration failed", {
          name: schema.name,
          status: response.status
        });
        continue;
      }
      const { schema: registered } = await response.json();
      results.push(registered);
      log("info", "events", "schema registered", {
        name: registered.name,
        version: registered.version,
        id: registered.id
      });
    } catch (err) {
      log("error", "events", "schema registration error", {
        name: schema.name,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
  if (schemaCache && results.length > 0) {
    schemaCache.populate(results);
  }
  return results;
};

// src/events/index.ts
var createEventsProvider = (config) => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopEventsProvider;
  }
  if (config.provider === "http") {
    if (!config.baseUrl) {
      throw new Error("HttpEventsProvider requires baseUrl in config");
    }
    if (!config.apiKey) {
      throw new Error("HttpEventsProvider requires apiKey in config");
    }
    return new HttpEventsProvider({
      ...config,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey
    });
  }
  if (config.provider === "iggy") {
    if (!config.host) {
      throw new Error("IggyEventsProvider requires host in config");
    }
    if (!config.username) {
      throw new Error("IggyEventsProvider requires username in config");
    }
    if (!config.password) {
      throw new Error("IggyEventsProvider requires password in config");
    }
    return new IggyEventsProvider({
      ...config,
      host: config.host,
      username: config.username,
      password: config.password
    });
  }
  const _exhaustive = config;
  throw new Error(`Unknown events provider: ${_exhaustive}`);
};
export {
  validateEventData,
  registerSchemas,
  createEventsProvider,
  SchemaCache,
  NoopEventsProvider,
  IggyEventsProvider,
  HttpEventsProvider,
  EventBuffer
};
