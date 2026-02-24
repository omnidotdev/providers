import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

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
var require_errors = __commonJS((exports, module) => {
  class ExtendableError extends Error {
    constructor(message3) {
      super(message3);
      this.name = this.constructor.name;
      this.message = message3;
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error(message3).stack;
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
  var errors = require_errors();
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
var require_utils = __commonJS((exports) => {
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
  var reflector = require_utils().reflector;
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

// src/auth/types.ts
var OMNI_CLAIMS_NAMESPACE = "https://manifold.omni.dev/@omni/claims/organizations";

// src/auth/claims.ts
var extractOrgClaims = (claims) => {
  return claims[OMNI_CLAIMS_NAMESPACE] ?? [];
};
// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder;
var decoder = new TextDecoder;
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0;i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}

// node_modules/jose/dist/webapi/lib/base64.js
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}

// node_modules/jose/dist/webapi/util/errors.js
class JOSEError extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class JWTClaimValidationFailed extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message, payload, claim = "unspecified", reason = "unspecified") {
    super(message, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
}

class JWTExpired extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message, payload, claim = "unspecified", reason = "unspecified") {
    super(message, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
}

class JOSEAlgNotAllowed extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
}

class JOSENotSupported extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
}
class JWSInvalid extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
}

class JWTInvalid extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
}
class JWKSInvalid extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
}

class JWKSNoMatchingKey extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message = "no applicable key found in the JSON Web Key Set", options) {
    super(message, options);
  }
}

class JWKSMultipleMatchingKeys extends JOSEError {
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message, options);
  }
}

class JWKSTimeout extends JOSEError {
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message = "request timed out", options) {
    super(message, options);
  }
}

class JWSSignatureVerificationFailed extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message = "signature verification failed", options) {
    super(message, options);
  }
}

// node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
var isAlgorithm = (algorithm, name) => algorithm.name === name;
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
var withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);

// node_modules/jose/dist/webapi/lib/is_disjoint.js
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}

// node_modules/jose/dist/webapi/lib/is_object.js
var isObjectLike = (value) => typeof value === "object" && value !== null;
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}

// node_modules/jose/dist/webapi/lib/check_key_length.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}

// node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== undefined) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== undefined && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}

// node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== undefined && protectedHeader?.crit === undefined) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === undefined) {
    return new Set;
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== undefined) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === undefined) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === undefined) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== undefined && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return;
  }
  return new Set(algorithms);
}

// node_modules/jose/dist/webapi/lib/is_jwk.js
var isJWK = (key) => isObject(key) && typeof key.kty === "string";
var isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
var isPublicJWK = (key) => key.kty !== "oct" && key.d === undefined && key.priv === undefined;
var isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";

// node_modules/jose/dist/webapi/lib/normalize_key.js
var cache;
var handleJWK = async (key, jwk, alg, freeze = false) => {
  cache ||= new WeakMap;
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwkToKey({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
var handleKeyObject = (keyObject, alg) => {
  cache ||= new WeakMap;
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash;
    switch (alg) {
      case "RSA-OAEP":
        hash = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash = "SHA-512";
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg === "ES256" && namedCurve === "P-256") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES384" && namedCurve === "P-384") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES512" && namedCurve === "P-521") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError("given KeyObject instance cannot be used for this algorithm");
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
};
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}

// node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = (key) => key?.[Symbol.toStringTag];
var jwkMatchesOp = (alg, key, usage) => {
  if (key.use !== undefined) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key.alg !== undefined && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
};
var symmetricTypeCheck = (alg, key, usage) => {
  if (key instanceof Uint8Array)
    return;
  if (isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
};
var asymmetricTypeCheck = (alg, key, usage) => {
  if (isJWK(key)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
    }
  }
  if (!isKeyLike(key)) {
    throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
    }
  }
  if (key.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
    }
  }
};
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}

// node_modules/jose/dist/webapi/lib/subtle_dsa.js
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}

// node_modules/jose/dist/webapi/lib/get_sign_verify_key.js
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}

// node_modules/jose/dist/webapi/lib/verify.js
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === undefined && jws.header === undefined) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== undefined && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === undefined) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== undefined && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== undefined ? encode(jws.protected) : new Uint8Array, encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed;
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== undefined) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== undefined) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = (date) => Math.floor(date.getTime() / 1000);
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
var normalizeTyp = (value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
};
var checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
};
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {}
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== undefined)
    presenceCheck.push("iat");
  if (audience !== undefined)
    presenceCheck.push("aud");
  if (subject !== undefined)
    presenceCheck.push("sub");
  if (issuer !== undefined)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || new Date);
  if ((payload.iat !== undefined || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== undefined) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== undefined) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}

class JWTClaimsBuilder {
  #payload;
  constructor(payload) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this.#payload = structuredClone(payload);
  }
  data() {
    return encoder.encode(JSON.stringify(this.#payload));
  }
  get iss() {
    return this.#payload.iss;
  }
  set iss(value) {
    this.#payload.iss = value;
  }
  get sub() {
    return this.#payload.sub;
  }
  set sub(value) {
    this.#payload.sub = value;
  }
  get aud() {
    return this.#payload.aud;
  }
  set aud(value) {
    this.#payload.aud = value;
  }
  set jti(value) {
    this.#payload.jti = value;
  }
  set nbf(value) {
    if (typeof value === "number") {
      this.#payload.nbf = validateInput("setNotBefore", value);
    } else if (value instanceof Date) {
      this.#payload.nbf = validateInput("setNotBefore", epoch(value));
    } else {
      this.#payload.nbf = epoch(new Date) + secs(value);
    }
  }
  set exp(value) {
    if (typeof value === "number") {
      this.#payload.exp = validateInput("setExpirationTime", value);
    } else if (value instanceof Date) {
      this.#payload.exp = validateInput("setExpirationTime", epoch(value));
    } else {
      this.#payload.exp = epoch(new Date) + secs(value);
    }
  }
  set iat(value) {
    if (value === undefined) {
      this.#payload.iat = epoch(new Date);
    } else if (value instanceof Date) {
      this.#payload.iat = validateInput("setIssuedAt", epoch(value));
    } else if (typeof value === "string") {
      this.#payload.iat = validateInput("setIssuedAt", epoch(new Date) + secs(value));
    } else {
      this.#payload.iat = validateInput("setIssuedAt", value);
    }
  }
}

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
// node_modules/jose/dist/webapi/jwks/local.js
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
function isJWKLike(key) {
  return isObject(key);
}

class LocalJWKSet {
  #jwks;
  #cached = new WeakMap;
  constructor(jwks) {
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey;
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys;
      const _cached = this.#cached;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {}
        }
      };
      throw error;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
}
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === undefined) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: () => structuredClone(set.jwks()),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
var USER_AGENT;
if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.1.3";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout;
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
var jwksCache = Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}

class RemoteJWKSet {
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5000;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 30000;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 600000;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== undefined) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = undefined;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json) => {
      this.#local = createLocalJWKSet(json);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = undefined;
    }).catch((err) => {
      this.#pendingFetch = undefined;
      throw err;
    });
    await this.#pendingFetch;
  }
}
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: () => set.coolingDown(),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: () => set.fresh(),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: () => set.reload(),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: () => set.pendingFetch(),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: () => set.jwks(),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
// src/auth/jwt.ts
var jwksCache2 = new Map;
function getJWKS(authBaseUrl) {
  let jwks = jwksCache2.get(authBaseUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${authBaseUrl}/.well-known/jwks.json`));
    jwksCache2.set(authBaseUrl, jwks);
  }
  return jwks;
}
async function verifyAccessToken(token, config) {
  const jwks = getJWKS(config.authBaseUrl);
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer ?? config.authBaseUrl
  });
  if (!payload.sub) {
    throw new Error("Missing required 'sub' claim");
  }
  return payload;
}
// src/util/cache.ts
var DEFAULT_TTL_MS = 300000;

class TtlCache {
  cache = new Map;
  defaultTtlMs;
  constructor(config) {
    this.defaultTtlMs = config?.defaultTtlMs ?? DEFAULT_TTL_MS;
  }
  get(key, version) {
    const entry = this.cache.get(key);
    if (!entry)
      return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    if (version !== undefined && entry.version !== version) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  set(key, value, ttlMs, version) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      version
    });
  }
  has(key) {
    return this.get(key) !== null;
  }
  delete(key) {
    this.cache.delete(key);
  }
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  invalidateByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
}

// src/util/log.ts
function log(level, module, message2, data) {
  const entry = {
    level,
    module,
    message: message2,
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

// src/authz/warden.ts
var REQUEST_TIMEOUT_MS = 5000;
var DEFAULT_CACHE_TTL_MS = 120000;

class WardenAuthzProvider {
  config;
  circuitBreaker;
  permissionCache;
  constructor(config) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "warden-authz"
    });
    this.permissionCache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs
    });
  }
  async checkPermission(userId, resourceType, resourceId, permission, requestCache) {
    const cacheKey = buildCacheKey(userId, resourceType, resourceId, permission);
    if (requestCache?.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }
    const cached = this.permissionCache.get(cacheKey);
    if (cached !== null) {
      requestCache?.set(cacheKey, cached);
      return cached;
    }
    const startTime = Date.now();
    try {
      const allowed = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders()
          },
          body: JSON.stringify({
            user: `user:${userId}`,
            relation: permission,
            object: `${resourceType}:${resourceId}`
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) {
          throw new Error(`AuthZ check failed: ${response.status}`);
        }
        const result = await response.json();
        return result.allowed;
      });
      requestCache?.set(cacheKey, allowed);
      this.permissionCache.set(cacheKey, allowed);
      log("info", "authz", "permission check", {
        userId,
        resourceType,
        resourceId,
        permission,
        allowed,
        durationMs: Date.now() - startTime
      });
      return allowed;
    } catch (err) {
      log("error", "authz", "permission check failed", {
        userId,
        resourceType,
        resourceId,
        permission,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async checkPermissionsBatch(checks, requestCache) {
    const results = [];
    const uncachedChecks = [];
    for (let i = 0;i < checks.length; i++) {
      const check = checks[i];
      const cacheKey = buildCacheKey(check.userId, check.resourceType, check.resourceId, check.permission);
      if (requestCache?.has(cacheKey)) {
        results[i] = { ...check, allowed: requestCache.get(cacheKey) };
        continue;
      }
      const cached = this.permissionCache.get(cacheKey);
      if (cached !== null) {
        requestCache?.set(cacheKey, cached);
        results[i] = { ...check, allowed: cached };
        continue;
      }
      uncachedChecks.push({ index: i, check });
    }
    if (uncachedChecks.length === 0)
      return results;
    const startTime = Date.now();
    try {
      const batchResults = await this.circuitBreaker.execute(async () => {
        const response = await fetch(`${this.config.apiUrl}/check/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.authHeaders()
          },
          body: JSON.stringify({
            checks: uncachedChecks.map(({ check }) => ({
              user: `user:${check.userId}`,
              relation: check.permission,
              object: `${check.resourceType}:${check.resourceId}`
            }))
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) {
          throw new Error(`AuthZ batch check failed: ${response.status}`);
        }
        const result = await response.json();
        return result.results;
      });
      for (let i = 0;i < uncachedChecks.length; i++) {
        const { index, check } = uncachedChecks[i];
        const allowed = batchResults[i].allowed;
        const cacheKey = buildCacheKey(check.userId, check.resourceType, check.resourceId, check.permission);
        requestCache?.set(cacheKey, allowed);
        this.permissionCache.set(cacheKey, allowed);
        results[index] = { ...check, allowed };
      }
      log("info", "authz", "batch permission check", {
        total: checks.length,
        fetched: uncachedChecks.length,
        durationMs: Date.now() - startTime
      });
      return results;
    } catch (err) {
      log("error", "authz", "batch permission check failed", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async writeTuples(tuples, accessToken) {
    if (tuples.length === 0)
      return { success: true };
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("write", tuples);
      if (result.success)
        return result;
    }
    return this.syncDirect("POST", tuples, accessToken);
  }
  async deleteTuples(tuples, accessToken) {
    if (tuples.length === 0)
      return { success: true };
    if (this.config.vortexUrl && this.config.vortexWebhookSecret) {
      const result = await this.syncViaVortex("delete", tuples);
      if (result.success)
        return result;
    }
    return this.syncDirect("DELETE", tuples, accessToken);
  }
  invalidateCache(pattern) {
    this.permissionCache.invalidate(pattern);
  }
  clearCache() {
    this.permissionCache.clear();
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        signal: AbortSignal.timeout(5000)
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
  authHeaders() {
    if (this.config.serviceKey) {
      return { "X-Service-Key": this.config.serviceKey };
    }
    return {};
  }
  async syncViaVortex(operation, tuples) {
    try {
      const response = await fetch(`${this.config.vortexUrl}/webhooks/authz/${this.config.vortexWebhookSecret}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Event-Type": `authz.tuples.${operation}`
        },
        body: JSON.stringify({
          tuples,
          timestamp: new Date().toISOString(),
          source: this.config.source ?? "unknown"
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        log("info", "authz", `tuple ${operation} via Vortex`, {
          tupleCount: tuples.length
        });
        return { success: true };
      }
      log("warn", "authz", `Vortex ${operation} failed, falling back`, {
        status: response.status,
        tupleCount: tuples.length
      });
      return {
        success: false,
        error: `Vortex returned ${response.status}`
      };
    } catch (error) {
      log("warn", "authz", `Vortex ${operation} error, falling back`, {
        error: error instanceof Error ? error.message : String(error),
        tupleCount: tuples.length
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  async syncDirect(method, tuples, accessToken) {
    const operation = method === "POST" ? "write" : "delete";
    if (!this.config.serviceKey && !accessToken) {
      const errorMsg = "No service key or access token for Warden API authentication";
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    }
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.config.serviceKey) {
        headers["X-Service-Key"] = this.config.serviceKey;
      } else if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const response = await fetch(`${this.config.apiUrl}/tuples`, {
        method,
        headers,
        body: JSON.stringify({ tuples }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.ok) {
        log("info", "authz", `tuple ${operation}`, {
          tupleCount: tuples.length
        });
        return { success: true };
      }
      const errorMsg = `Warden API returned ${response.status}`;
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log("error", "authz", `tuple ${operation} failed`, {
        error: errorMsg,
        tupleCount: tuples.length
      });
      return { success: false, error: errorMsg };
    }
  }
}
function buildCacheKey(userId, resourceType, resourceId, permission) {
  return `${userId}:${resourceType}:${resourceId}:${permission}`;
}

// src/authz/index.ts
var createAuthzProvider = (config) => {
  if (!config?.apiUrl) {
    throw new Error("WardenAuthzProvider requires apiUrl in config");
  }
  return new WardenAuthzProvider({ ...config, apiUrl: config.apiUrl });
};
// src/billing/aether.ts
var REQUEST_TIMEOUT_MS2 = 5000;
var DEFAULT_CACHE_TTL_MS2 = 300000;

class AetherBillingProvider {
  config;
  circuitBreaker;
  cache;
  constructor(config) {
    this.config = {
      ...config,
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS2
    };
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "aether-billing"
    });
    this.cache = new TtlCache({
      defaultTtlMs: this.config.cacheTtlMs
    });
  }
  async getEntitlements(entityType, entityId, productId, accessToken) {
    const cacheKey = `${entityType}:${entityId}:${productId ?? "all"}`;
    const cached = this.cache.get(cacheKey);
    if (cached)
      return cached;
    if (this.circuitBreaker.isOpen()) {
      log("warn", "billing", "circuit breaker open, returning null");
      return null;
    }
    try {
      const appId = productId ?? this.config.appId;
      const url = new URL(`${this.config.baseUrl}/entitlements/${appId}/${entityType}/${entityId}`);
      const headers = {};
      if (this.config.serviceApiKey) {
        headers["x-service-api-key"] = this.config.serviceApiKey;
      }
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS2)
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        log("error", "billing", "failed to fetch entitlements", {
          status: response.status
        });
        return null;
      }
      const result = await response.json();
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      log("error", "billing", "error fetching entitlements", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  async checkEntitlement(entityType, entityId, productId, featureKey, accessToken) {
    const entitlements = await this.getEntitlements(entityType, entityId, productId, accessToken);
    if (!entitlements)
      return null;
    const entitlement = entitlements.entitlements.find((e) => e.featureKey === featureKey);
    return entitlement?.value ?? null;
  }
  async getPrices(appName) {
    const response = await fetch(`${this.config.baseUrl}/prices/${appName}`, {
      headers: this.serviceHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS2)
    });
    if (!response.ok)
      return [];
    const { prices } = await response.json();
    return prices;
  }
  async createCheckoutSession(params) {
    const response = await fetch(`${this.config.baseUrl}/checkout/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.serviceHeaders()
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to create checkout session");
    }
    const { url } = await response.json();
    return url;
  }
  async createCheckoutWithWorkspace(params) {
    const response = await fetch(`${this.config.baseUrl}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`
      },
      body: JSON.stringify({
        appId: params.appId,
        priceId: params.priceId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        ...params.workspaceId && { workspaceId: params.workspaceId },
        ...params.createWorkspace && {
          createWorkspace: params.createWorkspace
        }
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to create checkout session");
    }
    return response.json();
  }
  async getSubscription(entityType, entityId, accessToken) {
    try {
      const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS2)
      });
      if (!response.ok)
        return null;
      const { subscription } = await response.json();
      return subscription;
    } catch {
      return null;
    }
  }
  async getBillingPortalUrl(entityType, entityId, productId, returnUrl, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/${entityType}/${entityId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ productId, returnUrl })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to get billing portal URL");
    }
    const { url } = await response.json();
    return url;
  }
  async cancelSubscription(entityType, entityId, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to cancel subscription");
    }
    const { id } = await response.json();
    return id;
  }
  async renewSubscription(entityType, entityId, accessToken) {
    const response = await fetch(`${this.config.baseUrl}/billing-portal/subscription/${entityType}/${entityId}/renew`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to renew subscription");
    }
  }
  invalidateCache(entityType, entityId) {
    this.cache.invalidateByPrefix(`${entityType}:${entityId}:`);
  }
  clearCache() {
    this.cache.clear();
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000)
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
  serviceHeaders() {
    if (this.config.serviceApiKey) {
      return { "x-service-api-key": this.config.serviceApiKey };
    }
    return {};
  }
}
// src/billing/helpers.ts
var isWithinLimit = (entitlements, featureKey, currentCount, defaultLimits) => {
  if (!entitlements) {
    const freeLimit = defaultLimits?.[featureKey]?.free;
    if (freeLimit === undefined || freeLimit === -1)
      return true;
    return currentCount < freeLimit;
  }
  const entitlement = entitlements.entitlements.find((e) => e.featureKey === featureKey);
  if (entitlement?.value) {
    const limit = Number(entitlement.value);
    if (limit === -1 || Number.isNaN(limit))
      return true;
    return currentCount < limit;
  }
  if (defaultLimits) {
    const tierEntitlement = entitlements.entitlements.find((e) => e.featureKey === "tier");
    const tier = tierEntitlement?.value ?? "free";
    const limit = defaultLimits[featureKey]?.[tier];
    if (limit === undefined || limit === -1)
      return true;
    return currentCount < limit;
  }
  return true;
};

// src/billing/index.ts
var createBillingProvider = (config) => {
  if (!config?.baseUrl) {
    throw new Error("AetherBillingProvider requires baseUrl in config");
  }
  if (!config?.appId) {
    throw new Error("AetherBillingProvider requires appId in config");
  }
  return new AetherBillingProvider({
    ...config,
    baseUrl: config.baseUrl,
    appId: config.appId
  });
};
// src/events/http.ts
var REQUEST_TIMEOUT_MS3 = 5000;
var DEFAULT_MAX_RETRIES = 3;
var BASE_DELAY_MS = 200;

class HttpEventsProvider {
  config;
  circuitBreaker;
  maxRetries;
  timeoutMs;
  constructor(config) {
    this.config = config;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS3;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "vortex-events"
    });
  }
  async emit(event) {
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
            ...this.authHeaders()
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
  async close() {}
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
      timestamp
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
  async close() {}
}

// src/events/helpers.ts
var REQUEST_TIMEOUT_MS4 = 5000;
var registerSchemas = async (baseUrl, apiKey, schemas) => {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS4)
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
  verifyAccessToken,
  registerSchemas,
  isWithinLimit,
  extractOrgClaims,
  createEventsProvider,
  createBillingProvider,
  createAuthzProvider,
  WardenAuthzProvider,
  TtlCache,
  OMNI_CLAIMS_NAMESPACE,
  NoopEventsProvider,
  IggyEventsProvider,
  HttpEventsProvider,
  CircuitBreaker,
  AetherBillingProvider
};
