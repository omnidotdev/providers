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

// node_modules/postal-mime/src/decode-strings.js
function decodeBase64(base64) {
  let bufferLength = Math.ceil(base64.length / 4) * 3;
  const len = base64.length;
  let p = 0;
  if (base64.length % 4 === 3) {
    bufferLength--;
  } else if (base64.length % 4 === 2) {
    bufferLength -= 2;
  } else if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i2 = 0;i2 < len; i2 += 4) {
    let encoded1 = base64Lookup[base64.charCodeAt(i2)];
    let encoded2 = base64Lookup[base64.charCodeAt(i2 + 1)];
    let encoded3 = base64Lookup[base64.charCodeAt(i2 + 2)];
    let encoded4 = base64Lookup[base64.charCodeAt(i2 + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arrayBuffer;
}
function getDecoder(charset) {
  charset = charset || "utf8";
  let decoder;
  try {
    decoder = new TextDecoder(charset);
  } catch (err) {
    decoder = new TextDecoder("windows-1252");
  }
  return decoder;
}
async function blobToArrayBuffer(blob) {
  if ("arrayBuffer" in blob) {
    return await blob.arrayBuffer();
  }
  const fr = new FileReader;
  return new Promise((resolve, reject) => {
    fr.onload = function(e) {
      resolve(e.target.result);
    };
    fr.onerror = function(e) {
      reject(fr.error);
    };
    fr.readAsArrayBuffer(blob);
  });
}
function getHex(c) {
  if (c >= 48 && c <= 57 || c >= 97 && c <= 102 || c >= 65 && c <= 70) {
    return String.fromCharCode(c);
  }
  return false;
}
function decodeWord(charset, encoding, str) {
  let splitPos = charset.indexOf("*");
  if (splitPos >= 0) {
    charset = charset.substr(0, splitPos);
  }
  encoding = encoding.toUpperCase();
  let byteStr;
  if (encoding === "Q") {
    str = str.replace(/=\s+([0-9a-fA-F])/g, "=$1").replace(/[_\s]/g, " ");
    let buf = textEncoder.encode(str);
    let encodedBytes = [];
    for (let i2 = 0, len = buf.length;i2 < len; i2++) {
      let c = buf[i2];
      if (i2 <= len - 2 && c === 61) {
        let c1 = getHex(buf[i2 + 1]);
        let c2 = getHex(buf[i2 + 2]);
        if (c1 && c2) {
          let c3 = parseInt(c1 + c2, 16);
          encodedBytes.push(c3);
          i2 += 2;
          continue;
        }
      }
      encodedBytes.push(c);
    }
    byteStr = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(byteStr);
    for (let i2 = 0, len = encodedBytes.length;i2 < len; i2++) {
      dataView.setUint8(i2, encodedBytes[i2]);
    }
  } else if (encoding === "B") {
    byteStr = decodeBase64(str.replace(/[^a-zA-Z0-9\+\/=]+/g, ""));
  } else {
    byteStr = textEncoder.encode(str);
  }
  return getDecoder(charset).decode(byteStr);
}
function decodeWords(str) {
  let joinString = true;
  let done = false;
  while (!done) {
    let result = (str || "").toString().replace(/(=\?([^?]+)\?[Bb]\?([^?]*)\?=)\s*(?==\?([^?]+)\?[Bb]\?[^?]*\?=)/g, (match, left, chLeft, encodedLeftStr, chRight) => {
      if (!joinString) {
        return match;
      }
      if (chLeft === chRight && encodedLeftStr.length % 4 === 0 && !/=$/.test(encodedLeftStr)) {
        return left + "__\x00JOIN\x00__";
      }
      return match;
    }).replace(/(=\?([^?]+)\?[Qq]\?[^?]*\?=)\s*(?==\?([^?]+)\?[Qq]\?[^?]*\?=)/g, (match, left, chLeft, chRight) => {
      if (!joinString) {
        return match;
      }
      if (chLeft === chRight) {
        return left + "__\x00JOIN\x00__";
      }
      return match;
    }).replace(/(\?=)?__\x00JOIN\x00__(=\?([^?]+)\?[QqBb]\?)?/g, "").replace(/(=\?[^?]+\?[QqBb]\?[^?]*\?=)\s+(?==\?[^?]+\?[QqBb]\?[^?]*\?=)/g, "$1").replace(/=\?([\w_\-*]+)\?([QqBb])\?([^?]*)\?=/g, (m, charset, encoding, text) => decodeWord(charset, encoding, text));
    if (joinString && result.indexOf("�") >= 0) {
      joinString = false;
    } else {
      return result;
    }
  }
}
function decodeURIComponentWithCharset(encodedStr, charset) {
  charset = charset || "utf-8";
  let encodedBytes = [];
  for (let i2 = 0;i2 < encodedStr.length; i2++) {
    let c = encodedStr.charAt(i2);
    if (c === "%" && /^[a-f0-9]{2}/i.test(encodedStr.substr(i2 + 1, 2))) {
      let byte = encodedStr.substr(i2 + 1, 2);
      i2 += 2;
      encodedBytes.push(parseInt(byte, 16));
    } else if (c.charCodeAt(0) > 126) {
      c = textEncoder.encode(c);
      for (let j = 0;j < c.length; j++) {
        encodedBytes.push(c[j]);
      }
    } else {
      encodedBytes.push(c.charCodeAt(0));
    }
  }
  const byteStr = new ArrayBuffer(encodedBytes.length);
  const dataView = new DataView(byteStr);
  for (let i2 = 0, len = encodedBytes.length;i2 < len; i2++) {
    dataView.setUint8(i2, encodedBytes[i2]);
  }
  return getDecoder(charset).decode(byteStr);
}
function decodeParameterValueContinuations(header) {
  let paramKeys = new Map;
  Object.keys(header.params).forEach((key) => {
    let match = key.match(/\*((\d+)\*?)?$/);
    if (!match) {
      return;
    }
    let actualKey = key.substr(0, match.index).toLowerCase();
    let nr = Number(match[2]) || 0;
    let paramVal;
    if (!paramKeys.has(actualKey)) {
      paramVal = {
        charset: false,
        values: []
      };
      paramKeys.set(actualKey, paramVal);
    } else {
      paramVal = paramKeys.get(actualKey);
    }
    let value = header.params[key];
    if (nr === 0 && match[0].charAt(match[0].length - 1) === "*" && (match = value.match(/^([^']*)'[^']*'(.*)$/))) {
      paramVal.charset = match[1] || "utf-8";
      value = match[2];
    }
    paramVal.values.push({ nr, value });
    delete header.params[key];
  });
  paramKeys.forEach((paramVal, key) => {
    header.params[key] = decodeURIComponentWithCharset(paramVal.values.sort((a, b) => a.nr - b.nr).map((a) => a.value).join(""), paramVal.charset);
  });
}
var textEncoder, base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", base64Lookup, i;
var init_decode_strings = __esm(() => {
  textEncoder = new TextEncoder;
  base64Lookup = new Uint8Array(256);
  for (i = 0;i < base64Chars.length; i++) {
    base64Lookup[base64Chars.charCodeAt(i)] = i;
  }
});

// node_modules/postal-mime/src/pass-through-decoder.js
class PassThroughDecoder {
  constructor() {
    this.chunks = [];
  }
  update(line) {
    this.chunks.push(line);
    this.chunks.push(`
`);
  }
  finalize() {
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}
var init_pass_through_decoder = __esm(() => {
  init_decode_strings();
});

// node_modules/postal-mime/src/base64-decoder.js
class Base64Decoder {
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder;
    this.maxChunkSize = 100 * 1024;
    this.chunks = [];
    this.remainder = "";
  }
  update(buffer) {
    let str = this.decoder.decode(buffer);
    if (/[^a-zA-Z0-9+\/]/.test(str)) {
      str = str.replace(/[^a-zA-Z0-9+\/]+/g, "");
    }
    this.remainder += str;
    if (this.remainder.length >= this.maxChunkSize) {
      let allowedBytes = Math.floor(this.remainder.length / 4) * 4;
      let base64Str;
      if (allowedBytes === this.remainder.length) {
        base64Str = this.remainder;
        this.remainder = "";
      } else {
        base64Str = this.remainder.substr(0, allowedBytes);
        this.remainder = this.remainder.substr(allowedBytes);
      }
      if (base64Str.length) {
        this.chunks.push(decodeBase64(base64Str));
      }
    }
  }
  finalize() {
    if (this.remainder && !/^=+$/.test(this.remainder)) {
      this.chunks.push(decodeBase64(this.remainder));
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}
var init_base64_decoder = __esm(() => {
  init_decode_strings();
});

// node_modules/postal-mime/src/qp-decoder.js
class QPDecoder {
  constructor(opts) {
    opts = opts || {};
    this.decoder = opts.decoder || new TextDecoder;
    this.maxChunkSize = 100 * 1024;
    this.remainder = "";
    this.chunks = [];
  }
  decodeQPBytes(encodedBytes) {
    let buf = new ArrayBuffer(encodedBytes.length);
    let dataView = new DataView(buf);
    for (let i2 = 0, len = encodedBytes.length;i2 < len; i2++) {
      dataView.setUint8(i2, parseInt(encodedBytes[i2], 16));
    }
    return buf;
  }
  decodeChunks(str) {
    str = str.replace(SOFT_LINE_BREAK_REGEX, "");
    let list = str.split(QP_SPLIT_REGEX);
    let encodedBytes = [];
    for (let part of list) {
      if (part.charAt(0) !== "=") {
        if (encodedBytes.length) {
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
        }
        this.chunks.push(part);
        continue;
      }
      if (part.length === 3) {
        if (VALID_QP_REGEX.test(part)) {
          encodedBytes.push(part.substr(1));
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
        continue;
      }
      if (part.length > 3) {
        const firstThree = part.substr(0, 3);
        if (VALID_QP_REGEX.test(firstThree)) {
          encodedBytes.push(part.substr(1, 2));
          this.chunks.push(this.decodeQPBytes(encodedBytes));
          encodedBytes = [];
          part = part.substr(3);
          this.chunks.push(part);
        } else {
          if (encodedBytes.length) {
            this.chunks.push(this.decodeQPBytes(encodedBytes));
            encodedBytes = [];
          }
          this.chunks.push(part);
        }
      }
    }
    if (encodedBytes.length) {
      this.chunks.push(this.decodeQPBytes(encodedBytes));
      encodedBytes = [];
    }
  }
  update(buffer) {
    let str = this.decoder.decode(buffer) + `
`;
    str = this.remainder + str;
    if (str.length < this.maxChunkSize) {
      this.remainder = str;
      return;
    }
    this.remainder = "";
    let partialEnding = str.match(PARTIAL_QP_ENDING_REGEX);
    if (partialEnding) {
      if (partialEnding.index === 0) {
        this.remainder = str;
        return;
      }
      this.remainder = str.substr(partialEnding.index);
      str = str.substr(0, partialEnding.index);
    }
    this.decodeChunks(str);
  }
  finalize() {
    if (this.remainder.length) {
      this.decodeChunks(this.remainder);
      this.remainder = "";
    }
    return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
  }
}
var VALID_QP_REGEX, QP_SPLIT_REGEX, SOFT_LINE_BREAK_REGEX, PARTIAL_QP_ENDING_REGEX;
var init_qp_decoder = __esm(() => {
  init_decode_strings();
  VALID_QP_REGEX = /^=[a-f0-9]{2}$/i;
  QP_SPLIT_REGEX = /(?==[a-f0-9]{2})/i;
  SOFT_LINE_BREAK_REGEX = /=\r?\n/g;
  PARTIAL_QP_ENDING_REGEX = /=[a-fA-F0-9]?$/;
});

// node_modules/postal-mime/src/mime-node.js
class MimeNode {
  constructor(options) {
    this.options = options || {};
    this.postalMime = this.options.postalMime;
    this.root = !!this.options.parentNode;
    this.childNodes = [];
    if (this.options.parentNode) {
      this.parentNode = this.options.parentNode;
      this.depth = this.parentNode.depth + 1;
      if (this.depth > this.options.maxNestingDepth) {
        throw new Error(`Maximum MIME nesting depth of ${this.options.maxNestingDepth} levels exceeded`);
      }
      this.options.parentNode.childNodes.push(this);
    } else {
      this.depth = 0;
    }
    this.state = "header";
    this.headerLines = [];
    this.headerSize = 0;
    const parentMultipartType = this.options.parentMultipartType || null;
    const defaultContentType = parentMultipartType === "digest" ? "message/rfc822" : "text/plain";
    this.contentType = {
      value: defaultContentType,
      default: true
    };
    this.contentTransferEncoding = {
      value: "8bit"
    };
    this.contentDisposition = {
      value: ""
    };
    this.headers = [];
    this.contentDecoder = false;
  }
  setupContentDecoder(transferEncoding) {
    if (/base64/i.test(transferEncoding)) {
      this.contentDecoder = new Base64Decoder;
    } else if (/quoted-printable/i.test(transferEncoding)) {
      this.contentDecoder = new QPDecoder({ decoder: getDecoder(this.contentType.parsed.params.charset) });
    } else {
      this.contentDecoder = new PassThroughDecoder;
    }
  }
  async finalize() {
    if (this.state === "finished") {
      return;
    }
    if (this.state === "header") {
      this.processHeaders();
    }
    let boundaries = this.postalMime.boundaries;
    for (let i2 = boundaries.length - 1;i2 >= 0; i2--) {
      let boundary = boundaries[i2];
      if (boundary.node === this) {
        boundaries.splice(i2, 1);
        break;
      }
    }
    await this.finalizeChildNodes();
    this.content = this.contentDecoder ? await this.contentDecoder.finalize() : null;
    this.state = "finished";
  }
  async finalizeChildNodes() {
    for (let childNode of this.childNodes) {
      await childNode.finalize();
    }
  }
  stripComments(str) {
    let result = "";
    let depth = 0;
    let escaped = false;
    let inQuote = false;
    for (let i2 = 0;i2 < str.length; i2++) {
      const chr = str.charAt(i2);
      if (escaped) {
        if (depth === 0) {
          result += chr;
        }
        escaped = false;
        continue;
      }
      if (chr === "\\") {
        escaped = true;
        if (depth === 0) {
          result += chr;
        }
        continue;
      }
      if (chr === '"' && depth === 0) {
        inQuote = !inQuote;
        result += chr;
        continue;
      }
      if (!inQuote) {
        if (chr === "(") {
          depth++;
          continue;
        }
        if (chr === ")" && depth > 0) {
          depth--;
          continue;
        }
      }
      if (depth === 0) {
        result += chr;
      }
    }
    return result;
  }
  parseStructuredHeader(str) {
    str = this.stripComments(str);
    let response = {
      value: false,
      params: {}
    };
    let key = false;
    let value = "";
    let stage = "value";
    let quote = false;
    let escaped = false;
    let chr;
    for (let i2 = 0, len = str.length;i2 < len; i2++) {
      chr = str.charAt(i2);
      switch (stage) {
        case "key":
          if (chr === "=") {
            key = value.trim().toLowerCase();
            stage = "value";
            value = "";
            break;
          }
          value += chr;
          break;
        case "value":
          if (escaped) {
            value += chr;
          } else if (chr === "\\") {
            escaped = true;
            continue;
          } else if (quote && chr === quote) {
            quote = false;
          } else if (!quote && chr === '"') {
            quote = chr;
          } else if (!quote && chr === ";") {
            if (key === false) {
              response.value = value.trim();
            } else {
              response.params[key] = value.trim();
            }
            stage = "key";
            value = "";
          } else {
            value += chr;
          }
          escaped = false;
          break;
      }
    }
    value = value.trim();
    if (stage === "value") {
      if (key === false) {
        response.value = value;
      } else {
        response.params[key] = value;
      }
    } else if (value) {
      response.params[value.toLowerCase()] = "";
    }
    if (response.value) {
      response.value = response.value.toLowerCase();
    }
    decodeParameterValueContinuations(response);
    return response;
  }
  decodeFlowedText(str, delSp) {
    return str.split(/\r?\n/).reduce((previousValue, currentValue) => {
      if (/ $/.test(previousValue) && !/(^|\n)-- $/.test(previousValue)) {
        if (delSp) {
          return previousValue.slice(0, -1) + currentValue;
        } else {
          return previousValue + currentValue;
        }
      } else {
        return previousValue + `
` + currentValue;
      }
    }).replace(/^ /gm, "");
  }
  getTextContent() {
    if (!this.content) {
      return "";
    }
    let str = getDecoder(this.contentType.parsed.params.charset).decode(this.content);
    if (/^flowed$/i.test(this.contentType.parsed.params.format)) {
      str = this.decodeFlowedText(str, /^yes$/i.test(this.contentType.parsed.params.delsp));
    }
    return str;
  }
  processHeaders() {
    for (let i2 = this.headerLines.length - 1;i2 >= 0; i2--) {
      let line = this.headerLines[i2];
      if (i2 && /^\s/.test(line)) {
        this.headerLines[i2 - 1] += `
` + line;
        this.headerLines.splice(i2, 1);
      }
    }
    this.rawHeaderLines = [];
    for (let i2 = this.headerLines.length - 1;i2 >= 0; i2--) {
      let rawLine = this.headerLines[i2];
      let sep = rawLine.indexOf(":");
      let rawKey = sep < 0 ? rawLine.trim() : rawLine.substr(0, sep).trim();
      this.rawHeaderLines.push({
        key: rawKey.toLowerCase(),
        line: rawLine
      });
      let normalizedLine = rawLine.replace(/\s+/g, " ");
      sep = normalizedLine.indexOf(":");
      let key = sep < 0 ? normalizedLine.trim() : normalizedLine.substr(0, sep).trim();
      let value = sep < 0 ? "" : normalizedLine.substr(sep + 1).trim();
      this.headers.push({ key: key.toLowerCase(), originalKey: key, value });
      switch (key.toLowerCase()) {
        case "content-type":
          if (this.contentType.default) {
            this.contentType = { value, parsed: {} };
          }
          break;
        case "content-transfer-encoding":
          this.contentTransferEncoding = { value, parsed: {} };
          break;
        case "content-disposition":
          this.contentDisposition = { value, parsed: {} };
          break;
        case "content-id":
          this.contentId = value;
          break;
        case "content-description":
          this.contentDescription = value;
          break;
      }
    }
    this.contentType.parsed = this.parseStructuredHeader(this.contentType.value);
    this.contentType.multipart = /^multipart\//i.test(this.contentType.parsed.value) ? this.contentType.parsed.value.substr(this.contentType.parsed.value.indexOf("/") + 1) : false;
    if (this.contentType.multipart && this.contentType.parsed.params.boundary) {
      this.postalMime.boundaries.push({
        value: textEncoder.encode(this.contentType.parsed.params.boundary),
        node: this
      });
    }
    this.contentDisposition.parsed = this.parseStructuredHeader(this.contentDisposition.value);
    this.contentTransferEncoding.encoding = this.contentTransferEncoding.value.toLowerCase().split(/[^\w-]/).shift();
    this.setupContentDecoder(this.contentTransferEncoding.encoding);
  }
  feed(line) {
    switch (this.state) {
      case "header":
        if (!line.length) {
          this.state = "body";
          return this.processHeaders();
        }
        this.headerSize += line.length;
        if (this.headerSize > this.options.maxHeadersSize) {
          let error = new Error(`Maximum header size of ${this.options.maxHeadersSize} bytes exceeded`);
          throw error;
        }
        this.headerLines.push(getDecoder().decode(line));
        break;
      case "body": {
        this.contentDecoder.update(line);
      }
    }
  }
}
var init_mime_node = __esm(() => {
  init_decode_strings();
  init_pass_through_decoder();
  init_base64_decoder();
  init_qp_decoder();
});

// node_modules/postal-mime/src/html-entities.js
var htmlEntities, html_entities_default;
var init_html_entities = __esm(() => {
  htmlEntities = {
    "&AElig": "Æ",
    "&AElig;": "Æ",
    "&AMP": "&",
    "&AMP;": "&",
    "&Aacute": "Á",
    "&Aacute;": "Á",
    "&Abreve;": "Ă",
    "&Acirc": "Â",
    "&Acirc;": "Â",
    "&Acy;": "А",
    "&Afr;": "\uD835\uDD04",
    "&Agrave": "À",
    "&Agrave;": "À",
    "&Alpha;": "Α",
    "&Amacr;": "Ā",
    "&And;": "⩓",
    "&Aogon;": "Ą",
    "&Aopf;": "\uD835\uDD38",
    "&ApplyFunction;": "⁡",
    "&Aring": "Å",
    "&Aring;": "Å",
    "&Ascr;": "\uD835\uDC9C",
    "&Assign;": "≔",
    "&Atilde": "Ã",
    "&Atilde;": "Ã",
    "&Auml": "Ä",
    "&Auml;": "Ä",
    "&Backslash;": "∖",
    "&Barv;": "⫧",
    "&Barwed;": "⌆",
    "&Bcy;": "Б",
    "&Because;": "∵",
    "&Bernoullis;": "ℬ",
    "&Beta;": "Β",
    "&Bfr;": "\uD835\uDD05",
    "&Bopf;": "\uD835\uDD39",
    "&Breve;": "˘",
    "&Bscr;": "ℬ",
    "&Bumpeq;": "≎",
    "&CHcy;": "Ч",
    "&COPY": "©",
    "&COPY;": "©",
    "&Cacute;": "Ć",
    "&Cap;": "⋒",
    "&CapitalDifferentialD;": "ⅅ",
    "&Cayleys;": "ℭ",
    "&Ccaron;": "Č",
    "&Ccedil": "Ç",
    "&Ccedil;": "Ç",
    "&Ccirc;": "Ĉ",
    "&Cconint;": "∰",
    "&Cdot;": "Ċ",
    "&Cedilla;": "¸",
    "&CenterDot;": "·",
    "&Cfr;": "ℭ",
    "&Chi;": "Χ",
    "&CircleDot;": "⊙",
    "&CircleMinus;": "⊖",
    "&CirclePlus;": "⊕",
    "&CircleTimes;": "⊗",
    "&ClockwiseContourIntegral;": "∲",
    "&CloseCurlyDoubleQuote;": "”",
    "&CloseCurlyQuote;": "’",
    "&Colon;": "∷",
    "&Colone;": "⩴",
    "&Congruent;": "≡",
    "&Conint;": "∯",
    "&ContourIntegral;": "∮",
    "&Copf;": "ℂ",
    "&Coproduct;": "∐",
    "&CounterClockwiseContourIntegral;": "∳",
    "&Cross;": "⨯",
    "&Cscr;": "\uD835\uDC9E",
    "&Cup;": "⋓",
    "&CupCap;": "≍",
    "&DD;": "ⅅ",
    "&DDotrahd;": "⤑",
    "&DJcy;": "Ђ",
    "&DScy;": "Ѕ",
    "&DZcy;": "Џ",
    "&Dagger;": "‡",
    "&Darr;": "↡",
    "&Dashv;": "⫤",
    "&Dcaron;": "Ď",
    "&Dcy;": "Д",
    "&Del;": "∇",
    "&Delta;": "Δ",
    "&Dfr;": "\uD835\uDD07",
    "&DiacriticalAcute;": "´",
    "&DiacriticalDot;": "˙",
    "&DiacriticalDoubleAcute;": "˝",
    "&DiacriticalGrave;": "`",
    "&DiacriticalTilde;": "˜",
    "&Diamond;": "⋄",
    "&DifferentialD;": "ⅆ",
    "&Dopf;": "\uD835\uDD3B",
    "&Dot;": "¨",
    "&DotDot;": "⃜",
    "&DotEqual;": "≐",
    "&DoubleContourIntegral;": "∯",
    "&DoubleDot;": "¨",
    "&DoubleDownArrow;": "⇓",
    "&DoubleLeftArrow;": "⇐",
    "&DoubleLeftRightArrow;": "⇔",
    "&DoubleLeftTee;": "⫤",
    "&DoubleLongLeftArrow;": "⟸",
    "&DoubleLongLeftRightArrow;": "⟺",
    "&DoubleLongRightArrow;": "⟹",
    "&DoubleRightArrow;": "⇒",
    "&DoubleRightTee;": "⊨",
    "&DoubleUpArrow;": "⇑",
    "&DoubleUpDownArrow;": "⇕",
    "&DoubleVerticalBar;": "∥",
    "&DownArrow;": "↓",
    "&DownArrowBar;": "⤓",
    "&DownArrowUpArrow;": "⇵",
    "&DownBreve;": "̑",
    "&DownLeftRightVector;": "⥐",
    "&DownLeftTeeVector;": "⥞",
    "&DownLeftVector;": "↽",
    "&DownLeftVectorBar;": "⥖",
    "&DownRightTeeVector;": "⥟",
    "&DownRightVector;": "⇁",
    "&DownRightVectorBar;": "⥗",
    "&DownTee;": "⊤",
    "&DownTeeArrow;": "↧",
    "&Downarrow;": "⇓",
    "&Dscr;": "\uD835\uDC9F",
    "&Dstrok;": "Đ",
    "&ENG;": "Ŋ",
    "&ETH": "Ð",
    "&ETH;": "Ð",
    "&Eacute": "É",
    "&Eacute;": "É",
    "&Ecaron;": "Ě",
    "&Ecirc": "Ê",
    "&Ecirc;": "Ê",
    "&Ecy;": "Э",
    "&Edot;": "Ė",
    "&Efr;": "\uD835\uDD08",
    "&Egrave": "È",
    "&Egrave;": "È",
    "&Element;": "∈",
    "&Emacr;": "Ē",
    "&EmptySmallSquare;": "◻",
    "&EmptyVerySmallSquare;": "▫",
    "&Eogon;": "Ę",
    "&Eopf;": "\uD835\uDD3C",
    "&Epsilon;": "Ε",
    "&Equal;": "⩵",
    "&EqualTilde;": "≂",
    "&Equilibrium;": "⇌",
    "&Escr;": "ℰ",
    "&Esim;": "⩳",
    "&Eta;": "Η",
    "&Euml": "Ë",
    "&Euml;": "Ë",
    "&Exists;": "∃",
    "&ExponentialE;": "ⅇ",
    "&Fcy;": "Ф",
    "&Ffr;": "\uD835\uDD09",
    "&FilledSmallSquare;": "◼",
    "&FilledVerySmallSquare;": "▪",
    "&Fopf;": "\uD835\uDD3D",
    "&ForAll;": "∀",
    "&Fouriertrf;": "ℱ",
    "&Fscr;": "ℱ",
    "&GJcy;": "Ѓ",
    "&GT": ">",
    "&GT;": ">",
    "&Gamma;": "Γ",
    "&Gammad;": "Ϝ",
    "&Gbreve;": "Ğ",
    "&Gcedil;": "Ģ",
    "&Gcirc;": "Ĝ",
    "&Gcy;": "Г",
    "&Gdot;": "Ġ",
    "&Gfr;": "\uD835\uDD0A",
    "&Gg;": "⋙",
    "&Gopf;": "\uD835\uDD3E",
    "&GreaterEqual;": "≥",
    "&GreaterEqualLess;": "⋛",
    "&GreaterFullEqual;": "≧",
    "&GreaterGreater;": "⪢",
    "&GreaterLess;": "≷",
    "&GreaterSlantEqual;": "⩾",
    "&GreaterTilde;": "≳",
    "&Gscr;": "\uD835\uDCA2",
    "&Gt;": "≫",
    "&HARDcy;": "Ъ",
    "&Hacek;": "ˇ",
    "&Hat;": "^",
    "&Hcirc;": "Ĥ",
    "&Hfr;": "ℌ",
    "&HilbertSpace;": "ℋ",
    "&Hopf;": "ℍ",
    "&HorizontalLine;": "─",
    "&Hscr;": "ℋ",
    "&Hstrok;": "Ħ",
    "&HumpDownHump;": "≎",
    "&HumpEqual;": "≏",
    "&IEcy;": "Е",
    "&IJlig;": "Ĳ",
    "&IOcy;": "Ё",
    "&Iacute": "Í",
    "&Iacute;": "Í",
    "&Icirc": "Î",
    "&Icirc;": "Î",
    "&Icy;": "И",
    "&Idot;": "İ",
    "&Ifr;": "ℑ",
    "&Igrave": "Ì",
    "&Igrave;": "Ì",
    "&Im;": "ℑ",
    "&Imacr;": "Ī",
    "&ImaginaryI;": "ⅈ",
    "&Implies;": "⇒",
    "&Int;": "∬",
    "&Integral;": "∫",
    "&Intersection;": "⋂",
    "&InvisibleComma;": "⁣",
    "&InvisibleTimes;": "⁢",
    "&Iogon;": "Į",
    "&Iopf;": "\uD835\uDD40",
    "&Iota;": "Ι",
    "&Iscr;": "ℐ",
    "&Itilde;": "Ĩ",
    "&Iukcy;": "І",
    "&Iuml": "Ï",
    "&Iuml;": "Ï",
    "&Jcirc;": "Ĵ",
    "&Jcy;": "Й",
    "&Jfr;": "\uD835\uDD0D",
    "&Jopf;": "\uD835\uDD41",
    "&Jscr;": "\uD835\uDCA5",
    "&Jsercy;": "Ј",
    "&Jukcy;": "Є",
    "&KHcy;": "Х",
    "&KJcy;": "Ќ",
    "&Kappa;": "Κ",
    "&Kcedil;": "Ķ",
    "&Kcy;": "К",
    "&Kfr;": "\uD835\uDD0E",
    "&Kopf;": "\uD835\uDD42",
    "&Kscr;": "\uD835\uDCA6",
    "&LJcy;": "Љ",
    "&LT": "<",
    "&LT;": "<",
    "&Lacute;": "Ĺ",
    "&Lambda;": "Λ",
    "&Lang;": "⟪",
    "&Laplacetrf;": "ℒ",
    "&Larr;": "↞",
    "&Lcaron;": "Ľ",
    "&Lcedil;": "Ļ",
    "&Lcy;": "Л",
    "&LeftAngleBracket;": "⟨",
    "&LeftArrow;": "←",
    "&LeftArrowBar;": "⇤",
    "&LeftArrowRightArrow;": "⇆",
    "&LeftCeiling;": "⌈",
    "&LeftDoubleBracket;": "⟦",
    "&LeftDownTeeVector;": "⥡",
    "&LeftDownVector;": "⇃",
    "&LeftDownVectorBar;": "⥙",
    "&LeftFloor;": "⌊",
    "&LeftRightArrow;": "↔",
    "&LeftRightVector;": "⥎",
    "&LeftTee;": "⊣",
    "&LeftTeeArrow;": "↤",
    "&LeftTeeVector;": "⥚",
    "&LeftTriangle;": "⊲",
    "&LeftTriangleBar;": "⧏",
    "&LeftTriangleEqual;": "⊴",
    "&LeftUpDownVector;": "⥑",
    "&LeftUpTeeVector;": "⥠",
    "&LeftUpVector;": "↿",
    "&LeftUpVectorBar;": "⥘",
    "&LeftVector;": "↼",
    "&LeftVectorBar;": "⥒",
    "&Leftarrow;": "⇐",
    "&Leftrightarrow;": "⇔",
    "&LessEqualGreater;": "⋚",
    "&LessFullEqual;": "≦",
    "&LessGreater;": "≶",
    "&LessLess;": "⪡",
    "&LessSlantEqual;": "⩽",
    "&LessTilde;": "≲",
    "&Lfr;": "\uD835\uDD0F",
    "&Ll;": "⋘",
    "&Lleftarrow;": "⇚",
    "&Lmidot;": "Ŀ",
    "&LongLeftArrow;": "⟵",
    "&LongLeftRightArrow;": "⟷",
    "&LongRightArrow;": "⟶",
    "&Longleftarrow;": "⟸",
    "&Longleftrightarrow;": "⟺",
    "&Longrightarrow;": "⟹",
    "&Lopf;": "\uD835\uDD43",
    "&LowerLeftArrow;": "↙",
    "&LowerRightArrow;": "↘",
    "&Lscr;": "ℒ",
    "&Lsh;": "↰",
    "&Lstrok;": "Ł",
    "&Lt;": "≪",
    "&Map;": "⤅",
    "&Mcy;": "М",
    "&MediumSpace;": " ",
    "&Mellintrf;": "ℳ",
    "&Mfr;": "\uD835\uDD10",
    "&MinusPlus;": "∓",
    "&Mopf;": "\uD835\uDD44",
    "&Mscr;": "ℳ",
    "&Mu;": "Μ",
    "&NJcy;": "Њ",
    "&Nacute;": "Ń",
    "&Ncaron;": "Ň",
    "&Ncedil;": "Ņ",
    "&Ncy;": "Н",
    "&NegativeMediumSpace;": "​",
    "&NegativeThickSpace;": "​",
    "&NegativeThinSpace;": "​",
    "&NegativeVeryThinSpace;": "​",
    "&NestedGreaterGreater;": "≫",
    "&NestedLessLess;": "≪",
    "&NewLine;": `
`,
    "&Nfr;": "\uD835\uDD11",
    "&NoBreak;": "⁠",
    "&NonBreakingSpace;": " ",
    "&Nopf;": "ℕ",
    "&Not;": "⫬",
    "&NotCongruent;": "≢",
    "&NotCupCap;": "≭",
    "&NotDoubleVerticalBar;": "∦",
    "&NotElement;": "∉",
    "&NotEqual;": "≠",
    "&NotEqualTilde;": "≂̸",
    "&NotExists;": "∄",
    "&NotGreater;": "≯",
    "&NotGreaterEqual;": "≱",
    "&NotGreaterFullEqual;": "≧̸",
    "&NotGreaterGreater;": "≫̸",
    "&NotGreaterLess;": "≹",
    "&NotGreaterSlantEqual;": "⩾̸",
    "&NotGreaterTilde;": "≵",
    "&NotHumpDownHump;": "≎̸",
    "&NotHumpEqual;": "≏̸",
    "&NotLeftTriangle;": "⋪",
    "&NotLeftTriangleBar;": "⧏̸",
    "&NotLeftTriangleEqual;": "⋬",
    "&NotLess;": "≮",
    "&NotLessEqual;": "≰",
    "&NotLessGreater;": "≸",
    "&NotLessLess;": "≪̸",
    "&NotLessSlantEqual;": "⩽̸",
    "&NotLessTilde;": "≴",
    "&NotNestedGreaterGreater;": "⪢̸",
    "&NotNestedLessLess;": "⪡̸",
    "&NotPrecedes;": "⊀",
    "&NotPrecedesEqual;": "⪯̸",
    "&NotPrecedesSlantEqual;": "⋠",
    "&NotReverseElement;": "∌",
    "&NotRightTriangle;": "⋫",
    "&NotRightTriangleBar;": "⧐̸",
    "&NotRightTriangleEqual;": "⋭",
    "&NotSquareSubset;": "⊏̸",
    "&NotSquareSubsetEqual;": "⋢",
    "&NotSquareSuperset;": "⊐̸",
    "&NotSquareSupersetEqual;": "⋣",
    "&NotSubset;": "⊂⃒",
    "&NotSubsetEqual;": "⊈",
    "&NotSucceeds;": "⊁",
    "&NotSucceedsEqual;": "⪰̸",
    "&NotSucceedsSlantEqual;": "⋡",
    "&NotSucceedsTilde;": "≿̸",
    "&NotSuperset;": "⊃⃒",
    "&NotSupersetEqual;": "⊉",
    "&NotTilde;": "≁",
    "&NotTildeEqual;": "≄",
    "&NotTildeFullEqual;": "≇",
    "&NotTildeTilde;": "≉",
    "&NotVerticalBar;": "∤",
    "&Nscr;": "\uD835\uDCA9",
    "&Ntilde": "Ñ",
    "&Ntilde;": "Ñ",
    "&Nu;": "Ν",
    "&OElig;": "Œ",
    "&Oacute": "Ó",
    "&Oacute;": "Ó",
    "&Ocirc": "Ô",
    "&Ocirc;": "Ô",
    "&Ocy;": "О",
    "&Odblac;": "Ő",
    "&Ofr;": "\uD835\uDD12",
    "&Ograve": "Ò",
    "&Ograve;": "Ò",
    "&Omacr;": "Ō",
    "&Omega;": "Ω",
    "&Omicron;": "Ο",
    "&Oopf;": "\uD835\uDD46",
    "&OpenCurlyDoubleQuote;": "“",
    "&OpenCurlyQuote;": "‘",
    "&Or;": "⩔",
    "&Oscr;": "\uD835\uDCAA",
    "&Oslash": "Ø",
    "&Oslash;": "Ø",
    "&Otilde": "Õ",
    "&Otilde;": "Õ",
    "&Otimes;": "⨷",
    "&Ouml": "Ö",
    "&Ouml;": "Ö",
    "&OverBar;": "‾",
    "&OverBrace;": "⏞",
    "&OverBracket;": "⎴",
    "&OverParenthesis;": "⏜",
    "&PartialD;": "∂",
    "&Pcy;": "П",
    "&Pfr;": "\uD835\uDD13",
    "&Phi;": "Φ",
    "&Pi;": "Π",
    "&PlusMinus;": "±",
    "&Poincareplane;": "ℌ",
    "&Popf;": "ℙ",
    "&Pr;": "⪻",
    "&Precedes;": "≺",
    "&PrecedesEqual;": "⪯",
    "&PrecedesSlantEqual;": "≼",
    "&PrecedesTilde;": "≾",
    "&Prime;": "″",
    "&Product;": "∏",
    "&Proportion;": "∷",
    "&Proportional;": "∝",
    "&Pscr;": "\uD835\uDCAB",
    "&Psi;": "Ψ",
    "&QUOT": '"',
    "&QUOT;": '"',
    "&Qfr;": "\uD835\uDD14",
    "&Qopf;": "ℚ",
    "&Qscr;": "\uD835\uDCAC",
    "&RBarr;": "⤐",
    "&REG": "®",
    "&REG;": "®",
    "&Racute;": "Ŕ",
    "&Rang;": "⟫",
    "&Rarr;": "↠",
    "&Rarrtl;": "⤖",
    "&Rcaron;": "Ř",
    "&Rcedil;": "Ŗ",
    "&Rcy;": "Р",
    "&Re;": "ℜ",
    "&ReverseElement;": "∋",
    "&ReverseEquilibrium;": "⇋",
    "&ReverseUpEquilibrium;": "⥯",
    "&Rfr;": "ℜ",
    "&Rho;": "Ρ",
    "&RightAngleBracket;": "⟩",
    "&RightArrow;": "→",
    "&RightArrowBar;": "⇥",
    "&RightArrowLeftArrow;": "⇄",
    "&RightCeiling;": "⌉",
    "&RightDoubleBracket;": "⟧",
    "&RightDownTeeVector;": "⥝",
    "&RightDownVector;": "⇂",
    "&RightDownVectorBar;": "⥕",
    "&RightFloor;": "⌋",
    "&RightTee;": "⊢",
    "&RightTeeArrow;": "↦",
    "&RightTeeVector;": "⥛",
    "&RightTriangle;": "⊳",
    "&RightTriangleBar;": "⧐",
    "&RightTriangleEqual;": "⊵",
    "&RightUpDownVector;": "⥏",
    "&RightUpTeeVector;": "⥜",
    "&RightUpVector;": "↾",
    "&RightUpVectorBar;": "⥔",
    "&RightVector;": "⇀",
    "&RightVectorBar;": "⥓",
    "&Rightarrow;": "⇒",
    "&Ropf;": "ℝ",
    "&RoundImplies;": "⥰",
    "&Rrightarrow;": "⇛",
    "&Rscr;": "ℛ",
    "&Rsh;": "↱",
    "&RuleDelayed;": "⧴",
    "&SHCHcy;": "Щ",
    "&SHcy;": "Ш",
    "&SOFTcy;": "Ь",
    "&Sacute;": "Ś",
    "&Sc;": "⪼",
    "&Scaron;": "Š",
    "&Scedil;": "Ş",
    "&Scirc;": "Ŝ",
    "&Scy;": "С",
    "&Sfr;": "\uD835\uDD16",
    "&ShortDownArrow;": "↓",
    "&ShortLeftArrow;": "←",
    "&ShortRightArrow;": "→",
    "&ShortUpArrow;": "↑",
    "&Sigma;": "Σ",
    "&SmallCircle;": "∘",
    "&Sopf;": "\uD835\uDD4A",
    "&Sqrt;": "√",
    "&Square;": "□",
    "&SquareIntersection;": "⊓",
    "&SquareSubset;": "⊏",
    "&SquareSubsetEqual;": "⊑",
    "&SquareSuperset;": "⊐",
    "&SquareSupersetEqual;": "⊒",
    "&SquareUnion;": "⊔",
    "&Sscr;": "\uD835\uDCAE",
    "&Star;": "⋆",
    "&Sub;": "⋐",
    "&Subset;": "⋐",
    "&SubsetEqual;": "⊆",
    "&Succeeds;": "≻",
    "&SucceedsEqual;": "⪰",
    "&SucceedsSlantEqual;": "≽",
    "&SucceedsTilde;": "≿",
    "&SuchThat;": "∋",
    "&Sum;": "∑",
    "&Sup;": "⋑",
    "&Superset;": "⊃",
    "&SupersetEqual;": "⊇",
    "&Supset;": "⋑",
    "&THORN": "Þ",
    "&THORN;": "Þ",
    "&TRADE;": "™",
    "&TSHcy;": "Ћ",
    "&TScy;": "Ц",
    "&Tab;": "\t",
    "&Tau;": "Τ",
    "&Tcaron;": "Ť",
    "&Tcedil;": "Ţ",
    "&Tcy;": "Т",
    "&Tfr;": "\uD835\uDD17",
    "&Therefore;": "∴",
    "&Theta;": "Θ",
    "&ThickSpace;": "  ",
    "&ThinSpace;": " ",
    "&Tilde;": "∼",
    "&TildeEqual;": "≃",
    "&TildeFullEqual;": "≅",
    "&TildeTilde;": "≈",
    "&Topf;": "\uD835\uDD4B",
    "&TripleDot;": "⃛",
    "&Tscr;": "\uD835\uDCAF",
    "&Tstrok;": "Ŧ",
    "&Uacute": "Ú",
    "&Uacute;": "Ú",
    "&Uarr;": "↟",
    "&Uarrocir;": "⥉",
    "&Ubrcy;": "Ў",
    "&Ubreve;": "Ŭ",
    "&Ucirc": "Û",
    "&Ucirc;": "Û",
    "&Ucy;": "У",
    "&Udblac;": "Ű",
    "&Ufr;": "\uD835\uDD18",
    "&Ugrave": "Ù",
    "&Ugrave;": "Ù",
    "&Umacr;": "Ū",
    "&UnderBar;": "_",
    "&UnderBrace;": "⏟",
    "&UnderBracket;": "⎵",
    "&UnderParenthesis;": "⏝",
    "&Union;": "⋃",
    "&UnionPlus;": "⊎",
    "&Uogon;": "Ų",
    "&Uopf;": "\uD835\uDD4C",
    "&UpArrow;": "↑",
    "&UpArrowBar;": "⤒",
    "&UpArrowDownArrow;": "⇅",
    "&UpDownArrow;": "↕",
    "&UpEquilibrium;": "⥮",
    "&UpTee;": "⊥",
    "&UpTeeArrow;": "↥",
    "&Uparrow;": "⇑",
    "&Updownarrow;": "⇕",
    "&UpperLeftArrow;": "↖",
    "&UpperRightArrow;": "↗",
    "&Upsi;": "ϒ",
    "&Upsilon;": "Υ",
    "&Uring;": "Ů",
    "&Uscr;": "\uD835\uDCB0",
    "&Utilde;": "Ũ",
    "&Uuml": "Ü",
    "&Uuml;": "Ü",
    "&VDash;": "⊫",
    "&Vbar;": "⫫",
    "&Vcy;": "В",
    "&Vdash;": "⊩",
    "&Vdashl;": "⫦",
    "&Vee;": "⋁",
    "&Verbar;": "‖",
    "&Vert;": "‖",
    "&VerticalBar;": "∣",
    "&VerticalLine;": "|",
    "&VerticalSeparator;": "❘",
    "&VerticalTilde;": "≀",
    "&VeryThinSpace;": " ",
    "&Vfr;": "\uD835\uDD19",
    "&Vopf;": "\uD835\uDD4D",
    "&Vscr;": "\uD835\uDCB1",
    "&Vvdash;": "⊪",
    "&Wcirc;": "Ŵ",
    "&Wedge;": "⋀",
    "&Wfr;": "\uD835\uDD1A",
    "&Wopf;": "\uD835\uDD4E",
    "&Wscr;": "\uD835\uDCB2",
    "&Xfr;": "\uD835\uDD1B",
    "&Xi;": "Ξ",
    "&Xopf;": "\uD835\uDD4F",
    "&Xscr;": "\uD835\uDCB3",
    "&YAcy;": "Я",
    "&YIcy;": "Ї",
    "&YUcy;": "Ю",
    "&Yacute": "Ý",
    "&Yacute;": "Ý",
    "&Ycirc;": "Ŷ",
    "&Ycy;": "Ы",
    "&Yfr;": "\uD835\uDD1C",
    "&Yopf;": "\uD835\uDD50",
    "&Yscr;": "\uD835\uDCB4",
    "&Yuml;": "Ÿ",
    "&ZHcy;": "Ж",
    "&Zacute;": "Ź",
    "&Zcaron;": "Ž",
    "&Zcy;": "З",
    "&Zdot;": "Ż",
    "&ZeroWidthSpace;": "​",
    "&Zeta;": "Ζ",
    "&Zfr;": "ℨ",
    "&Zopf;": "ℤ",
    "&Zscr;": "\uD835\uDCB5",
    "&aacute": "á",
    "&aacute;": "á",
    "&abreve;": "ă",
    "&ac;": "∾",
    "&acE;": "∾̳",
    "&acd;": "∿",
    "&acirc": "â",
    "&acirc;": "â",
    "&acute": "´",
    "&acute;": "´",
    "&acy;": "а",
    "&aelig": "æ",
    "&aelig;": "æ",
    "&af;": "⁡",
    "&afr;": "\uD835\uDD1E",
    "&agrave": "à",
    "&agrave;": "à",
    "&alefsym;": "ℵ",
    "&aleph;": "ℵ",
    "&alpha;": "α",
    "&amacr;": "ā",
    "&amalg;": "⨿",
    "&amp": "&",
    "&amp;": "&",
    "&and;": "∧",
    "&andand;": "⩕",
    "&andd;": "⩜",
    "&andslope;": "⩘",
    "&andv;": "⩚",
    "&ang;": "∠",
    "&ange;": "⦤",
    "&angle;": "∠",
    "&angmsd;": "∡",
    "&angmsdaa;": "⦨",
    "&angmsdab;": "⦩",
    "&angmsdac;": "⦪",
    "&angmsdad;": "⦫",
    "&angmsdae;": "⦬",
    "&angmsdaf;": "⦭",
    "&angmsdag;": "⦮",
    "&angmsdah;": "⦯",
    "&angrt;": "∟",
    "&angrtvb;": "⊾",
    "&angrtvbd;": "⦝",
    "&angsph;": "∢",
    "&angst;": "Å",
    "&angzarr;": "⍼",
    "&aogon;": "ą",
    "&aopf;": "\uD835\uDD52",
    "&ap;": "≈",
    "&apE;": "⩰",
    "&apacir;": "⩯",
    "&ape;": "≊",
    "&apid;": "≋",
    "&apos;": "'",
    "&approx;": "≈",
    "&approxeq;": "≊",
    "&aring": "å",
    "&aring;": "å",
    "&ascr;": "\uD835\uDCB6",
    "&ast;": "*",
    "&asymp;": "≈",
    "&asympeq;": "≍",
    "&atilde": "ã",
    "&atilde;": "ã",
    "&auml": "ä",
    "&auml;": "ä",
    "&awconint;": "∳",
    "&awint;": "⨑",
    "&bNot;": "⫭",
    "&backcong;": "≌",
    "&backepsilon;": "϶",
    "&backprime;": "‵",
    "&backsim;": "∽",
    "&backsimeq;": "⋍",
    "&barvee;": "⊽",
    "&barwed;": "⌅",
    "&barwedge;": "⌅",
    "&bbrk;": "⎵",
    "&bbrktbrk;": "⎶",
    "&bcong;": "≌",
    "&bcy;": "б",
    "&bdquo;": "„",
    "&becaus;": "∵",
    "&because;": "∵",
    "&bemptyv;": "⦰",
    "&bepsi;": "϶",
    "&bernou;": "ℬ",
    "&beta;": "β",
    "&beth;": "ℶ",
    "&between;": "≬",
    "&bfr;": "\uD835\uDD1F",
    "&bigcap;": "⋂",
    "&bigcirc;": "◯",
    "&bigcup;": "⋃",
    "&bigodot;": "⨀",
    "&bigoplus;": "⨁",
    "&bigotimes;": "⨂",
    "&bigsqcup;": "⨆",
    "&bigstar;": "★",
    "&bigtriangledown;": "▽",
    "&bigtriangleup;": "△",
    "&biguplus;": "⨄",
    "&bigvee;": "⋁",
    "&bigwedge;": "⋀",
    "&bkarow;": "⤍",
    "&blacklozenge;": "⧫",
    "&blacksquare;": "▪",
    "&blacktriangle;": "▴",
    "&blacktriangledown;": "▾",
    "&blacktriangleleft;": "◂",
    "&blacktriangleright;": "▸",
    "&blank;": "␣",
    "&blk12;": "▒",
    "&blk14;": "░",
    "&blk34;": "▓",
    "&block;": "█",
    "&bne;": "=⃥",
    "&bnequiv;": "≡⃥",
    "&bnot;": "⌐",
    "&bopf;": "\uD835\uDD53",
    "&bot;": "⊥",
    "&bottom;": "⊥",
    "&bowtie;": "⋈",
    "&boxDL;": "╗",
    "&boxDR;": "╔",
    "&boxDl;": "╖",
    "&boxDr;": "╓",
    "&boxH;": "═",
    "&boxHD;": "╦",
    "&boxHU;": "╩",
    "&boxHd;": "╤",
    "&boxHu;": "╧",
    "&boxUL;": "╝",
    "&boxUR;": "╚",
    "&boxUl;": "╜",
    "&boxUr;": "╙",
    "&boxV;": "║",
    "&boxVH;": "╬",
    "&boxVL;": "╣",
    "&boxVR;": "╠",
    "&boxVh;": "╫",
    "&boxVl;": "╢",
    "&boxVr;": "╟",
    "&boxbox;": "⧉",
    "&boxdL;": "╕",
    "&boxdR;": "╒",
    "&boxdl;": "┐",
    "&boxdr;": "┌",
    "&boxh;": "─",
    "&boxhD;": "╥",
    "&boxhU;": "╨",
    "&boxhd;": "┬",
    "&boxhu;": "┴",
    "&boxminus;": "⊟",
    "&boxplus;": "⊞",
    "&boxtimes;": "⊠",
    "&boxuL;": "╛",
    "&boxuR;": "╘",
    "&boxul;": "┘",
    "&boxur;": "└",
    "&boxv;": "│",
    "&boxvH;": "╪",
    "&boxvL;": "╡",
    "&boxvR;": "╞",
    "&boxvh;": "┼",
    "&boxvl;": "┤",
    "&boxvr;": "├",
    "&bprime;": "‵",
    "&breve;": "˘",
    "&brvbar": "¦",
    "&brvbar;": "¦",
    "&bscr;": "\uD835\uDCB7",
    "&bsemi;": "⁏",
    "&bsim;": "∽",
    "&bsime;": "⋍",
    "&bsol;": "\\",
    "&bsolb;": "⧅",
    "&bsolhsub;": "⟈",
    "&bull;": "•",
    "&bullet;": "•",
    "&bump;": "≎",
    "&bumpE;": "⪮",
    "&bumpe;": "≏",
    "&bumpeq;": "≏",
    "&cacute;": "ć",
    "&cap;": "∩",
    "&capand;": "⩄",
    "&capbrcup;": "⩉",
    "&capcap;": "⩋",
    "&capcup;": "⩇",
    "&capdot;": "⩀",
    "&caps;": "∩︀",
    "&caret;": "⁁",
    "&caron;": "ˇ",
    "&ccaps;": "⩍",
    "&ccaron;": "č",
    "&ccedil": "ç",
    "&ccedil;": "ç",
    "&ccirc;": "ĉ",
    "&ccups;": "⩌",
    "&ccupssm;": "⩐",
    "&cdot;": "ċ",
    "&cedil": "¸",
    "&cedil;": "¸",
    "&cemptyv;": "⦲",
    "&cent": "¢",
    "&cent;": "¢",
    "&centerdot;": "·",
    "&cfr;": "\uD835\uDD20",
    "&chcy;": "ч",
    "&check;": "✓",
    "&checkmark;": "✓",
    "&chi;": "χ",
    "&cir;": "○",
    "&cirE;": "⧃",
    "&circ;": "ˆ",
    "&circeq;": "≗",
    "&circlearrowleft;": "↺",
    "&circlearrowright;": "↻",
    "&circledR;": "®",
    "&circledS;": "Ⓢ",
    "&circledast;": "⊛",
    "&circledcirc;": "⊚",
    "&circleddash;": "⊝",
    "&cire;": "≗",
    "&cirfnint;": "⨐",
    "&cirmid;": "⫯",
    "&cirscir;": "⧂",
    "&clubs;": "♣",
    "&clubsuit;": "♣",
    "&colon;": ":",
    "&colone;": "≔",
    "&coloneq;": "≔",
    "&comma;": ",",
    "&commat;": "@",
    "&comp;": "∁",
    "&compfn;": "∘",
    "&complement;": "∁",
    "&complexes;": "ℂ",
    "&cong;": "≅",
    "&congdot;": "⩭",
    "&conint;": "∮",
    "&copf;": "\uD835\uDD54",
    "&coprod;": "∐",
    "&copy": "©",
    "&copy;": "©",
    "&copysr;": "℗",
    "&crarr;": "↵",
    "&cross;": "✗",
    "&cscr;": "\uD835\uDCB8",
    "&csub;": "⫏",
    "&csube;": "⫑",
    "&csup;": "⫐",
    "&csupe;": "⫒",
    "&ctdot;": "⋯",
    "&cudarrl;": "⤸",
    "&cudarrr;": "⤵",
    "&cuepr;": "⋞",
    "&cuesc;": "⋟",
    "&cularr;": "↶",
    "&cularrp;": "⤽",
    "&cup;": "∪",
    "&cupbrcap;": "⩈",
    "&cupcap;": "⩆",
    "&cupcup;": "⩊",
    "&cupdot;": "⊍",
    "&cupor;": "⩅",
    "&cups;": "∪︀",
    "&curarr;": "↷",
    "&curarrm;": "⤼",
    "&curlyeqprec;": "⋞",
    "&curlyeqsucc;": "⋟",
    "&curlyvee;": "⋎",
    "&curlywedge;": "⋏",
    "&curren": "¤",
    "&curren;": "¤",
    "&curvearrowleft;": "↶",
    "&curvearrowright;": "↷",
    "&cuvee;": "⋎",
    "&cuwed;": "⋏",
    "&cwconint;": "∲",
    "&cwint;": "∱",
    "&cylcty;": "⌭",
    "&dArr;": "⇓",
    "&dHar;": "⥥",
    "&dagger;": "†",
    "&daleth;": "ℸ",
    "&darr;": "↓",
    "&dash;": "‐",
    "&dashv;": "⊣",
    "&dbkarow;": "⤏",
    "&dblac;": "˝",
    "&dcaron;": "ď",
    "&dcy;": "д",
    "&dd;": "ⅆ",
    "&ddagger;": "‡",
    "&ddarr;": "⇊",
    "&ddotseq;": "⩷",
    "&deg": "°",
    "&deg;": "°",
    "&delta;": "δ",
    "&demptyv;": "⦱",
    "&dfisht;": "⥿",
    "&dfr;": "\uD835\uDD21",
    "&dharl;": "⇃",
    "&dharr;": "⇂",
    "&diam;": "⋄",
    "&diamond;": "⋄",
    "&diamondsuit;": "♦",
    "&diams;": "♦",
    "&die;": "¨",
    "&digamma;": "ϝ",
    "&disin;": "⋲",
    "&div;": "÷",
    "&divide": "÷",
    "&divide;": "÷",
    "&divideontimes;": "⋇",
    "&divonx;": "⋇",
    "&djcy;": "ђ",
    "&dlcorn;": "⌞",
    "&dlcrop;": "⌍",
    "&dollar;": "$",
    "&dopf;": "\uD835\uDD55",
    "&dot;": "˙",
    "&doteq;": "≐",
    "&doteqdot;": "≑",
    "&dotminus;": "∸",
    "&dotplus;": "∔",
    "&dotsquare;": "⊡",
    "&doublebarwedge;": "⌆",
    "&downarrow;": "↓",
    "&downdownarrows;": "⇊",
    "&downharpoonleft;": "⇃",
    "&downharpoonright;": "⇂",
    "&drbkarow;": "⤐",
    "&drcorn;": "⌟",
    "&drcrop;": "⌌",
    "&dscr;": "\uD835\uDCB9",
    "&dscy;": "ѕ",
    "&dsol;": "⧶",
    "&dstrok;": "đ",
    "&dtdot;": "⋱",
    "&dtri;": "▿",
    "&dtrif;": "▾",
    "&duarr;": "⇵",
    "&duhar;": "⥯",
    "&dwangle;": "⦦",
    "&dzcy;": "џ",
    "&dzigrarr;": "⟿",
    "&eDDot;": "⩷",
    "&eDot;": "≑",
    "&eacute": "é",
    "&eacute;": "é",
    "&easter;": "⩮",
    "&ecaron;": "ě",
    "&ecir;": "≖",
    "&ecirc": "ê",
    "&ecirc;": "ê",
    "&ecolon;": "≕",
    "&ecy;": "э",
    "&edot;": "ė",
    "&ee;": "ⅇ",
    "&efDot;": "≒",
    "&efr;": "\uD835\uDD22",
    "&eg;": "⪚",
    "&egrave": "è",
    "&egrave;": "è",
    "&egs;": "⪖",
    "&egsdot;": "⪘",
    "&el;": "⪙",
    "&elinters;": "⏧",
    "&ell;": "ℓ",
    "&els;": "⪕",
    "&elsdot;": "⪗",
    "&emacr;": "ē",
    "&empty;": "∅",
    "&emptyset;": "∅",
    "&emptyv;": "∅",
    "&emsp13;": " ",
    "&emsp14;": " ",
    "&emsp;": " ",
    "&eng;": "ŋ",
    "&ensp;": " ",
    "&eogon;": "ę",
    "&eopf;": "\uD835\uDD56",
    "&epar;": "⋕",
    "&eparsl;": "⧣",
    "&eplus;": "⩱",
    "&epsi;": "ε",
    "&epsilon;": "ε",
    "&epsiv;": "ϵ",
    "&eqcirc;": "≖",
    "&eqcolon;": "≕",
    "&eqsim;": "≂",
    "&eqslantgtr;": "⪖",
    "&eqslantless;": "⪕",
    "&equals;": "=",
    "&equest;": "≟",
    "&equiv;": "≡",
    "&equivDD;": "⩸",
    "&eqvparsl;": "⧥",
    "&erDot;": "≓",
    "&erarr;": "⥱",
    "&escr;": "ℯ",
    "&esdot;": "≐",
    "&esim;": "≂",
    "&eta;": "η",
    "&eth": "ð",
    "&eth;": "ð",
    "&euml": "ë",
    "&euml;": "ë",
    "&euro;": "€",
    "&excl;": "!",
    "&exist;": "∃",
    "&expectation;": "ℰ",
    "&exponentiale;": "ⅇ",
    "&fallingdotseq;": "≒",
    "&fcy;": "ф",
    "&female;": "♀",
    "&ffilig;": "ﬃ",
    "&fflig;": "ﬀ",
    "&ffllig;": "ﬄ",
    "&ffr;": "\uD835\uDD23",
    "&filig;": "ﬁ",
    "&fjlig;": "fj",
    "&flat;": "♭",
    "&fllig;": "ﬂ",
    "&fltns;": "▱",
    "&fnof;": "ƒ",
    "&fopf;": "\uD835\uDD57",
    "&forall;": "∀",
    "&fork;": "⋔",
    "&forkv;": "⫙",
    "&fpartint;": "⨍",
    "&frac12": "½",
    "&frac12;": "½",
    "&frac13;": "⅓",
    "&frac14": "¼",
    "&frac14;": "¼",
    "&frac15;": "⅕",
    "&frac16;": "⅙",
    "&frac18;": "⅛",
    "&frac23;": "⅔",
    "&frac25;": "⅖",
    "&frac34": "¾",
    "&frac34;": "¾",
    "&frac35;": "⅗",
    "&frac38;": "⅜",
    "&frac45;": "⅘",
    "&frac56;": "⅚",
    "&frac58;": "⅝",
    "&frac78;": "⅞",
    "&frasl;": "⁄",
    "&frown;": "⌢",
    "&fscr;": "\uD835\uDCBB",
    "&gE;": "≧",
    "&gEl;": "⪌",
    "&gacute;": "ǵ",
    "&gamma;": "γ",
    "&gammad;": "ϝ",
    "&gap;": "⪆",
    "&gbreve;": "ğ",
    "&gcirc;": "ĝ",
    "&gcy;": "г",
    "&gdot;": "ġ",
    "&ge;": "≥",
    "&gel;": "⋛",
    "&geq;": "≥",
    "&geqq;": "≧",
    "&geqslant;": "⩾",
    "&ges;": "⩾",
    "&gescc;": "⪩",
    "&gesdot;": "⪀",
    "&gesdoto;": "⪂",
    "&gesdotol;": "⪄",
    "&gesl;": "⋛︀",
    "&gesles;": "⪔",
    "&gfr;": "\uD835\uDD24",
    "&gg;": "≫",
    "&ggg;": "⋙",
    "&gimel;": "ℷ",
    "&gjcy;": "ѓ",
    "&gl;": "≷",
    "&glE;": "⪒",
    "&gla;": "⪥",
    "&glj;": "⪤",
    "&gnE;": "≩",
    "&gnap;": "⪊",
    "&gnapprox;": "⪊",
    "&gne;": "⪈",
    "&gneq;": "⪈",
    "&gneqq;": "≩",
    "&gnsim;": "⋧",
    "&gopf;": "\uD835\uDD58",
    "&grave;": "`",
    "&gscr;": "ℊ",
    "&gsim;": "≳",
    "&gsime;": "⪎",
    "&gsiml;": "⪐",
    "&gt": ">",
    "&gt;": ">",
    "&gtcc;": "⪧",
    "&gtcir;": "⩺",
    "&gtdot;": "⋗",
    "&gtlPar;": "⦕",
    "&gtquest;": "⩼",
    "&gtrapprox;": "⪆",
    "&gtrarr;": "⥸",
    "&gtrdot;": "⋗",
    "&gtreqless;": "⋛",
    "&gtreqqless;": "⪌",
    "&gtrless;": "≷",
    "&gtrsim;": "≳",
    "&gvertneqq;": "≩︀",
    "&gvnE;": "≩︀",
    "&hArr;": "⇔",
    "&hairsp;": " ",
    "&half;": "½",
    "&hamilt;": "ℋ",
    "&hardcy;": "ъ",
    "&harr;": "↔",
    "&harrcir;": "⥈",
    "&harrw;": "↭",
    "&hbar;": "ℏ",
    "&hcirc;": "ĥ",
    "&hearts;": "♥",
    "&heartsuit;": "♥",
    "&hellip;": "…",
    "&hercon;": "⊹",
    "&hfr;": "\uD835\uDD25",
    "&hksearow;": "⤥",
    "&hkswarow;": "⤦",
    "&hoarr;": "⇿",
    "&homtht;": "∻",
    "&hookleftarrow;": "↩",
    "&hookrightarrow;": "↪",
    "&hopf;": "\uD835\uDD59",
    "&horbar;": "―",
    "&hscr;": "\uD835\uDCBD",
    "&hslash;": "ℏ",
    "&hstrok;": "ħ",
    "&hybull;": "⁃",
    "&hyphen;": "‐",
    "&iacute": "í",
    "&iacute;": "í",
    "&ic;": "⁣",
    "&icirc": "î",
    "&icirc;": "î",
    "&icy;": "и",
    "&iecy;": "е",
    "&iexcl": "¡",
    "&iexcl;": "¡",
    "&iff;": "⇔",
    "&ifr;": "\uD835\uDD26",
    "&igrave": "ì",
    "&igrave;": "ì",
    "&ii;": "ⅈ",
    "&iiiint;": "⨌",
    "&iiint;": "∭",
    "&iinfin;": "⧜",
    "&iiota;": "℩",
    "&ijlig;": "ĳ",
    "&imacr;": "ī",
    "&image;": "ℑ",
    "&imagline;": "ℐ",
    "&imagpart;": "ℑ",
    "&imath;": "ı",
    "&imof;": "⊷",
    "&imped;": "Ƶ",
    "&in;": "∈",
    "&incare;": "℅",
    "&infin;": "∞",
    "&infintie;": "⧝",
    "&inodot;": "ı",
    "&int;": "∫",
    "&intcal;": "⊺",
    "&integers;": "ℤ",
    "&intercal;": "⊺",
    "&intlarhk;": "⨗",
    "&intprod;": "⨼",
    "&iocy;": "ё",
    "&iogon;": "į",
    "&iopf;": "\uD835\uDD5A",
    "&iota;": "ι",
    "&iprod;": "⨼",
    "&iquest": "¿",
    "&iquest;": "¿",
    "&iscr;": "\uD835\uDCBE",
    "&isin;": "∈",
    "&isinE;": "⋹",
    "&isindot;": "⋵",
    "&isins;": "⋴",
    "&isinsv;": "⋳",
    "&isinv;": "∈",
    "&it;": "⁢",
    "&itilde;": "ĩ",
    "&iukcy;": "і",
    "&iuml": "ï",
    "&iuml;": "ï",
    "&jcirc;": "ĵ",
    "&jcy;": "й",
    "&jfr;": "\uD835\uDD27",
    "&jmath;": "ȷ",
    "&jopf;": "\uD835\uDD5B",
    "&jscr;": "\uD835\uDCBF",
    "&jsercy;": "ј",
    "&jukcy;": "є",
    "&kappa;": "κ",
    "&kappav;": "ϰ",
    "&kcedil;": "ķ",
    "&kcy;": "к",
    "&kfr;": "\uD835\uDD28",
    "&kgreen;": "ĸ",
    "&khcy;": "х",
    "&kjcy;": "ќ",
    "&kopf;": "\uD835\uDD5C",
    "&kscr;": "\uD835\uDCC0",
    "&lAarr;": "⇚",
    "&lArr;": "⇐",
    "&lAtail;": "⤛",
    "&lBarr;": "⤎",
    "&lE;": "≦",
    "&lEg;": "⪋",
    "&lHar;": "⥢",
    "&lacute;": "ĺ",
    "&laemptyv;": "⦴",
    "&lagran;": "ℒ",
    "&lambda;": "λ",
    "&lang;": "⟨",
    "&langd;": "⦑",
    "&langle;": "⟨",
    "&lap;": "⪅",
    "&laquo": "«",
    "&laquo;": "«",
    "&larr;": "←",
    "&larrb;": "⇤",
    "&larrbfs;": "⤟",
    "&larrfs;": "⤝",
    "&larrhk;": "↩",
    "&larrlp;": "↫",
    "&larrpl;": "⤹",
    "&larrsim;": "⥳",
    "&larrtl;": "↢",
    "&lat;": "⪫",
    "&latail;": "⤙",
    "&late;": "⪭",
    "&lates;": "⪭︀",
    "&lbarr;": "⤌",
    "&lbbrk;": "❲",
    "&lbrace;": "{",
    "&lbrack;": "[",
    "&lbrke;": "⦋",
    "&lbrksld;": "⦏",
    "&lbrkslu;": "⦍",
    "&lcaron;": "ľ",
    "&lcedil;": "ļ",
    "&lceil;": "⌈",
    "&lcub;": "{",
    "&lcy;": "л",
    "&ldca;": "⤶",
    "&ldquo;": "“",
    "&ldquor;": "„",
    "&ldrdhar;": "⥧",
    "&ldrushar;": "⥋",
    "&ldsh;": "↲",
    "&le;": "≤",
    "&leftarrow;": "←",
    "&leftarrowtail;": "↢",
    "&leftharpoondown;": "↽",
    "&leftharpoonup;": "↼",
    "&leftleftarrows;": "⇇",
    "&leftrightarrow;": "↔",
    "&leftrightarrows;": "⇆",
    "&leftrightharpoons;": "⇋",
    "&leftrightsquigarrow;": "↭",
    "&leftthreetimes;": "⋋",
    "&leg;": "⋚",
    "&leq;": "≤",
    "&leqq;": "≦",
    "&leqslant;": "⩽",
    "&les;": "⩽",
    "&lescc;": "⪨",
    "&lesdot;": "⩿",
    "&lesdoto;": "⪁",
    "&lesdotor;": "⪃",
    "&lesg;": "⋚︀",
    "&lesges;": "⪓",
    "&lessapprox;": "⪅",
    "&lessdot;": "⋖",
    "&lesseqgtr;": "⋚",
    "&lesseqqgtr;": "⪋",
    "&lessgtr;": "≶",
    "&lesssim;": "≲",
    "&lfisht;": "⥼",
    "&lfloor;": "⌊",
    "&lfr;": "\uD835\uDD29",
    "&lg;": "≶",
    "&lgE;": "⪑",
    "&lhard;": "↽",
    "&lharu;": "↼",
    "&lharul;": "⥪",
    "&lhblk;": "▄",
    "&ljcy;": "љ",
    "&ll;": "≪",
    "&llarr;": "⇇",
    "&llcorner;": "⌞",
    "&llhard;": "⥫",
    "&lltri;": "◺",
    "&lmidot;": "ŀ",
    "&lmoust;": "⎰",
    "&lmoustache;": "⎰",
    "&lnE;": "≨",
    "&lnap;": "⪉",
    "&lnapprox;": "⪉",
    "&lne;": "⪇",
    "&lneq;": "⪇",
    "&lneqq;": "≨",
    "&lnsim;": "⋦",
    "&loang;": "⟬",
    "&loarr;": "⇽",
    "&lobrk;": "⟦",
    "&longleftarrow;": "⟵",
    "&longleftrightarrow;": "⟷",
    "&longmapsto;": "⟼",
    "&longrightarrow;": "⟶",
    "&looparrowleft;": "↫",
    "&looparrowright;": "↬",
    "&lopar;": "⦅",
    "&lopf;": "\uD835\uDD5D",
    "&loplus;": "⨭",
    "&lotimes;": "⨴",
    "&lowast;": "∗",
    "&lowbar;": "_",
    "&loz;": "◊",
    "&lozenge;": "◊",
    "&lozf;": "⧫",
    "&lpar;": "(",
    "&lparlt;": "⦓",
    "&lrarr;": "⇆",
    "&lrcorner;": "⌟",
    "&lrhar;": "⇋",
    "&lrhard;": "⥭",
    "&lrm;": "‎",
    "&lrtri;": "⊿",
    "&lsaquo;": "‹",
    "&lscr;": "\uD835\uDCC1",
    "&lsh;": "↰",
    "&lsim;": "≲",
    "&lsime;": "⪍",
    "&lsimg;": "⪏",
    "&lsqb;": "[",
    "&lsquo;": "‘",
    "&lsquor;": "‚",
    "&lstrok;": "ł",
    "&lt": "<",
    "&lt;": "<",
    "&ltcc;": "⪦",
    "&ltcir;": "⩹",
    "&ltdot;": "⋖",
    "&lthree;": "⋋",
    "&ltimes;": "⋉",
    "&ltlarr;": "⥶",
    "&ltquest;": "⩻",
    "&ltrPar;": "⦖",
    "&ltri;": "◃",
    "&ltrie;": "⊴",
    "&ltrif;": "◂",
    "&lurdshar;": "⥊",
    "&luruhar;": "⥦",
    "&lvertneqq;": "≨︀",
    "&lvnE;": "≨︀",
    "&mDDot;": "∺",
    "&macr": "¯",
    "&macr;": "¯",
    "&male;": "♂",
    "&malt;": "✠",
    "&maltese;": "✠",
    "&map;": "↦",
    "&mapsto;": "↦",
    "&mapstodown;": "↧",
    "&mapstoleft;": "↤",
    "&mapstoup;": "↥",
    "&marker;": "▮",
    "&mcomma;": "⨩",
    "&mcy;": "м",
    "&mdash;": "—",
    "&measuredangle;": "∡",
    "&mfr;": "\uD835\uDD2A",
    "&mho;": "℧",
    "&micro": "µ",
    "&micro;": "µ",
    "&mid;": "∣",
    "&midast;": "*",
    "&midcir;": "⫰",
    "&middot": "·",
    "&middot;": "·",
    "&minus;": "−",
    "&minusb;": "⊟",
    "&minusd;": "∸",
    "&minusdu;": "⨪",
    "&mlcp;": "⫛",
    "&mldr;": "…",
    "&mnplus;": "∓",
    "&models;": "⊧",
    "&mopf;": "\uD835\uDD5E",
    "&mp;": "∓",
    "&mscr;": "\uD835\uDCC2",
    "&mstpos;": "∾",
    "&mu;": "μ",
    "&multimap;": "⊸",
    "&mumap;": "⊸",
    "&nGg;": "⋙̸",
    "&nGt;": "≫⃒",
    "&nGtv;": "≫̸",
    "&nLeftarrow;": "⇍",
    "&nLeftrightarrow;": "⇎",
    "&nLl;": "⋘̸",
    "&nLt;": "≪⃒",
    "&nLtv;": "≪̸",
    "&nRightarrow;": "⇏",
    "&nVDash;": "⊯",
    "&nVdash;": "⊮",
    "&nabla;": "∇",
    "&nacute;": "ń",
    "&nang;": "∠⃒",
    "&nap;": "≉",
    "&napE;": "⩰̸",
    "&napid;": "≋̸",
    "&napos;": "ŉ",
    "&napprox;": "≉",
    "&natur;": "♮",
    "&natural;": "♮",
    "&naturals;": "ℕ",
    "&nbsp": " ",
    "&nbsp;": " ",
    "&nbump;": "≎̸",
    "&nbumpe;": "≏̸",
    "&ncap;": "⩃",
    "&ncaron;": "ň",
    "&ncedil;": "ņ",
    "&ncong;": "≇",
    "&ncongdot;": "⩭̸",
    "&ncup;": "⩂",
    "&ncy;": "н",
    "&ndash;": "–",
    "&ne;": "≠",
    "&neArr;": "⇗",
    "&nearhk;": "⤤",
    "&nearr;": "↗",
    "&nearrow;": "↗",
    "&nedot;": "≐̸",
    "&nequiv;": "≢",
    "&nesear;": "⤨",
    "&nesim;": "≂̸",
    "&nexist;": "∄",
    "&nexists;": "∄",
    "&nfr;": "\uD835\uDD2B",
    "&ngE;": "≧̸",
    "&nge;": "≱",
    "&ngeq;": "≱",
    "&ngeqq;": "≧̸",
    "&ngeqslant;": "⩾̸",
    "&nges;": "⩾̸",
    "&ngsim;": "≵",
    "&ngt;": "≯",
    "&ngtr;": "≯",
    "&nhArr;": "⇎",
    "&nharr;": "↮",
    "&nhpar;": "⫲",
    "&ni;": "∋",
    "&nis;": "⋼",
    "&nisd;": "⋺",
    "&niv;": "∋",
    "&njcy;": "њ",
    "&nlArr;": "⇍",
    "&nlE;": "≦̸",
    "&nlarr;": "↚",
    "&nldr;": "‥",
    "&nle;": "≰",
    "&nleftarrow;": "↚",
    "&nleftrightarrow;": "↮",
    "&nleq;": "≰",
    "&nleqq;": "≦̸",
    "&nleqslant;": "⩽̸",
    "&nles;": "⩽̸",
    "&nless;": "≮",
    "&nlsim;": "≴",
    "&nlt;": "≮",
    "&nltri;": "⋪",
    "&nltrie;": "⋬",
    "&nmid;": "∤",
    "&nopf;": "\uD835\uDD5F",
    "&not": "¬",
    "&not;": "¬",
    "&notin;": "∉",
    "&notinE;": "⋹̸",
    "&notindot;": "⋵̸",
    "&notinva;": "∉",
    "&notinvb;": "⋷",
    "&notinvc;": "⋶",
    "&notni;": "∌",
    "&notniva;": "∌",
    "&notnivb;": "⋾",
    "&notnivc;": "⋽",
    "&npar;": "∦",
    "&nparallel;": "∦",
    "&nparsl;": "⫽⃥",
    "&npart;": "∂̸",
    "&npolint;": "⨔",
    "&npr;": "⊀",
    "&nprcue;": "⋠",
    "&npre;": "⪯̸",
    "&nprec;": "⊀",
    "&npreceq;": "⪯̸",
    "&nrArr;": "⇏",
    "&nrarr;": "↛",
    "&nrarrc;": "⤳̸",
    "&nrarrw;": "↝̸",
    "&nrightarrow;": "↛",
    "&nrtri;": "⋫",
    "&nrtrie;": "⋭",
    "&nsc;": "⊁",
    "&nsccue;": "⋡",
    "&nsce;": "⪰̸",
    "&nscr;": "\uD835\uDCC3",
    "&nshortmid;": "∤",
    "&nshortparallel;": "∦",
    "&nsim;": "≁",
    "&nsime;": "≄",
    "&nsimeq;": "≄",
    "&nsmid;": "∤",
    "&nspar;": "∦",
    "&nsqsube;": "⋢",
    "&nsqsupe;": "⋣",
    "&nsub;": "⊄",
    "&nsubE;": "⫅̸",
    "&nsube;": "⊈",
    "&nsubset;": "⊂⃒",
    "&nsubseteq;": "⊈",
    "&nsubseteqq;": "⫅̸",
    "&nsucc;": "⊁",
    "&nsucceq;": "⪰̸",
    "&nsup;": "⊅",
    "&nsupE;": "⫆̸",
    "&nsupe;": "⊉",
    "&nsupset;": "⊃⃒",
    "&nsupseteq;": "⊉",
    "&nsupseteqq;": "⫆̸",
    "&ntgl;": "≹",
    "&ntilde": "ñ",
    "&ntilde;": "ñ",
    "&ntlg;": "≸",
    "&ntriangleleft;": "⋪",
    "&ntrianglelefteq;": "⋬",
    "&ntriangleright;": "⋫",
    "&ntrianglerighteq;": "⋭",
    "&nu;": "ν",
    "&num;": "#",
    "&numero;": "№",
    "&numsp;": " ",
    "&nvDash;": "⊭",
    "&nvHarr;": "⤄",
    "&nvap;": "≍⃒",
    "&nvdash;": "⊬",
    "&nvge;": "≥⃒",
    "&nvgt;": ">⃒",
    "&nvinfin;": "⧞",
    "&nvlArr;": "⤂",
    "&nvle;": "≤⃒",
    "&nvlt;": "<⃒",
    "&nvltrie;": "⊴⃒",
    "&nvrArr;": "⤃",
    "&nvrtrie;": "⊵⃒",
    "&nvsim;": "∼⃒",
    "&nwArr;": "⇖",
    "&nwarhk;": "⤣",
    "&nwarr;": "↖",
    "&nwarrow;": "↖",
    "&nwnear;": "⤧",
    "&oS;": "Ⓢ",
    "&oacute": "ó",
    "&oacute;": "ó",
    "&oast;": "⊛",
    "&ocir;": "⊚",
    "&ocirc": "ô",
    "&ocirc;": "ô",
    "&ocy;": "о",
    "&odash;": "⊝",
    "&odblac;": "ő",
    "&odiv;": "⨸",
    "&odot;": "⊙",
    "&odsold;": "⦼",
    "&oelig;": "œ",
    "&ofcir;": "⦿",
    "&ofr;": "\uD835\uDD2C",
    "&ogon;": "˛",
    "&ograve": "ò",
    "&ograve;": "ò",
    "&ogt;": "⧁",
    "&ohbar;": "⦵",
    "&ohm;": "Ω",
    "&oint;": "∮",
    "&olarr;": "↺",
    "&olcir;": "⦾",
    "&olcross;": "⦻",
    "&oline;": "‾",
    "&olt;": "⧀",
    "&omacr;": "ō",
    "&omega;": "ω",
    "&omicron;": "ο",
    "&omid;": "⦶",
    "&ominus;": "⊖",
    "&oopf;": "\uD835\uDD60",
    "&opar;": "⦷",
    "&operp;": "⦹",
    "&oplus;": "⊕",
    "&or;": "∨",
    "&orarr;": "↻",
    "&ord;": "⩝",
    "&order;": "ℴ",
    "&orderof;": "ℴ",
    "&ordf": "ª",
    "&ordf;": "ª",
    "&ordm": "º",
    "&ordm;": "º",
    "&origof;": "⊶",
    "&oror;": "⩖",
    "&orslope;": "⩗",
    "&orv;": "⩛",
    "&oscr;": "ℴ",
    "&oslash": "ø",
    "&oslash;": "ø",
    "&osol;": "⊘",
    "&otilde": "õ",
    "&otilde;": "õ",
    "&otimes;": "⊗",
    "&otimesas;": "⨶",
    "&ouml": "ö",
    "&ouml;": "ö",
    "&ovbar;": "⌽",
    "&par;": "∥",
    "&para": "¶",
    "&para;": "¶",
    "&parallel;": "∥",
    "&parsim;": "⫳",
    "&parsl;": "⫽",
    "&part;": "∂",
    "&pcy;": "п",
    "&percnt;": "%",
    "&period;": ".",
    "&permil;": "‰",
    "&perp;": "⊥",
    "&pertenk;": "‱",
    "&pfr;": "\uD835\uDD2D",
    "&phi;": "φ",
    "&phiv;": "ϕ",
    "&phmmat;": "ℳ",
    "&phone;": "☎",
    "&pi;": "π",
    "&pitchfork;": "⋔",
    "&piv;": "ϖ",
    "&planck;": "ℏ",
    "&planckh;": "ℎ",
    "&plankv;": "ℏ",
    "&plus;": "+",
    "&plusacir;": "⨣",
    "&plusb;": "⊞",
    "&pluscir;": "⨢",
    "&plusdo;": "∔",
    "&plusdu;": "⨥",
    "&pluse;": "⩲",
    "&plusmn": "±",
    "&plusmn;": "±",
    "&plussim;": "⨦",
    "&plustwo;": "⨧",
    "&pm;": "±",
    "&pointint;": "⨕",
    "&popf;": "\uD835\uDD61",
    "&pound": "£",
    "&pound;": "£",
    "&pr;": "≺",
    "&prE;": "⪳",
    "&prap;": "⪷",
    "&prcue;": "≼",
    "&pre;": "⪯",
    "&prec;": "≺",
    "&precapprox;": "⪷",
    "&preccurlyeq;": "≼",
    "&preceq;": "⪯",
    "&precnapprox;": "⪹",
    "&precneqq;": "⪵",
    "&precnsim;": "⋨",
    "&precsim;": "≾",
    "&prime;": "′",
    "&primes;": "ℙ",
    "&prnE;": "⪵",
    "&prnap;": "⪹",
    "&prnsim;": "⋨",
    "&prod;": "∏",
    "&profalar;": "⌮",
    "&profline;": "⌒",
    "&profsurf;": "⌓",
    "&prop;": "∝",
    "&propto;": "∝",
    "&prsim;": "≾",
    "&prurel;": "⊰",
    "&pscr;": "\uD835\uDCC5",
    "&psi;": "ψ",
    "&puncsp;": " ",
    "&qfr;": "\uD835\uDD2E",
    "&qint;": "⨌",
    "&qopf;": "\uD835\uDD62",
    "&qprime;": "⁗",
    "&qscr;": "\uD835\uDCC6",
    "&quaternions;": "ℍ",
    "&quatint;": "⨖",
    "&quest;": "?",
    "&questeq;": "≟",
    "&quot": '"',
    "&quot;": '"',
    "&rAarr;": "⇛",
    "&rArr;": "⇒",
    "&rAtail;": "⤜",
    "&rBarr;": "⤏",
    "&rHar;": "⥤",
    "&race;": "∽̱",
    "&racute;": "ŕ",
    "&radic;": "√",
    "&raemptyv;": "⦳",
    "&rang;": "⟩",
    "&rangd;": "⦒",
    "&range;": "⦥",
    "&rangle;": "⟩",
    "&raquo": "»",
    "&raquo;": "»",
    "&rarr;": "→",
    "&rarrap;": "⥵",
    "&rarrb;": "⇥",
    "&rarrbfs;": "⤠",
    "&rarrc;": "⤳",
    "&rarrfs;": "⤞",
    "&rarrhk;": "↪",
    "&rarrlp;": "↬",
    "&rarrpl;": "⥅",
    "&rarrsim;": "⥴",
    "&rarrtl;": "↣",
    "&rarrw;": "↝",
    "&ratail;": "⤚",
    "&ratio;": "∶",
    "&rationals;": "ℚ",
    "&rbarr;": "⤍",
    "&rbbrk;": "❳",
    "&rbrace;": "}",
    "&rbrack;": "]",
    "&rbrke;": "⦌",
    "&rbrksld;": "⦎",
    "&rbrkslu;": "⦐",
    "&rcaron;": "ř",
    "&rcedil;": "ŗ",
    "&rceil;": "⌉",
    "&rcub;": "}",
    "&rcy;": "р",
    "&rdca;": "⤷",
    "&rdldhar;": "⥩",
    "&rdquo;": "”",
    "&rdquor;": "”",
    "&rdsh;": "↳",
    "&real;": "ℜ",
    "&realine;": "ℛ",
    "&realpart;": "ℜ",
    "&reals;": "ℝ",
    "&rect;": "▭",
    "&reg": "®",
    "&reg;": "®",
    "&rfisht;": "⥽",
    "&rfloor;": "⌋",
    "&rfr;": "\uD835\uDD2F",
    "&rhard;": "⇁",
    "&rharu;": "⇀",
    "&rharul;": "⥬",
    "&rho;": "ρ",
    "&rhov;": "ϱ",
    "&rightarrow;": "→",
    "&rightarrowtail;": "↣",
    "&rightharpoondown;": "⇁",
    "&rightharpoonup;": "⇀",
    "&rightleftarrows;": "⇄",
    "&rightleftharpoons;": "⇌",
    "&rightrightarrows;": "⇉",
    "&rightsquigarrow;": "↝",
    "&rightthreetimes;": "⋌",
    "&ring;": "˚",
    "&risingdotseq;": "≓",
    "&rlarr;": "⇄",
    "&rlhar;": "⇌",
    "&rlm;": "‏",
    "&rmoust;": "⎱",
    "&rmoustache;": "⎱",
    "&rnmid;": "⫮",
    "&roang;": "⟭",
    "&roarr;": "⇾",
    "&robrk;": "⟧",
    "&ropar;": "⦆",
    "&ropf;": "\uD835\uDD63",
    "&roplus;": "⨮",
    "&rotimes;": "⨵",
    "&rpar;": ")",
    "&rpargt;": "⦔",
    "&rppolint;": "⨒",
    "&rrarr;": "⇉",
    "&rsaquo;": "›",
    "&rscr;": "\uD835\uDCC7",
    "&rsh;": "↱",
    "&rsqb;": "]",
    "&rsquo;": "’",
    "&rsquor;": "’",
    "&rthree;": "⋌",
    "&rtimes;": "⋊",
    "&rtri;": "▹",
    "&rtrie;": "⊵",
    "&rtrif;": "▸",
    "&rtriltri;": "⧎",
    "&ruluhar;": "⥨",
    "&rx;": "℞",
    "&sacute;": "ś",
    "&sbquo;": "‚",
    "&sc;": "≻",
    "&scE;": "⪴",
    "&scap;": "⪸",
    "&scaron;": "š",
    "&sccue;": "≽",
    "&sce;": "⪰",
    "&scedil;": "ş",
    "&scirc;": "ŝ",
    "&scnE;": "⪶",
    "&scnap;": "⪺",
    "&scnsim;": "⋩",
    "&scpolint;": "⨓",
    "&scsim;": "≿",
    "&scy;": "с",
    "&sdot;": "⋅",
    "&sdotb;": "⊡",
    "&sdote;": "⩦",
    "&seArr;": "⇘",
    "&searhk;": "⤥",
    "&searr;": "↘",
    "&searrow;": "↘",
    "&sect": "§",
    "&sect;": "§",
    "&semi;": ";",
    "&seswar;": "⤩",
    "&setminus;": "∖",
    "&setmn;": "∖",
    "&sext;": "✶",
    "&sfr;": "\uD835\uDD30",
    "&sfrown;": "⌢",
    "&sharp;": "♯",
    "&shchcy;": "щ",
    "&shcy;": "ш",
    "&shortmid;": "∣",
    "&shortparallel;": "∥",
    "&shy": "­",
    "&shy;": "­",
    "&sigma;": "σ",
    "&sigmaf;": "ς",
    "&sigmav;": "ς",
    "&sim;": "∼",
    "&simdot;": "⩪",
    "&sime;": "≃",
    "&simeq;": "≃",
    "&simg;": "⪞",
    "&simgE;": "⪠",
    "&siml;": "⪝",
    "&simlE;": "⪟",
    "&simne;": "≆",
    "&simplus;": "⨤",
    "&simrarr;": "⥲",
    "&slarr;": "←",
    "&smallsetminus;": "∖",
    "&smashp;": "⨳",
    "&smeparsl;": "⧤",
    "&smid;": "∣",
    "&smile;": "⌣",
    "&smt;": "⪪",
    "&smte;": "⪬",
    "&smtes;": "⪬︀",
    "&softcy;": "ь",
    "&sol;": "/",
    "&solb;": "⧄",
    "&solbar;": "⌿",
    "&sopf;": "\uD835\uDD64",
    "&spades;": "♠",
    "&spadesuit;": "♠",
    "&spar;": "∥",
    "&sqcap;": "⊓",
    "&sqcaps;": "⊓︀",
    "&sqcup;": "⊔",
    "&sqcups;": "⊔︀",
    "&sqsub;": "⊏",
    "&sqsube;": "⊑",
    "&sqsubset;": "⊏",
    "&sqsubseteq;": "⊑",
    "&sqsup;": "⊐",
    "&sqsupe;": "⊒",
    "&sqsupset;": "⊐",
    "&sqsupseteq;": "⊒",
    "&squ;": "□",
    "&square;": "□",
    "&squarf;": "▪",
    "&squf;": "▪",
    "&srarr;": "→",
    "&sscr;": "\uD835\uDCC8",
    "&ssetmn;": "∖",
    "&ssmile;": "⌣",
    "&sstarf;": "⋆",
    "&star;": "☆",
    "&starf;": "★",
    "&straightepsilon;": "ϵ",
    "&straightphi;": "ϕ",
    "&strns;": "¯",
    "&sub;": "⊂",
    "&subE;": "⫅",
    "&subdot;": "⪽",
    "&sube;": "⊆",
    "&subedot;": "⫃",
    "&submult;": "⫁",
    "&subnE;": "⫋",
    "&subne;": "⊊",
    "&subplus;": "⪿",
    "&subrarr;": "⥹",
    "&subset;": "⊂",
    "&subseteq;": "⊆",
    "&subseteqq;": "⫅",
    "&subsetneq;": "⊊",
    "&subsetneqq;": "⫋",
    "&subsim;": "⫇",
    "&subsub;": "⫕",
    "&subsup;": "⫓",
    "&succ;": "≻",
    "&succapprox;": "⪸",
    "&succcurlyeq;": "≽",
    "&succeq;": "⪰",
    "&succnapprox;": "⪺",
    "&succneqq;": "⪶",
    "&succnsim;": "⋩",
    "&succsim;": "≿",
    "&sum;": "∑",
    "&sung;": "♪",
    "&sup1": "¹",
    "&sup1;": "¹",
    "&sup2": "²",
    "&sup2;": "²",
    "&sup3": "³",
    "&sup3;": "³",
    "&sup;": "⊃",
    "&supE;": "⫆",
    "&supdot;": "⪾",
    "&supdsub;": "⫘",
    "&supe;": "⊇",
    "&supedot;": "⫄",
    "&suphsol;": "⟉",
    "&suphsub;": "⫗",
    "&suplarr;": "⥻",
    "&supmult;": "⫂",
    "&supnE;": "⫌",
    "&supne;": "⊋",
    "&supplus;": "⫀",
    "&supset;": "⊃",
    "&supseteq;": "⊇",
    "&supseteqq;": "⫆",
    "&supsetneq;": "⊋",
    "&supsetneqq;": "⫌",
    "&supsim;": "⫈",
    "&supsub;": "⫔",
    "&supsup;": "⫖",
    "&swArr;": "⇙",
    "&swarhk;": "⤦",
    "&swarr;": "↙",
    "&swarrow;": "↙",
    "&swnwar;": "⤪",
    "&szlig": "ß",
    "&szlig;": "ß",
    "&target;": "⌖",
    "&tau;": "τ",
    "&tbrk;": "⎴",
    "&tcaron;": "ť",
    "&tcedil;": "ţ",
    "&tcy;": "т",
    "&tdot;": "⃛",
    "&telrec;": "⌕",
    "&tfr;": "\uD835\uDD31",
    "&there4;": "∴",
    "&therefore;": "∴",
    "&theta;": "θ",
    "&thetasym;": "ϑ",
    "&thetav;": "ϑ",
    "&thickapprox;": "≈",
    "&thicksim;": "∼",
    "&thinsp;": " ",
    "&thkap;": "≈",
    "&thksim;": "∼",
    "&thorn": "þ",
    "&thorn;": "þ",
    "&tilde;": "˜",
    "&times": "×",
    "&times;": "×",
    "&timesb;": "⊠",
    "&timesbar;": "⨱",
    "&timesd;": "⨰",
    "&tint;": "∭",
    "&toea;": "⤨",
    "&top;": "⊤",
    "&topbot;": "⌶",
    "&topcir;": "⫱",
    "&topf;": "\uD835\uDD65",
    "&topfork;": "⫚",
    "&tosa;": "⤩",
    "&tprime;": "‴",
    "&trade;": "™",
    "&triangle;": "▵",
    "&triangledown;": "▿",
    "&triangleleft;": "◃",
    "&trianglelefteq;": "⊴",
    "&triangleq;": "≜",
    "&triangleright;": "▹",
    "&trianglerighteq;": "⊵",
    "&tridot;": "◬",
    "&trie;": "≜",
    "&triminus;": "⨺",
    "&triplus;": "⨹",
    "&trisb;": "⧍",
    "&tritime;": "⨻",
    "&trpezium;": "⏢",
    "&tscr;": "\uD835\uDCC9",
    "&tscy;": "ц",
    "&tshcy;": "ћ",
    "&tstrok;": "ŧ",
    "&twixt;": "≬",
    "&twoheadleftarrow;": "↞",
    "&twoheadrightarrow;": "↠",
    "&uArr;": "⇑",
    "&uHar;": "⥣",
    "&uacute": "ú",
    "&uacute;": "ú",
    "&uarr;": "↑",
    "&ubrcy;": "ў",
    "&ubreve;": "ŭ",
    "&ucirc": "û",
    "&ucirc;": "û",
    "&ucy;": "у",
    "&udarr;": "⇅",
    "&udblac;": "ű",
    "&udhar;": "⥮",
    "&ufisht;": "⥾",
    "&ufr;": "\uD835\uDD32",
    "&ugrave": "ù",
    "&ugrave;": "ù",
    "&uharl;": "↿",
    "&uharr;": "↾",
    "&uhblk;": "▀",
    "&ulcorn;": "⌜",
    "&ulcorner;": "⌜",
    "&ulcrop;": "⌏",
    "&ultri;": "◸",
    "&umacr;": "ū",
    "&uml": "¨",
    "&uml;": "¨",
    "&uogon;": "ų",
    "&uopf;": "\uD835\uDD66",
    "&uparrow;": "↑",
    "&updownarrow;": "↕",
    "&upharpoonleft;": "↿",
    "&upharpoonright;": "↾",
    "&uplus;": "⊎",
    "&upsi;": "υ",
    "&upsih;": "ϒ",
    "&upsilon;": "υ",
    "&upuparrows;": "⇈",
    "&urcorn;": "⌝",
    "&urcorner;": "⌝",
    "&urcrop;": "⌎",
    "&uring;": "ů",
    "&urtri;": "◹",
    "&uscr;": "\uD835\uDCCA",
    "&utdot;": "⋰",
    "&utilde;": "ũ",
    "&utri;": "▵",
    "&utrif;": "▴",
    "&uuarr;": "⇈",
    "&uuml": "ü",
    "&uuml;": "ü",
    "&uwangle;": "⦧",
    "&vArr;": "⇕",
    "&vBar;": "⫨",
    "&vBarv;": "⫩",
    "&vDash;": "⊨",
    "&vangrt;": "⦜",
    "&varepsilon;": "ϵ",
    "&varkappa;": "ϰ",
    "&varnothing;": "∅",
    "&varphi;": "ϕ",
    "&varpi;": "ϖ",
    "&varpropto;": "∝",
    "&varr;": "↕",
    "&varrho;": "ϱ",
    "&varsigma;": "ς",
    "&varsubsetneq;": "⊊︀",
    "&varsubsetneqq;": "⫋︀",
    "&varsupsetneq;": "⊋︀",
    "&varsupsetneqq;": "⫌︀",
    "&vartheta;": "ϑ",
    "&vartriangleleft;": "⊲",
    "&vartriangleright;": "⊳",
    "&vcy;": "в",
    "&vdash;": "⊢",
    "&vee;": "∨",
    "&veebar;": "⊻",
    "&veeeq;": "≚",
    "&vellip;": "⋮",
    "&verbar;": "|",
    "&vert;": "|",
    "&vfr;": "\uD835\uDD33",
    "&vltri;": "⊲",
    "&vnsub;": "⊂⃒",
    "&vnsup;": "⊃⃒",
    "&vopf;": "\uD835\uDD67",
    "&vprop;": "∝",
    "&vrtri;": "⊳",
    "&vscr;": "\uD835\uDCCB",
    "&vsubnE;": "⫋︀",
    "&vsubne;": "⊊︀",
    "&vsupnE;": "⫌︀",
    "&vsupne;": "⊋︀",
    "&vzigzag;": "⦚",
    "&wcirc;": "ŵ",
    "&wedbar;": "⩟",
    "&wedge;": "∧",
    "&wedgeq;": "≙",
    "&weierp;": "℘",
    "&wfr;": "\uD835\uDD34",
    "&wopf;": "\uD835\uDD68",
    "&wp;": "℘",
    "&wr;": "≀",
    "&wreath;": "≀",
    "&wscr;": "\uD835\uDCCC",
    "&xcap;": "⋂",
    "&xcirc;": "◯",
    "&xcup;": "⋃",
    "&xdtri;": "▽",
    "&xfr;": "\uD835\uDD35",
    "&xhArr;": "⟺",
    "&xharr;": "⟷",
    "&xi;": "ξ",
    "&xlArr;": "⟸",
    "&xlarr;": "⟵",
    "&xmap;": "⟼",
    "&xnis;": "⋻",
    "&xodot;": "⨀",
    "&xopf;": "\uD835\uDD69",
    "&xoplus;": "⨁",
    "&xotime;": "⨂",
    "&xrArr;": "⟹",
    "&xrarr;": "⟶",
    "&xscr;": "\uD835\uDCCD",
    "&xsqcup;": "⨆",
    "&xuplus;": "⨄",
    "&xutri;": "△",
    "&xvee;": "⋁",
    "&xwedge;": "⋀",
    "&yacute": "ý",
    "&yacute;": "ý",
    "&yacy;": "я",
    "&ycirc;": "ŷ",
    "&ycy;": "ы",
    "&yen": "¥",
    "&yen;": "¥",
    "&yfr;": "\uD835\uDD36",
    "&yicy;": "ї",
    "&yopf;": "\uD835\uDD6A",
    "&yscr;": "\uD835\uDCCE",
    "&yucy;": "ю",
    "&yuml": "ÿ",
    "&yuml;": "ÿ",
    "&zacute;": "ź",
    "&zcaron;": "ž",
    "&zcy;": "з",
    "&zdot;": "ż",
    "&zeetrf;": "ℨ",
    "&zeta;": "ζ",
    "&zfr;": "\uD835\uDD37",
    "&zhcy;": "ж",
    "&zigrarr;": "⇝",
    "&zopf;": "\uD835\uDD6B",
    "&zscr;": "\uD835\uDCCF",
    "&zwj;": "‍",
    "&zwnj;": "‌"
  };
  html_entities_default = htmlEntities;
});

// node_modules/postal-mime/src/text-format.js
function decodeHTMLEntities(str) {
  return str.replace(/&(#\d+|#x[a-f0-9]+|[a-z]+\d*);?/gi, (match, entity) => {
    if (typeof html_entities_default[match] === "string") {
      return html_entities_default[match];
    }
    if (entity.charAt(0) !== "#" || match.charAt(match.length - 1) !== ";") {
      return match;
    }
    let codePoint;
    if (entity.charAt(1) === "x") {
      codePoint = parseInt(entity.substr(2), 16);
    } else {
      codePoint = parseInt(entity.substr(1), 10);
    }
    var output = "";
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return "�";
    }
    if (codePoint > 65535) {
      codePoint -= 65536;
      output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    output += String.fromCharCode(codePoint);
    return output;
  });
}
function escapeHtml(str) {
  return str.trim().replace(/[<>"'?&]/g, (c) => {
    let hex = c.charCodeAt(0).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return "&#x" + hex.toUpperCase() + ";";
  });
}
function textToHtml(str) {
  let html = escapeHtml(str).replace(/\n/g, "<br />");
  return "<div>" + html + "</div>";
}
function htmlToText(str) {
  str = str.replace(/\r?\n/g, "\x01").replace(/<\!\-\-.*?\-\->/gi, " ").replace(/<br\b[^>]*>/gi, `
`).replace(/<\/?(p|div|table|tr|td|th)\b[^>]*>/gi, `

`).replace(/<script\b[^>]*>.*?<\/script\b[^>]*>/gi, " ").replace(/^.*<body\b[^>]*>/i, "").replace(/^.*<\/head\b[^>]*>/i, "").replace(/^.*<\!doctype\b[^>]*>/i, "").replace(/<\/body\b[^>]*>.*$/i, "").replace(/<\/html\b[^>]*>.*$/i, "").replace(/<a\b[^>]*href\s*=\s*["']?([^\s"']+)[^>]*>/gi, " ($1) ").replace(/<\/?(span|em|i|strong|b|u|a)\b[^>]*>/gi, "").replace(/<li\b[^>]*>[\n\u0001\s]*/gi, "* ").replace(/<hr\b[^>]*>/g, `
-------------
`).replace(/<[^>]*>/g, " ").replace(/\u0001/g, `
`).replace(/[ \t]+/g, " ").replace(/^\s+$/gm, "").replace(/\n\n+/g, `

`).replace(/^\n+/, `
`).replace(/\n+$/, `
`);
  str = decodeHTMLEntities(str);
  return str;
}
function formatTextAddress(address) {
  return [].concat(address.name || []).concat(address.name ? `<${address.address}>` : address.address).join(" ");
}
function formatTextAddresses(addresses) {
  let parts = [];
  let processAddress = (address, partCounter) => {
    if (partCounter) {
      parts.push(", ");
    }
    if (address.group) {
      let groupStart = `${address.name}:`;
      let groupEnd = `;`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatTextAddress(address));
    }
  };
  addresses.forEach(processAddress);
  return parts.join("");
}
function formatHtmlAddress(address) {
  return `<a href="mailto:${escapeHtml(address.address)}" class="postal-email-address">${escapeHtml(address.name || `<${address.address}>`)}</a>`;
}
function formatHtmlAddresses(addresses) {
  let parts = [];
  let processAddress = (address, partCounter) => {
    if (partCounter) {
      parts.push('<span class="postal-email-address-separator">, </span>');
    }
    if (address.group) {
      let groupStart = `<span class="postal-email-address-group">${escapeHtml(address.name)}:</span>`;
      let groupEnd = `<span class="postal-email-address-group">;</span>`;
      parts.push(groupStart);
      address.group.forEach(processAddress);
      parts.push(groupEnd);
    } else {
      parts.push(formatHtmlAddress(address));
    }
  };
  addresses.forEach(processAddress);
  return parts.join(" ");
}
function foldLines(str, lineLength, afterSpace) {
  str = (str || "").toString();
  lineLength = lineLength || 76;
  let pos = 0, len = str.length, result = "", line, match;
  while (pos < len) {
    line = str.substr(pos, lineLength);
    if (line.length < lineLength) {
      result += line;
      break;
    }
    if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
      line = match[0];
      result += line;
      pos += line.length;
      continue;
    } else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) {
      line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
    } else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
      line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
    }
    result += line;
    pos += line.length;
    if (pos < len) {
      result += `\r
`;
    }
  }
  return result;
}
function formatTextHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push({ key: "From", val: formatTextAddress(message.from) });
  }
  if (message.subject) {
    rows.push({ key: "Subject", val: message.subject });
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push({ key: "Date", val: dateStr });
  }
  if (message.to && message.to.length) {
    rows.push({ key: "To", val: formatTextAddresses(message.to) });
  }
  if (message.cc && message.cc.length) {
    rows.push({ key: "Cc", val: formatTextAddresses(message.cc) });
  }
  if (message.bcc && message.bcc.length) {
    rows.push({ key: "Bcc", val: formatTextAddresses(message.bcc) });
  }
  let maxKeyLength = rows.map((r) => r.key.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  rows = rows.flatMap((row) => {
    let sepLen = maxKeyLength - row.key.length;
    let prefix = `${row.key}: ${" ".repeat(sepLen)}`;
    let emptyPrefix = `${" ".repeat(row.key.length + 1)} ${" ".repeat(sepLen)}`;
    let foldedLines = foldLines(row.val, 80, true).split(/\r?\n/).map((line) => line.trim());
    return foldedLines.map((line, i2) => `${i2 ? emptyPrefix : prefix}${line}`);
  });
  let maxLineLength = rows.map((r) => r.length).reduce((acc, cur) => {
    return cur > acc ? cur : acc;
  }, 0);
  let lineMarker = "-".repeat(maxLineLength);
  let template = `
${lineMarker}
${rows.join(`
`)}
${lineMarker}
`;
  return template;
}
function formatHtmlHeader(message) {
  let rows = [];
  if (message.from) {
    rows.push(`<div class="postal-email-header-key">From</div><div class="postal-email-header-value">${formatHtmlAddress(message.from)}</div>`);
  }
  if (message.subject) {
    rows.push(`<div class="postal-email-header-key">Subject</div><div class="postal-email-header-value postal-email-header-subject">${escapeHtml(message.subject)}</div>`);
  }
  if (message.date) {
    let dateOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
    let dateStr = typeof Intl === "undefined" ? message.date : new Intl.DateTimeFormat("default", dateOptions).format(new Date(message.date));
    rows.push(`<div class="postal-email-header-key">Date</div><div class="postal-email-header-value postal-email-header-date" data-date="${escapeHtml(message.date)}">${escapeHtml(dateStr)}</div>`);
  }
  if (message.to && message.to.length) {
    rows.push(`<div class="postal-email-header-key">To</div><div class="postal-email-header-value">${formatHtmlAddresses(message.to)}</div>`);
  }
  if (message.cc && message.cc.length) {
    rows.push(`<div class="postal-email-header-key">Cc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.cc)}</div>`);
  }
  if (message.bcc && message.bcc.length) {
    rows.push(`<div class="postal-email-header-key">Bcc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.bcc)}</div>`);
  }
  let template = `<div class="postal-email-header">${rows.length ? '<div class="postal-email-header-row">' : ""}${rows.join(`</div>
<div class="postal-email-header-row">`)}${rows.length ? "</div>" : ""}</div>`;
  return template;
}
var init_text_format = __esm(() => {
  init_html_entities();
});

// node_modules/postal-mime/src/address-parser.js
function _handleAddress(tokens, depth) {
  let isGroup = false;
  let state = "text";
  let address;
  let addresses = [];
  let data = {
    address: [],
    comment: [],
    group: [],
    text: [],
    textWasQuoted: []
  };
  let i2;
  let len;
  let insideQuotes = false;
  for (i2 = 0, len = tokens.length;i2 < len; i2++) {
    let token = tokens[i2];
    let prevToken = i2 ? tokens[i2 - 1] : null;
    if (token.type === "operator") {
      switch (token.value) {
        case "<":
          state = "address";
          insideQuotes = false;
          break;
        case "(":
          state = "comment";
          insideQuotes = false;
          break;
        case ":":
          state = "group";
          isGroup = true;
          insideQuotes = false;
          break;
        case '"':
          insideQuotes = !insideQuotes;
          state = "text";
          break;
        default:
          state = "text";
          insideQuotes = false;
          break;
      }
    } else if (token.value) {
      if (state === "address") {
        token.value = token.value.replace(/^[^<]*<\s*/, "");
      }
      if (prevToken && prevToken.noBreak && data[state].length) {
        data[state][data[state].length - 1] += token.value;
        if (state === "text" && insideQuotes) {
          data.textWasQuoted[data.textWasQuoted.length - 1] = true;
        }
      } else {
        data[state].push(token.value);
        if (state === "text") {
          data.textWasQuoted.push(insideQuotes);
        }
      }
    }
  }
  if (!data.text.length && data.comment.length) {
    data.text = data.comment;
    data.comment = [];
  }
  if (isGroup) {
    data.text = data.text.join(" ");
    let groupMembers = [];
    if (data.group.length) {
      let parsedGroup = addressParser(data.group.join(","), { _depth: depth + 1 });
      parsedGroup.forEach((member) => {
        if (member.group) {
          groupMembers = groupMembers.concat(member.group);
        } else {
          groupMembers.push(member);
        }
      });
    }
    addresses.push({
      name: decodeWords(data.text || address && address.name),
      group: groupMembers
    });
  } else {
    if (!data.address.length && data.text.length) {
      for (i2 = data.text.length - 1;i2 >= 0; i2--) {
        if (!data.textWasQuoted[i2] && data.text[i2].match(/^[^@\s]+@[^@\s]+$/)) {
          data.address = data.text.splice(i2, 1);
          data.textWasQuoted.splice(i2, 1);
          break;
        }
      }
      let _regexHandler = function(address2) {
        if (!data.address.length) {
          data.address = [address2.trim()];
          return " ";
        } else {
          return address2;
        }
      };
      if (!data.address.length) {
        for (i2 = data.text.length - 1;i2 >= 0; i2--) {
          if (!data.textWasQuoted[i2]) {
            data.text[i2] = data.text[i2].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
            if (data.address.length) {
              break;
            }
          }
        }
      }
    }
    if (!data.text.length && data.comment.length) {
      data.text = data.comment;
      data.comment = [];
    }
    if (data.address.length > 1) {
      data.text = data.text.concat(data.address.splice(1));
    }
    data.text = data.text.join(" ");
    data.address = data.address.join(" ");
    if (!data.address && /^=\?[^=]+?=$/.test(data.text.trim())) {
      const parsedSubAddresses = addressParser(decodeWords(data.text));
      if (parsedSubAddresses && parsedSubAddresses.length) {
        return parsedSubAddresses;
      }
    }
    if (!data.address && isGroup) {
      return [];
    } else {
      address = {
        address: data.address || data.text || "",
        name: decodeWords(data.text || data.address || "")
      };
      if (address.address === address.name) {
        if ((address.address || "").match(/@/)) {
          address.name = "";
        } else {
          address.address = "";
        }
      }
      addresses.push(address);
    }
  }
  return addresses;
}

class Tokenizer {
  constructor(str) {
    this.str = (str || "").toString();
    this.operatorCurrent = "";
    this.operatorExpecting = "";
    this.node = null;
    this.escaped = false;
    this.list = [];
    this.operators = {
      '"': '"',
      "(": ")",
      "<": ">",
      ",": "",
      ":": ";",
      ";": ""
    };
  }
  tokenize() {
    let list = [];
    for (let i2 = 0, len = this.str.length;i2 < len; i2++) {
      let chr = this.str.charAt(i2);
      let nextChr = i2 < len - 1 ? this.str.charAt(i2 + 1) : null;
      this.checkChar(chr, nextChr);
    }
    this.list.forEach((node) => {
      node.value = (node.value || "").toString().trim();
      if (node.value) {
        list.push(node);
      }
    });
    return list;
  }
  checkChar(chr, nextChr) {
    if (this.escaped) {} else if (chr === this.operatorExpecting) {
      this.node = {
        type: "operator",
        value: chr
      };
      if (nextChr && ![" ", "\t", "\r", `
`, ",", ";"].includes(nextChr)) {
        this.node.noBreak = true;
      }
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = "";
      this.escaped = false;
      return;
    } else if (!this.operatorExpecting && chr in this.operators) {
      this.node = {
        type: "operator",
        value: chr
      };
      this.list.push(this.node);
      this.node = null;
      this.operatorExpecting = this.operators[chr];
      this.escaped = false;
      return;
    } else if (['"', "'"].includes(this.operatorExpecting) && chr === "\\") {
      this.escaped = true;
      return;
    }
    if (!this.node) {
      this.node = {
        type: "text",
        value: ""
      };
      this.list.push(this.node);
    }
    if (chr === `
`) {
      chr = " ";
    }
    if (chr.charCodeAt(0) >= 33 || [" ", "\t"].includes(chr)) {
      this.node.value += chr;
    }
    this.escaped = false;
  }
}
function addressParser(str, options) {
  options = options || {};
  let depth = options._depth || 0;
  if (depth > MAX_NESTED_GROUP_DEPTH) {
    return [];
  }
  let tokenizer = new Tokenizer(str);
  let tokens = tokenizer.tokenize();
  let addresses = [];
  let address = [];
  let parsedAddresses = [];
  tokens.forEach((token) => {
    if (token.type === "operator" && (token.value === "," || token.value === ";")) {
      if (address.length) {
        addresses.push(address);
      }
      address = [];
    } else {
      address.push(token);
    }
  });
  if (address.length) {
    addresses.push(address);
  }
  addresses.forEach((address2) => {
    address2 = _handleAddress(address2, depth);
    if (address2.length) {
      parsedAddresses = parsedAddresses.concat(address2);
    }
  });
  if (options.flatten) {
    let addresses2 = [];
    let walkAddressList = (list) => {
      list.forEach((address2) => {
        if (address2.group) {
          return walkAddressList(address2.group);
        } else {
          addresses2.push(address2);
        }
      });
    };
    walkAddressList(parsedAddresses);
    return addresses2;
  }
  return parsedAddresses;
}
var MAX_NESTED_GROUP_DEPTH = 50, address_parser_default;
var init_address_parser = __esm(() => {
  init_decode_strings();
  address_parser_default = addressParser;
});

// node_modules/postal-mime/src/base64-encoder.js
function base64ArrayBuffer(arrayBuffer) {
  var base64 = "";
  var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
  var a, b, c, d;
  var chunk;
  for (var i2 = 0;i2 < mainLength; i2 = i2 + 3) {
    chunk = bytes[i2] << 16 | bytes[i2 + 1] << 8 | bytes[i2 + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
}

// node_modules/postal-mime/src/postal-mime.js
class PostalMime {
  static parse(buf, options) {
    const parser = new PostalMime(options);
    return parser.parse(buf);
  }
  constructor(options) {
    this.options = options || {};
    this.mimeOptions = {
      maxNestingDepth: this.options.maxNestingDepth || MAX_NESTING_DEPTH,
      maxHeadersSize: this.options.maxHeadersSize || MAX_HEADERS_SIZE
    };
    this.root = this.currentNode = new MimeNode({
      postalMime: this,
      ...this.mimeOptions
    });
    this.boundaries = [];
    this.textContent = {};
    this.attachments = [];
    this.attachmentEncoding = (this.options.attachmentEncoding || "").toString().replace(/[-_\s]/g, "").trim().toLowerCase() || "arraybuffer";
    this.started = false;
  }
  async finalize() {
    await this.root.finalize();
  }
  async processLine(line, isFinal) {
    let boundaries = this.boundaries;
    if (boundaries.length && line.length > 2 && line[0] === 45 && line[1] === 45) {
      for (let i2 = boundaries.length - 1;i2 >= 0; i2--) {
        let boundary = boundaries[i2];
        if (line.length < boundary.value.length + 2) {
          continue;
        }
        let boundaryMatches = true;
        for (let j = 0;j < boundary.value.length; j++) {
          if (line[j + 2] !== boundary.value[j]) {
            boundaryMatches = false;
            break;
          }
        }
        if (!boundaryMatches) {
          continue;
        }
        let boundaryEnd = boundary.value.length + 2;
        let isTerminator = false;
        if (line.length >= boundary.value.length + 4 && line[boundary.value.length + 2] === 45 && line[boundary.value.length + 3] === 45) {
          isTerminator = true;
          boundaryEnd = boundary.value.length + 4;
        }
        let hasValidTrailing = true;
        for (let j = boundaryEnd;j < line.length; j++) {
          if (line[j] !== 32 && line[j] !== 9) {
            hasValidTrailing = false;
            break;
          }
        }
        if (!hasValidTrailing) {
          continue;
        }
        if (isTerminator) {
          await boundary.node.finalize();
          this.currentNode = boundary.node.parentNode || this.root;
        } else {
          await boundary.node.finalizeChildNodes();
          this.currentNode = new MimeNode({
            postalMime: this,
            parentNode: boundary.node,
            parentMultipartType: boundary.node.contentType.multipart,
            ...this.mimeOptions
          });
        }
        if (isFinal) {
          return this.finalize();
        }
        return;
      }
    }
    this.currentNode.feed(line);
    if (isFinal) {
      return this.finalize();
    }
  }
  readLine() {
    let startPos = this.readPos;
    let endPos = this.readPos;
    let res = () => {
      return {
        bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
        done: this.readPos >= this.av.length
      };
    };
    while (this.readPos < this.av.length) {
      const c = this.av[this.readPos++];
      if (c !== 13 && c !== 10) {
        endPos = this.readPos;
      }
      if (c === 10) {
        return res();
      }
    }
    return res();
  }
  async processNodeTree() {
    let textContent = {};
    let textTypes = new Set;
    let textMap = this.textMap = new Map;
    let forceRfc822Attachments = this.forceRfc822Attachments();
    let walk = async (node, alternative, related) => {
      alternative = alternative || false;
      related = related || false;
      if (!node.contentType.multipart) {
        if (this.isInlineMessageRfc822(node) && !forceRfc822Attachments) {
          const subParser = new PostalMime;
          node.subMessage = await subParser.parse(node.content);
          if (!textMap.has(node)) {
            textMap.set(node, {});
          }
          let textEntry = textMap.get(node);
          if (node.subMessage.text || !node.subMessage.html) {
            textEntry.plain = textEntry.plain || [];
            textEntry.plain.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("plain");
          }
          if (node.subMessage.html) {
            textEntry.html = textEntry.html || [];
            textEntry.html.push({ type: "subMessage", value: node.subMessage });
            textTypes.add("html");
          }
          if (subParser.textMap) {
            subParser.textMap.forEach((subTextEntry, subTextNode) => {
              textMap.set(subTextNode, subTextEntry);
            });
          }
          for (let attachment of node.subMessage.attachments || []) {
            this.attachments.push(attachment);
          }
        } else if (this.isInlineTextNode(node)) {
          let textType = node.contentType.parsed.value.substr(node.contentType.parsed.value.indexOf("/") + 1);
          let selectorNode = alternative || node;
          if (!textMap.has(selectorNode)) {
            textMap.set(selectorNode, {});
          }
          let textEntry = textMap.get(selectorNode);
          textEntry[textType] = textEntry[textType] || [];
          textEntry[textType].push({ type: "text", value: node.getTextContent() });
          textTypes.add(textType);
        } else if (node.content) {
          const filename = node.contentDisposition?.parsed?.params?.filename || node.contentType.parsed.params.name || null;
          const attachment = {
            filename: filename ? decodeWords(filename) : null,
            mimeType: node.contentType.parsed.value,
            disposition: node.contentDisposition?.parsed?.value || null
          };
          if (related && node.contentId) {
            attachment.related = true;
          }
          if (node.contentDescription) {
            attachment.description = node.contentDescription;
          }
          if (node.contentId) {
            attachment.contentId = node.contentId;
          }
          switch (node.contentType.parsed.value) {
            case "text/calendar":
            case "application/ics": {
              if (node.contentType.parsed.params.method) {
                attachment.method = node.contentType.parsed.params.method.toString().toUpperCase().trim();
              }
              const decodedText = node.getTextContent().replace(/\r?\n/g, `
`).replace(/\n*$/, `
`);
              attachment.content = textEncoder.encode(decodedText);
              break;
            }
            default:
              attachment.content = node.content;
          }
          this.attachments.push(attachment);
        }
      } else if (node.contentType.multipart === "alternative") {
        alternative = node;
      } else if (node.contentType.multipart === "related") {
        related = node;
      }
      for (let childNode of node.childNodes) {
        await walk(childNode, alternative, related);
      }
    };
    await walk(this.root, false, []);
    textMap.forEach((mapEntry) => {
      textTypes.forEach((textType) => {
        if (!textContent[textType]) {
          textContent[textType] = [];
        }
        if (mapEntry[textType]) {
          mapEntry[textType].forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                textContent[textType].push(textEntry.value);
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        } else {
          let alternativeType;
          switch (textType) {
            case "html":
              alternativeType = "plain";
              break;
            case "plain":
              alternativeType = "html";
              break;
          }
          (mapEntry[alternativeType] || []).forEach((textEntry) => {
            switch (textEntry.type) {
              case "text":
                switch (textType) {
                  case "html":
                    textContent[textType].push(textToHtml(textEntry.value));
                    break;
                  case "plain":
                    textContent[textType].push(htmlToText(textEntry.value));
                    break;
                }
                break;
              case "subMessage":
                {
                  switch (textType) {
                    case "html":
                      textContent[textType].push(formatHtmlHeader(textEntry.value));
                      break;
                    case "plain":
                      textContent[textType].push(formatTextHeader(textEntry.value));
                      break;
                  }
                }
                break;
            }
          });
        }
      });
    });
    Object.keys(textContent).forEach((textType) => {
      textContent[textType] = textContent[textType].join(`
`);
    });
    this.textContent = textContent;
  }
  isInlineTextNode(node) {
    if (node.contentDisposition?.parsed?.value === "attachment") {
      return false;
    }
    switch (node.contentType.parsed?.value) {
      case "text/html":
      case "text/plain":
        return true;
      case "text/calendar":
      case "text/csv":
      default:
        return false;
    }
  }
  isInlineMessageRfc822(node) {
    if (node.contentType.parsed?.value !== "message/rfc822") {
      return false;
    }
    let disposition = node.contentDisposition?.parsed?.value || (this.options.rfc822Attachments ? "attachment" : "inline");
    return disposition === "inline";
  }
  forceRfc822Attachments() {
    if (this.options.forceRfc822Attachments) {
      return true;
    }
    let forceRfc822Attachments = false;
    let walk = (node) => {
      if (!node.contentType.multipart) {
        if (node.contentType.parsed && ["message/delivery-status", "message/feedback-report"].includes(node.contentType.parsed.value)) {
          forceRfc822Attachments = true;
        }
      }
      for (let childNode of node.childNodes) {
        walk(childNode);
      }
    };
    walk(this.root);
    return forceRfc822Attachments;
  }
  async resolveStream(stream) {
    let chunkLen = 0;
    let chunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      chunkLen += value.length;
    }
    const result = new Uint8Array(chunkLen);
    let chunkPointer = 0;
    for (let chunk of chunks) {
      result.set(chunk, chunkPointer);
      chunkPointer += chunk.length;
    }
    return result;
  }
  async parse(buf) {
    if (this.started) {
      throw new Error("Can not reuse parser, create a new PostalMime object");
    }
    this.started = true;
    if (buf && typeof buf.getReader === "function") {
      buf = await this.resolveStream(buf);
    }
    buf = buf || new ArrayBuffer(0);
    if (typeof buf === "string") {
      buf = textEncoder.encode(buf);
    }
    if (buf instanceof Blob || Object.prototype.toString.call(buf) === "[object Blob]") {
      buf = await blobToArrayBuffer(buf);
    }
    if (buf.buffer instanceof ArrayBuffer) {
      buf = new Uint8Array(buf).buffer;
    }
    this.buf = buf;
    this.av = new Uint8Array(buf);
    this.readPos = 0;
    while (this.readPos < this.av.length) {
      const line = this.readLine();
      await this.processLine(line.bytes, line.done);
    }
    await this.processNodeTree();
    const message = {
      headers: this.root.headers.map((entry) => ({ key: entry.key, value: entry.value })).reverse()
    };
    for (const key of ["from", "sender"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length) {
          message[key] = addresses[0];
        }
      }
    }
    for (const key of ["delivered-to", "return-path"]) {
      const addressHeader = this.root.headers.find((line) => line.key === key);
      if (addressHeader && addressHeader.value) {
        const addresses = address_parser_default(addressHeader.value);
        if (addresses && addresses.length && addresses[0].address) {
          const camelKey = key.replace(/\-(.)/g, (o, c) => c.toUpperCase());
          message[camelKey] = addresses[0].address;
        }
      }
    }
    for (const key of ["to", "cc", "bcc", "reply-to"]) {
      const addressHeaders = this.root.headers.filter((line) => line.key === key);
      let addresses = [];
      addressHeaders.filter((entry) => entry && entry.value).map((entry) => address_parser_default(entry.value)).forEach((parsed) => addresses = addresses.concat(parsed || []));
      if (addresses && addresses.length) {
        const camelKey = key.replace(/\-(.)/g, (o, c) => c.toUpperCase());
        message[camelKey] = addresses;
      }
    }
    for (const key of ["subject", "message-id", "in-reply-to", "references"]) {
      const header = this.root.headers.find((line) => line.key === key);
      if (header && header.value) {
        const camelKey = key.replace(/\-(.)/g, (o, c) => c.toUpperCase());
        message[camelKey] = decodeWords(header.value);
      }
    }
    let dateHeader = this.root.headers.find((line) => line.key === "date");
    if (dateHeader) {
      let date = new Date(dateHeader.value);
      if (!date || date.toString() === "Invalid Date") {
        date = dateHeader.value;
      } else {
        date = date.toISOString();
      }
      message.date = date;
    }
    if (this.textContent?.html) {
      message.html = this.textContent.html;
    }
    if (this.textContent?.plain) {
      message.text = this.textContent.plain;
    }
    message.attachments = this.attachments;
    message.headerLines = (this.root.rawHeaderLines || []).slice().reverse();
    switch (this.attachmentEncoding) {
      case "arraybuffer":
        break;
      case "base64":
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = base64ArrayBuffer(attachment.content);
            attachment.encoding = "base64";
          }
        }
        break;
      case "utf8":
        let attachmentDecoder = new TextDecoder("utf8");
        for (let attachment of message.attachments || []) {
          if (attachment?.content) {
            attachment.content = attachmentDecoder.decode(attachment.content);
            attachment.encoding = "utf8";
          }
        }
        break;
      default:
        throw new Error("Unknwon attachment encoding");
    }
    return message;
  }
}
var MAX_NESTING_DEPTH = 256, MAX_HEADERS_SIZE;
var init_postal_mime = __esm(() => {
  init_mime_node();
  init_text_format();
  init_address_parser();
  init_decode_strings();
  MAX_HEADERS_SIZE = 2 * 1024 * 1024;
});

// node_modules/svix/dist/models/applicationIn.js
var require_applicationIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApplicationInSerializer = undefined;
  exports.ApplicationInSerializer = {
    _fromJsonObject(object) {
      return {
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/applicationOut.js
var require_applicationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApplicationOutSerializer = undefined;
  exports.ApplicationOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        id: object["id"],
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        id: self.id,
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/applicationPatch.js
var require_applicationPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApplicationPatchSerializer = undefined;
  exports.ApplicationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseApplicationOut.js
var require_listResponseApplicationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseApplicationOutSerializer = undefined;
  var applicationOut_1 = require_applicationOut();
  exports.ListResponseApplicationOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApiException = undefined;

  class ApiException extends Error {
    constructor(code, body, headers) {
      super(`HTTP-Code: ${code}
Headers: ${JSON.stringify(headers)}`);
      this.code = code;
      this.body = body;
      this.headers = {};
      headers.forEach((value, name) => {
        this.headers[name] = value;
      });
    }
  }
  exports.ApiException = ApiException;
});

// node_modules/uuid/dist/max.js
var require_max = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = "ffffffff-ffff-ffff-ffff-ffffffffffff";
});

// node_modules/uuid/dist/nil.js
var require_nil = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = "00000000-0000-0000-0000-000000000000";
});

// node_modules/uuid/dist/regex.js
var require_regex = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = exports.default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
});

// node_modules/uuid/dist/validate.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _regex = _interopRequireDefault(require_regex());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function validate(uuid) {
    return typeof uuid === "string" && _regex.default.test(uuid);
  }
  var _default = exports.default = validate;
});

// node_modules/uuid/dist/parse.js
var require_parse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function parse(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = exports.default = parse;
});

// node_modules/uuid/dist/stringify.js
var require_stringify = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  exports.unsafeStringify = unsafeStringify;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var byteToHex = [];
  for (let i2 = 0;i2 < 256; ++i2) {
    byteToHex.push((i2 + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }
  function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
  }
  var _default = exports.default = stringify;
});

// node_modules/uuid/dist/rng.js
var require_rng = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = rng;
  var _nodeCrypto = _interopRequireDefault(__require("node:crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var rnds8Pool = new Uint8Array(256);
  var poolPtr = rnds8Pool.length;
  function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
      _nodeCrypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
});

// node_modules/uuid/dist/v1.js
var require_v1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _nodeId;
  var _clockseq;
  var _lastMSecs = 0;
  var _lastNSecs = 0;
  function v1(options, buf, offset) {
    let i2 = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node;
    let clockseq = options.clockseq;
    if (!options._v6) {
      if (!node) {
        node = _nodeId;
      }
      if (clockseq == null) {
        clockseq = _clockseq;
      }
    }
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = [seedBytes[0], seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
        if (!_nodeId && !options._v6) {
          node[0] |= 1;
          _nodeId = node;
        }
      }
      if (clockseq == null) {
        clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
        if (_clockseq === undefined && !options._v6) {
          _clockseq = clockseq;
        }
      }
    }
    let msecs = options.msecs !== undefined ? options.msecs : Date.now();
    let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === undefined) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 12219292800000;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i2++] = tl >>> 24 & 255;
    b[i2++] = tl >>> 16 & 255;
    b[i2++] = tl >>> 8 & 255;
    b[i2++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i2++] = tmh >>> 8 & 255;
    b[i2++] = tmh & 255;
    b[i2++] = tmh >>> 24 & 15 | 16;
    b[i2++] = tmh >>> 16 & 255;
    b[i2++] = clockseq >>> 8 | 128;
    b[i2++] = clockseq & 255;
    for (let n = 0;n < 6; ++n) {
      b[i2 + n] = node[n];
    }
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = exports.default = v1;
});

// node_modules/uuid/dist/v1ToV6.js
var require_v1ToV6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v1ToV6;
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === "string" ? (0, _parse.default)(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === "string" ? (0, _stringify.unsafeStringify)(v6Bytes) : v6Bytes;
  }
  function _v1ToV6(v1Bytes, randomize = false) {
    return Uint8Array.of((v1Bytes[6] & 15) << 4 | v1Bytes[7] >> 4 & 15, (v1Bytes[7] & 15) << 4 | (v1Bytes[4] & 240) >> 4, (v1Bytes[4] & 15) << 4 | (v1Bytes[5] & 240) >> 4, (v1Bytes[5] & 15) << 4 | (v1Bytes[0] & 240) >> 4, (v1Bytes[0] & 15) << 4 | (v1Bytes[1] & 240) >> 4, (v1Bytes[1] & 15) << 4 | (v1Bytes[2] & 240) >> 4, 96 | v1Bytes[2] & 15, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
  }
});

// node_modules/uuid/dist/v35.js
var require_v35 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.URL = exports.DNS = undefined;
  exports.default = v35;
  var _stringify = require_stringify();
  var _parse = _interopRequireDefault(require_parse());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i2 = 0;i2 < str.length; ++i2) {
      bytes.push(str.charCodeAt(i2));
    }
    return bytes;
  }
  var DNS = exports.DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  var URL2 = exports.URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  function v35(name, version, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      var _namespace;
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (((_namespace = namespace) === null || _namespace === undefined ? undefined : _namespace.length) !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i2 = 0;i2 < 16; ++i2) {
          buf[offset + i2] = bytes[i2];
        }
        return buf;
      }
      return (0, _stringify.unsafeStringify)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {}
    generateUUID.DNS = DNS;
    generateUUID.URL = URL2;
    return generateUUID;
  }
});

// node_modules/uuid/dist/md5.js
var require_md5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("node:crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function md5(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _nodeCrypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = exports.default = md5;
});

// node_modules/uuid/dist/v3.js
var require_v3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _md = _interopRequireDefault(require_md5());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var v3 = (0, _v.default)("v3", 48, _md.default);
  var _default = exports.default = v3;
});

// node_modules/uuid/dist/native.js
var require_native = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("node:crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _default = exports.default = {
    randomUUID: _nodeCrypto.default.randomUUID
  };
});

// node_modules/uuid/dist/v4.js
var require_v4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _native = _interopRequireDefault(require_native());
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v4(options, buf, offset) {
    if (_native.default.randomUUID && !buf && !options) {
      return _native.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i2 = 0;i2 < 16; ++i2) {
        buf[offset + i2] = rnds[i2];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(rnds);
  }
  var _default = exports.default = v4;
});

// node_modules/uuid/dist/sha1.js
var require_sha1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _nodeCrypto = _interopRequireDefault(__require("node:crypto"));
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function sha1(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _nodeCrypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = exports.default = sha1;
});

// node_modules/uuid/dist/v5.js
var require_v5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _sha = _interopRequireDefault(require_sha1());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var v5 = (0, _v.default)("v5", 80, _sha.default);
  var _default = exports.default = v5;
});

// node_modules/uuid/dist/v6.js
var require_v6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v6;
  var _stringify = require_stringify();
  var _v = _interopRequireDefault(require_v1());
  var _v1ToV = _interopRequireDefault(require_v1ToV6());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v6(options = {}, buf, offset = 0) {
    let bytes = (0, _v.default)({
      ...options,
      _v6: true
    }, new Uint8Array(16));
    bytes = (0, _v1ToV.default)(bytes);
    if (buf) {
      for (let i2 = 0;i2 < 16; i2++) {
        buf[offset + i2] = bytes[i2];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(bytes);
  }
});

// node_modules/uuid/dist/v6ToV1.js
var require_v6ToV1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = v6ToV1;
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === "string" ? (0, _parse.default)(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === "string" ? (0, _stringify.unsafeStringify)(v1Bytes) : v1Bytes;
  }
  function _v6ToV1(v6Bytes) {
    return Uint8Array.of((v6Bytes[3] & 15) << 4 | v6Bytes[4] >> 4 & 15, (v6Bytes[4] & 15) << 4 | (v6Bytes[5] & 240) >> 4, (v6Bytes[5] & 15) << 4 | v6Bytes[6] & 15, v6Bytes[7], (v6Bytes[1] & 15) << 4 | (v6Bytes[2] & 240) >> 4, (v6Bytes[2] & 15) << 4 | (v6Bytes[3] & 240) >> 4, 16 | (v6Bytes[0] & 240) >> 4, (v6Bytes[0] & 15) << 4 | (v6Bytes[1] & 240) >> 4, v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
  }
});

// node_modules/uuid/dist/v7.js
var require_v7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _seqLow = null;
  var _seqHigh = null;
  var _msecs = 0;
  function v7(options, buf, offset) {
    options = options || {};
    let i2 = buf && offset || 0;
    const b = buf || new Uint8Array(16);
    const rnds = options.random || (options.rng || _rng.default)();
    const msecs = options.msecs !== undefined ? options.msecs : Date.now();
    let seq = options.seq !== undefined ? options.seq : null;
    let seqHigh = _seqHigh;
    let seqLow = _seqLow;
    if (msecs > _msecs && options.msecs === undefined) {
      _msecs = msecs;
      if (seq !== null) {
        seqHigh = null;
        seqLow = null;
      }
    }
    if (seq !== null) {
      if (seq > 2147483647) {
        seq = 2147483647;
      }
      seqHigh = seq >>> 19 & 4095;
      seqLow = seq & 524287;
    }
    if (seqHigh === null || seqLow === null) {
      seqHigh = rnds[6] & 127;
      seqHigh = seqHigh << 8 | rnds[7];
      seqLow = rnds[8] & 63;
      seqLow = seqLow << 8 | rnds[9];
      seqLow = seqLow << 5 | rnds[10] >>> 3;
    }
    if (msecs + 1e4 > _msecs && seq === null) {
      if (++seqLow > 524287) {
        seqLow = 0;
        if (++seqHigh > 4095) {
          seqHigh = 0;
          _msecs++;
        }
      }
    } else {
      _msecs = msecs;
    }
    _seqHigh = seqHigh;
    _seqLow = seqLow;
    b[i2++] = _msecs / 1099511627776 & 255;
    b[i2++] = _msecs / 4294967296 & 255;
    b[i2++] = _msecs / 16777216 & 255;
    b[i2++] = _msecs / 65536 & 255;
    b[i2++] = _msecs / 256 & 255;
    b[i2++] = _msecs & 255;
    b[i2++] = seqHigh >>> 4 & 15 | 112;
    b[i2++] = seqHigh & 255;
    b[i2++] = seqLow >>> 13 & 63 | 128;
    b[i2++] = seqLow >>> 5 & 255;
    b[i2++] = seqLow << 3 & 255 | rnds[10] & 7;
    b[i2++] = rnds[11];
    b[i2++] = rnds[12];
    b[i2++] = rnds[13];
    b[i2++] = rnds[14];
    b[i2++] = rnds[15];
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = exports.default = v7;
});

// node_modules/uuid/dist/version.js
var require_version = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function version(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid.slice(14, 15), 16);
  }
  var _default = exports.default = version;
});

// node_modules/uuid/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "MAX", {
    enumerable: true,
    get: function() {
      return _max.default;
    }
  });
  Object.defineProperty(exports, "NIL", {
    enumerable: true,
    get: function() {
      return _nil.default;
    }
  });
  Object.defineProperty(exports, "parse", {
    enumerable: true,
    get: function() {
      return _parse.default;
    }
  });
  Object.defineProperty(exports, "stringify", {
    enumerable: true,
    get: function() {
      return _stringify.default;
    }
  });
  Object.defineProperty(exports, "v1", {
    enumerable: true,
    get: function() {
      return _v.default;
    }
  });
  Object.defineProperty(exports, "v1ToV6", {
    enumerable: true,
    get: function() {
      return _v1ToV.default;
    }
  });
  Object.defineProperty(exports, "v3", {
    enumerable: true,
    get: function() {
      return _v2.default;
    }
  });
  Object.defineProperty(exports, "v4", {
    enumerable: true,
    get: function() {
      return _v3.default;
    }
  });
  Object.defineProperty(exports, "v5", {
    enumerable: true,
    get: function() {
      return _v4.default;
    }
  });
  Object.defineProperty(exports, "v6", {
    enumerable: true,
    get: function() {
      return _v5.default;
    }
  });
  Object.defineProperty(exports, "v6ToV1", {
    enumerable: true,
    get: function() {
      return _v6ToV.default;
    }
  });
  Object.defineProperty(exports, "v7", {
    enumerable: true,
    get: function() {
      return _v6.default;
    }
  });
  Object.defineProperty(exports, "validate", {
    enumerable: true,
    get: function() {
      return _validate.default;
    }
  });
  Object.defineProperty(exports, "version", {
    enumerable: true,
    get: function() {
      return _version.default;
    }
  });
  var _max = _interopRequireDefault(require_max());
  var _nil = _interopRequireDefault(require_nil());
  var _parse = _interopRequireDefault(require_parse());
  var _stringify = _interopRequireDefault(require_stringify());
  var _v = _interopRequireDefault(require_v1());
  var _v1ToV = _interopRequireDefault(require_v1ToV6());
  var _v2 = _interopRequireDefault(require_v3());
  var _v3 = _interopRequireDefault(require_v4());
  var _v4 = _interopRequireDefault(require_v5());
  var _v5 = _interopRequireDefault(require_v6());
  var _v6ToV = _interopRequireDefault(require_v6ToV1());
  var _v6 = _interopRequireDefault(require_v7());
  var _validate = _interopRequireDefault(require_validate());
  var _version = _interopRequireDefault(require_version());
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : { default: e };
  }
});

// node_modules/svix/dist/request.js
var require_request = __commonJS((exports) => {
  var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SvixRequest = exports.HttpMethod = exports.LIB_VERSION = undefined;
  var util_1 = require_util();
  var uuid_1 = require_dist();
  exports.LIB_VERSION = "1.84.1";
  var USER_AGENT = `svix-libs/${exports.LIB_VERSION}/javascript`;
  var HttpMethod;
  (function(HttpMethod2) {
    HttpMethod2["GET"] = "GET";
    HttpMethod2["HEAD"] = "HEAD";
    HttpMethod2["POST"] = "POST";
    HttpMethod2["PUT"] = "PUT";
    HttpMethod2["DELETE"] = "DELETE";
    HttpMethod2["CONNECT"] = "CONNECT";
    HttpMethod2["OPTIONS"] = "OPTIONS";
    HttpMethod2["TRACE"] = "TRACE";
    HttpMethod2["PATCH"] = "PATCH";
  })(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));

  class SvixRequest {
    constructor(method, path) {
      this.method = method;
      this.path = path;
      this.queryParams = {};
      this.headerParams = {};
    }
    setPathParam(name, value) {
      const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
      if (this.path === newPath) {
        throw new Error(`path parameter ${name} not found`);
      }
      this.path = newPath;
    }
    setQueryParams(params) {
      for (const [name, value] of Object.entries(params)) {
        this.setQueryParam(name, value);
      }
    }
    setQueryParam(name, value) {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === "string") {
        this.queryParams[name] = value;
      } else if (typeof value === "boolean" || typeof value === "number") {
        this.queryParams[name] = value.toString();
      } else if (value instanceof Date) {
        this.queryParams[name] = value.toISOString();
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          this.queryParams[name] = value.join(",");
        }
      } else {
        const _assert_unreachable = value;
        throw new Error(`query parameter ${name} has unsupported type`);
      }
    }
    setHeaderParam(name, value) {
      if (value === undefined) {
        return;
      }
      this.headerParams[name] = value;
    }
    setBody(value) {
      this.body = JSON.stringify(value);
    }
    send(ctx, parseResponseBody) {
      return __awaiter(this, undefined, undefined, function* () {
        const response = yield this.sendInner(ctx);
        if (response.status === 204) {
          return null;
        }
        const responseBody = yield response.text();
        return parseResponseBody(JSON.parse(responseBody));
      });
    }
    sendNoResponseBody(ctx) {
      return __awaiter(this, undefined, undefined, function* () {
        yield this.sendInner(ctx);
      });
    }
    sendInner(ctx) {
      var _a, _b;
      return __awaiter(this, undefined, undefined, function* () {
        const url = new URL(ctx.baseUrl + this.path);
        for (const [name, value] of Object.entries(this.queryParams)) {
          url.searchParams.set(name, value);
        }
        if (this.headerParams["idempotency-key"] === undefined && this.method.toUpperCase() === "POST") {
          this.headerParams["idempotency-key"] = `auto_${(0, uuid_1.v4)()}`;
        }
        const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        if (this.body != null) {
          this.headerParams["content-type"] = "application/json";
        }
        const isCredentialsSupported = "credentials" in Request.prototype;
        const response = yield sendWithRetry(url, {
          method: this.method.toString(),
          body: this.body,
          headers: Object.assign({ accept: "application/json, */*;q=0.8", authorization: `Bearer ${ctx.token}`, "user-agent": USER_AGENT, "svix-req-id": randomId.toString() }, this.headerParams),
          credentials: isCredentialsSupported ? "same-origin" : undefined,
          signal: ctx.timeout !== undefined ? AbortSignal.timeout(ctx.timeout) : undefined
        }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === undefined ? undefined : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === undefined ? undefined : _b.length) || ctx.numRetries, ctx.fetch);
        return filterResponseForErrors(response);
      });
    }
  }
  exports.SvixRequest = SvixRequest;
  function filterResponseForErrors(response) {
    return __awaiter(this, undefined, undefined, function* () {
      if (response.status < 300) {
        return response;
      }
      const responseBody = yield response.text();
      if (response.status === 422) {
        throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
      }
      if (response.status >= 400 && response.status <= 499) {
        throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
      }
      throw new util_1.ApiException(response.status, responseBody, response.headers);
    });
  }
  function sendWithRetry(url, init, retryScheduleInMs, nextInterval = 50, triesLeft = 2, fetchImpl = fetch, retryCount = 1) {
    return __awaiter(this, undefined, undefined, function* () {
      const sleep = (interval) => new Promise((resolve) => setTimeout(resolve, interval));
      try {
        const response = yield fetchImpl(url, init);
        if (triesLeft <= 0 || response.status < 500) {
          return response;
        }
      } catch (e) {
        if (triesLeft <= 0) {
          throw e;
        }
      }
      yield sleep(nextInterval);
      init.headers["svix-retry-count"] = retryCount.toString();
      nextInterval = (retryScheduleInMs === null || retryScheduleInMs === undefined ? undefined : retryScheduleInMs[retryCount]) || nextInterval * 2;
      return yield sendWithRetry(url, init, retryScheduleInMs, nextInterval, --triesLeft, fetchImpl, ++retryCount);
    });
  }
});

// node_modules/svix/dist/api/application.js
var require_application = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Application = undefined;
  var applicationIn_1 = require_applicationIn();
  var applicationOut_1 = require_applicationOut();
  var applicationPatch_1 = require_applicationPatch();
  var listResponseApplicationOut_1 = require_listResponseApplicationOut();
  var request_1 = require_request();

  class Application {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app");
      request.setQueryParams({
        exclude_apps_with_no_endpoints: options === null || options === undefined ? undefined : options.excludeAppsWithNoEndpoints,
        exclude_apps_with_disabled_endpoints: options === null || options === undefined ? undefined : options.excludeAppsWithDisabledEndpoints,
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseApplicationOut_1.ListResponseApplicationOutSerializer._fromJsonObject);
    }
    create(applicationIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
      return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    getOrCreate(applicationIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
      request.setQueryParam("get_if_exists", true);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
      return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    get(appId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}");
      request.setPathParam("app_id", appId);
      return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    update(appId, applicationIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}");
      request.setPathParam("app_id", appId);
      request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
      return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    delete(appId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}");
      request.setPathParam("app_id", appId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, applicationPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}");
      request.setPathParam("app_id", appId);
      request.setBody(applicationPatch_1.ApplicationPatchSerializer._toJsonObject(applicationPatch));
      return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
  }
  exports.Application = Application;
});

// node_modules/svix/dist/models/apiTokenOut.js
var require_apiTokenOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApiTokenOutSerializer = undefined;
  exports.ApiTokenOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        expiresAt: object["expiresAt"] ? new Date(object["expiresAt"]) : null,
        id: object["id"],
        name: object["name"],
        scopes: object["scopes"],
        token: object["token"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        expiresAt: self.expiresAt,
        id: self.id,
        name: self.name,
        scopes: self.scopes,
        token: self.token
      };
    }
  };
});

// node_modules/svix/dist/models/appPortalCapability.js
var require_appPortalCapability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AppPortalCapabilitySerializer = exports.AppPortalCapability = undefined;
  var AppPortalCapability;
  (function(AppPortalCapability2) {
    AppPortalCapability2["ViewBase"] = "ViewBase";
    AppPortalCapability2["ViewEndpointSecret"] = "ViewEndpointSecret";
    AppPortalCapability2["ManageEndpointSecret"] = "ManageEndpointSecret";
    AppPortalCapability2["ManageTransformations"] = "ManageTransformations";
    AppPortalCapability2["CreateAttempts"] = "CreateAttempts";
    AppPortalCapability2["ManageEndpoint"] = "ManageEndpoint";
  })(AppPortalCapability = exports.AppPortalCapability || (exports.AppPortalCapability = {}));
  exports.AppPortalCapabilitySerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/appPortalAccessIn.js
var require_appPortalAccessIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AppPortalAccessInSerializer = undefined;
  var appPortalCapability_1 = require_appPortalCapability();
  var applicationIn_1 = require_applicationIn();
  exports.AppPortalAccessInSerializer = {
    _fromJsonObject(object) {
      var _a;
      return {
        application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : undefined,
        capabilities: (_a = object["capabilities"]) === null || _a === undefined ? undefined : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
        expiry: object["expiry"],
        featureFlags: object["featureFlags"],
        readOnly: object["readOnly"],
        sessionId: object["sessionId"]
      };
    },
    _toJsonObject(self) {
      var _a;
      return {
        application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : undefined,
        capabilities: (_a = self.capabilities) === null || _a === undefined ? undefined : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
        expiry: self.expiry,
        featureFlags: self.featureFlags,
        readOnly: self.readOnly,
        sessionId: self.sessionId
      };
    }
  };
});

// node_modules/svix/dist/models/appPortalAccessOut.js
var require_appPortalAccessOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AppPortalAccessOutSerializer = undefined;
  exports.AppPortalAccessOutSerializer = {
    _fromJsonObject(object) {
      return {
        token: object["token"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        token: self.token,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/applicationTokenExpireIn.js
var require_applicationTokenExpireIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ApplicationTokenExpireInSerializer = undefined;
  exports.ApplicationTokenExpireInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        sessionIds: object["sessionIds"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        sessionIds: self.sessionIds
      };
    }
  };
});

// node_modules/svix/dist/models/rotatePollerTokenIn.js
var require_rotatePollerTokenIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RotatePollerTokenInSerializer = undefined;
  exports.RotatePollerTokenInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        oldTokenExpiry: object["oldTokenExpiry"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        oldTokenExpiry: self.oldTokenExpiry
      };
    }
  };
});

// node_modules/svix/dist/models/streamPortalAccessIn.js
var require_streamPortalAccessIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamPortalAccessInSerializer = undefined;
  exports.StreamPortalAccessInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        featureFlags: object["featureFlags"],
        sessionId: object["sessionId"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        featureFlags: self.featureFlags,
        sessionId: self.sessionId
      };
    }
  };
});

// node_modules/svix/dist/models/dashboardAccessOut.js
var require_dashboardAccessOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DashboardAccessOutSerializer = undefined;
  exports.DashboardAccessOutSerializer = {
    _fromJsonObject(object) {
      return {
        token: object["token"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        token: self.token,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/api/authentication.js
var require_authentication = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Authentication = undefined;
  var apiTokenOut_1 = require_apiTokenOut();
  var appPortalAccessIn_1 = require_appPortalAccessIn();
  var appPortalAccessOut_1 = require_appPortalAccessOut();
  var applicationTokenExpireIn_1 = require_applicationTokenExpireIn();
  var rotatePollerTokenIn_1 = require_rotatePollerTokenIn();
  var streamPortalAccessIn_1 = require_streamPortalAccessIn();
  var dashboardAccessOut_1 = require_dashboardAccessOut();
  var request_1 = require_request();

  class Authentication {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    appPortalAccess(appId, appPortalAccessIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app-portal-access/{app_id}");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(appPortalAccessIn_1.AppPortalAccessInSerializer._toJsonObject(appPortalAccessIn));
      return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
    }
    expireAll(appId, applicationTokenExpireIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app/{app_id}/expire-all");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(applicationTokenExpireIn_1.ApplicationTokenExpireInSerializer._toJsonObject(applicationTokenExpireIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    dashboardAccess(appId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/dashboard-access/{app_id}");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
    logout(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/logout");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.sendNoResponseBody(this.requestCtx);
    }
    streamPortalAccess(streamId, streamPortalAccessIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream-portal-access/{stream_id}");
      request.setPathParam("stream_id", streamId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(streamPortalAccessIn_1.StreamPortalAccessInSerializer._toJsonObject(streamPortalAccessIn));
      return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
    }
    getStreamPollerToken(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
    }
    rotateStreamPollerToken(streamId, sinkId, rotatePollerTokenIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token/rotate");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(rotatePollerTokenIn_1.RotatePollerTokenInSerializer._toJsonObject(rotatePollerTokenIn));
      return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
    }
  }
  exports.Authentication = Authentication;
});

// node_modules/svix/dist/models/backgroundTaskStatus.js
var require_backgroundTaskStatus = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BackgroundTaskStatusSerializer = exports.BackgroundTaskStatus = undefined;
  var BackgroundTaskStatus;
  (function(BackgroundTaskStatus2) {
    BackgroundTaskStatus2["Running"] = "running";
    BackgroundTaskStatus2["Finished"] = "finished";
    BackgroundTaskStatus2["Failed"] = "failed";
  })(BackgroundTaskStatus = exports.BackgroundTaskStatus || (exports.BackgroundTaskStatus = {}));
  exports.BackgroundTaskStatusSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/backgroundTaskType.js
var require_backgroundTaskType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BackgroundTaskTypeSerializer = exports.BackgroundTaskType = undefined;
  var BackgroundTaskType;
  (function(BackgroundTaskType2) {
    BackgroundTaskType2["EndpointReplay"] = "endpoint.replay";
    BackgroundTaskType2["EndpointRecover"] = "endpoint.recover";
    BackgroundTaskType2["ApplicationStats"] = "application.stats";
    BackgroundTaskType2["MessageBroadcast"] = "message.broadcast";
    BackgroundTaskType2["SdkGenerate"] = "sdk.generate";
    BackgroundTaskType2["EventTypeAggregate"] = "event-type.aggregate";
    BackgroundTaskType2["ApplicationPurgeContent"] = "application.purge_content";
    BackgroundTaskType2["EndpointBulkReplay"] = "endpoint.bulk_replay";
  })(BackgroundTaskType = exports.BackgroundTaskType || (exports.BackgroundTaskType = {}));
  exports.BackgroundTaskTypeSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/backgroundTaskOut.js
var require_backgroundTaskOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BackgroundTaskOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.BackgroundTaskOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"],
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data,
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseBackgroundTaskOut.js
var require_listResponseBackgroundTaskOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseBackgroundTaskOutSerializer = undefined;
  var backgroundTaskOut_1 = require_backgroundTaskOut();
  exports.ListResponseBackgroundTaskOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/backgroundTask.js
var require_backgroundTask = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BackgroundTask = undefined;
  var backgroundTaskOut_1 = require_backgroundTaskOut();
  var listResponseBackgroundTaskOut_1 = require_listResponseBackgroundTaskOut();
  var request_1 = require_request();

  class BackgroundTask {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
      request.setQueryParams({
        status: options === null || options === undefined ? undefined : options.status,
        task: options === null || options === undefined ? undefined : options.task,
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
    }
    listByEndpoint(options) {
      return this.list(options);
    }
    get(taskId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
      request.setPathParam("task_id", taskId);
      return request.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
    }
  }
  exports.BackgroundTask = BackgroundTask;
});

// node_modules/svix/dist/models/connectorKind.js
var require_connectorKind = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorKindSerializer = exports.ConnectorKind = undefined;
  var ConnectorKind;
  (function(ConnectorKind2) {
    ConnectorKind2["Custom"] = "Custom";
    ConnectorKind2["AgenticCommerceProtocol"] = "AgenticCommerceProtocol";
    ConnectorKind2["CloseCrm"] = "CloseCRM";
    ConnectorKind2["CustomerIo"] = "CustomerIO";
    ConnectorKind2["Discord"] = "Discord";
    ConnectorKind2["Hubspot"] = "Hubspot";
    ConnectorKind2["Inngest"] = "Inngest";
    ConnectorKind2["Loops"] = "Loops";
    ConnectorKind2["Otel"] = "Otel";
    ConnectorKind2["Resend"] = "Resend";
    ConnectorKind2["Salesforce"] = "Salesforce";
    ConnectorKind2["Segment"] = "Segment";
    ConnectorKind2["Sendgrid"] = "Sendgrid";
    ConnectorKind2["Slack"] = "Slack";
    ConnectorKind2["Teams"] = "Teams";
    ConnectorKind2["TriggerDev"] = "TriggerDev";
    ConnectorKind2["Windmill"] = "Windmill";
    ConnectorKind2["Zapier"] = "Zapier";
  })(ConnectorKind = exports.ConnectorKind || (exports.ConnectorKind = {}));
  exports.ConnectorKindSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/connectorProduct.js
var require_connectorProduct = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorProductSerializer = exports.ConnectorProduct = undefined;
  var ConnectorProduct;
  (function(ConnectorProduct2) {
    ConnectorProduct2["Dispatch"] = "Dispatch";
    ConnectorProduct2["Stream"] = "Stream";
  })(ConnectorProduct = exports.ConnectorProduct || (exports.ConnectorProduct = {}));
  exports.ConnectorProductSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/connectorIn.js
var require_connectorIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorInSerializer = undefined;
  var connectorKind_1 = require_connectorKind();
  var connectorProduct_1 = require_connectorProduct();
  exports.ConnectorInSerializer = {
    _fromJsonObject(object) {
      return {
        allowedEventTypes: object["allowedEventTypes"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        instructions: object["instructions"],
        kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
        logo: object["logo"],
        name: object["name"],
        productType: object["productType"] ? connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]) : undefined,
        transformation: object["transformation"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        allowedEventTypes: self.allowedEventTypes,
        description: self.description,
        featureFlags: self.featureFlags,
        instructions: self.instructions,
        kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
        logo: self.logo,
        name: self.name,
        productType: self.productType ? connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType) : undefined,
        transformation: self.transformation,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/connectorOut.js
var require_connectorOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorOutSerializer = undefined;
  var connectorKind_1 = require_connectorKind();
  var connectorProduct_1 = require_connectorProduct();
  exports.ConnectorOutSerializer = {
    _fromJsonObject(object) {
      return {
        allowedEventTypes: object["allowedEventTypes"],
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        featureFlags: object["featureFlags"],
        id: object["id"],
        instructions: object["instructions"],
        kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
        logo: object["logo"],
        name: object["name"],
        orgId: object["orgId"],
        productType: connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]),
        transformation: object["transformation"],
        transformationUpdatedAt: new Date(object["transformationUpdatedAt"]),
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        allowedEventTypes: self.allowedEventTypes,
        createdAt: self.createdAt,
        description: self.description,
        featureFlags: self.featureFlags,
        id: self.id,
        instructions: self.instructions,
        kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
        logo: self.logo,
        name: self.name,
        orgId: self.orgId,
        productType: connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType),
        transformation: self.transformation,
        transformationUpdatedAt: self.transformationUpdatedAt,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/connectorPatch.js
var require_connectorPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorPatchSerializer = undefined;
  var connectorKind_1 = require_connectorKind();
  exports.ConnectorPatchSerializer = {
    _fromJsonObject(object) {
      return {
        allowedEventTypes: object["allowedEventTypes"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        instructions: object["instructions"],
        kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
        logo: object["logo"],
        name: object["name"],
        transformation: object["transformation"]
      };
    },
    _toJsonObject(self) {
      return {
        allowedEventTypes: self.allowedEventTypes,
        description: self.description,
        featureFlags: self.featureFlags,
        instructions: self.instructions,
        kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
        logo: self.logo,
        name: self.name,
        transformation: self.transformation
      };
    }
  };
});

// node_modules/svix/dist/models/connectorUpdate.js
var require_connectorUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectorUpdateSerializer = undefined;
  var connectorKind_1 = require_connectorKind();
  exports.ConnectorUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        allowedEventTypes: object["allowedEventTypes"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        instructions: object["instructions"],
        kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
        logo: object["logo"],
        name: object["name"],
        transformation: object["transformation"]
      };
    },
    _toJsonObject(self) {
      return {
        allowedEventTypes: self.allowedEventTypes,
        description: self.description,
        featureFlags: self.featureFlags,
        instructions: self.instructions,
        kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
        logo: self.logo,
        name: self.name,
        transformation: self.transformation
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseConnectorOut.js
var require_listResponseConnectorOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseConnectorOutSerializer = undefined;
  var connectorOut_1 = require_connectorOut();
  exports.ListResponseConnectorOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/connector.js
var require_connector = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Connector = undefined;
  var connectorIn_1 = require_connectorIn();
  var connectorOut_1 = require_connectorOut();
  var connectorPatch_1 = require_connectorPatch();
  var connectorUpdate_1 = require_connectorUpdate();
  var listResponseConnectorOut_1 = require_listResponseConnectorOut();
  var request_1 = require_request();

  class Connector {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order,
        product_type: options === null || options === undefined ? undefined : options.productType
      });
      return request.send(this.requestCtx, listResponseConnectorOut_1.ListResponseConnectorOutSerializer._fromJsonObject);
    }
    create(connectorIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/connector");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(connectorIn_1.ConnectorInSerializer._toJsonObject(connectorIn));
      return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    get(connectorId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector/{connector_id}");
      request.setPathParam("connector_id", connectorId);
      return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    update(connectorId, connectorUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/connector/{connector_id}");
      request.setPathParam("connector_id", connectorId);
      request.setBody(connectorUpdate_1.ConnectorUpdateSerializer._toJsonObject(connectorUpdate));
      return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    delete(connectorId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/connector/{connector_id}");
      request.setPathParam("connector_id", connectorId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(connectorId, connectorPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/connector/{connector_id}");
      request.setPathParam("connector_id", connectorId);
      request.setBody(connectorPatch_1.ConnectorPatchSerializer._toJsonObject(connectorPatch));
      return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
  }
  exports.Connector = Connector;
});

// node_modules/svix/dist/models/endpointHeadersIn.js
var require_endpointHeadersIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointHeadersInSerializer = undefined;
  exports.EndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
});

// node_modules/svix/dist/models/endpointHeadersOut.js
var require_endpointHeadersOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointHeadersOutSerializer = undefined;
  exports.EndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
});

// node_modules/svix/dist/models/endpointHeadersPatchIn.js
var require_endpointHeadersPatchIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointHeadersPatchInSerializer = undefined;
  exports.EndpointHeadersPatchInSerializer = {
    _fromJsonObject(object) {
      return {
        deleteHeaders: object["deleteHeaders"],
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        deleteHeaders: self.deleteHeaders,
        headers: self.headers
      };
    }
  };
});

// node_modules/svix/dist/models/endpointIn.js
var require_endpointIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointInSerializer = undefined;
  exports.EndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        headers: object["headers"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        headers: self.headers,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/models/endpointOut.js
var require_endpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointOutSerializer = undefined;
  exports.EndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/models/endpointPatch.js
var require_endpointPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointPatchSerializer = undefined;
  exports.EndpointPatchSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/models/endpointSecretOut.js
var require_endpointSecretOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointSecretOutSerializer = undefined;
  exports.EndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/endpointSecretRotateIn.js
var require_endpointSecretRotateIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointSecretRotateInSerializer = undefined;
  exports.EndpointSecretRotateInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/endpointStats.js
var require_endpointStats = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointStatsSerializer = undefined;
  exports.EndpointStatsSerializer = {
    _fromJsonObject(object) {
      return {
        fail: object["fail"],
        pending: object["pending"],
        sending: object["sending"],
        success: object["success"]
      };
    },
    _toJsonObject(self) {
      return {
        fail: self.fail,
        pending: self.pending,
        sending: self.sending,
        success: self.success
      };
    }
  };
});

// node_modules/svix/dist/models/endpointTransformationIn.js
var require_endpointTransformationIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointTransformationInSerializer = undefined;
  exports.EndpointTransformationInSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
});

// node_modules/svix/dist/models/endpointTransformationOut.js
var require_endpointTransformationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointTransformationOutSerializer = undefined;
  exports.EndpointTransformationOutSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"],
        updatedAt: object["updatedAt"] ? new Date(object["updatedAt"]) : null
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/endpointTransformationPatch.js
var require_endpointTransformationPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointTransformationPatchSerializer = undefined;
  exports.EndpointTransformationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
});

// node_modules/svix/dist/models/endpointUpdate.js
var require_endpointUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointUpdateSerializer = undefined;
  exports.EndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/models/eventExampleIn.js
var require_eventExampleIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventExampleInSerializer = undefined;
  exports.EventExampleInSerializer = {
    _fromJsonObject(object) {
      return {
        eventType: object["eventType"],
        exampleIndex: object["exampleIndex"]
      };
    },
    _toJsonObject(self) {
      return {
        eventType: self.eventType,
        exampleIndex: self.exampleIndex
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseEndpointOut.js
var require_listResponseEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseEndpointOutSerializer = undefined;
  var endpointOut_1 = require_endpointOut();
  exports.ListResponseEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => endpointOut_1.EndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => endpointOut_1.EndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/messageOut.js
var require_messageOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageOutSerializer = undefined;
  exports.MessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
        eventId: object["eventId"],
        eventType: object["eventType"],
        id: object["id"],
        payload: object["payload"],
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        deliverAt: self.deliverAt,
        eventId: self.eventId,
        eventType: self.eventType,
        id: self.id,
        payload: self.payload,
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
});

// node_modules/svix/dist/models/recoverIn.js
var require_recoverIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RecoverInSerializer = undefined;
  exports.RecoverInSerializer = {
    _fromJsonObject(object) {
      return {
        since: new Date(object["since"]),
        until: object["until"] ? new Date(object["until"]) : null
      };
    },
    _toJsonObject(self) {
      return {
        since: self.since,
        until: self.until
      };
    }
  };
});

// node_modules/svix/dist/models/recoverOut.js
var require_recoverOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RecoverOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.RecoverOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
});

// node_modules/svix/dist/models/replayIn.js
var require_replayIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ReplayInSerializer = undefined;
  exports.ReplayInSerializer = {
    _fromJsonObject(object) {
      return {
        since: new Date(object["since"]),
        until: object["until"] ? new Date(object["until"]) : null
      };
    },
    _toJsonObject(self) {
      return {
        since: self.since,
        until: self.until
      };
    }
  };
});

// node_modules/svix/dist/models/replayOut.js
var require_replayOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ReplayOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.ReplayOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
});

// node_modules/svix/dist/api/endpoint.js
var require_endpoint = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Endpoint = undefined;
  var endpointHeadersIn_1 = require_endpointHeadersIn();
  var endpointHeadersOut_1 = require_endpointHeadersOut();
  var endpointHeadersPatchIn_1 = require_endpointHeadersPatchIn();
  var endpointIn_1 = require_endpointIn();
  var endpointOut_1 = require_endpointOut();
  var endpointPatch_1 = require_endpointPatch();
  var endpointSecretOut_1 = require_endpointSecretOut();
  var endpointSecretRotateIn_1 = require_endpointSecretRotateIn();
  var endpointStats_1 = require_endpointStats();
  var endpointTransformationIn_1 = require_endpointTransformationIn();
  var endpointTransformationOut_1 = require_endpointTransformationOut();
  var endpointTransformationPatch_1 = require_endpointTransformationPatch();
  var endpointUpdate_1 = require_endpointUpdate();
  var eventExampleIn_1 = require_eventExampleIn();
  var listResponseEndpointOut_1 = require_listResponseEndpointOut();
  var messageOut_1 = require_messageOut();
  var recoverIn_1 = require_recoverIn();
  var recoverOut_1 = require_recoverOut();
  var replayIn_1 = require_replayIn();
  var replayOut_1 = require_replayOut();
  var request_1 = require_request();

  class Endpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(appId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint");
      request.setPathParam("app_id", appId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseEndpointOut_1.ListResponseEndpointOutSerializer._fromJsonObject);
    }
    create(appId, endpointIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(endpointIn_1.EndpointInSerializer._toJsonObject(endpointIn));
      return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    get(appId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    update(appId, endpointId, endpointUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointUpdate_1.EndpointUpdateSerializer._toJsonObject(endpointUpdate));
      return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    delete(appId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, endpointId, endpointPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointPatch_1.EndpointPatchSerializer._toJsonObject(endpointPatch));
      return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    getHeaders(appId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(appId, endpointId, endpointHeadersIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointHeadersIn_1.EndpointHeadersInSerializer._toJsonObject(endpointHeadersIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    headersUpdate(appId, endpointId, endpointHeadersIn) {
      return this.updateHeaders(appId, endpointId, endpointHeadersIn);
    }
    patchHeaders(appId, endpointId, endpointHeadersPatchIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointHeadersPatchIn_1.EndpointHeadersPatchInSerializer._toJsonObject(endpointHeadersPatchIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    headersPatch(appId, endpointId, endpointHeadersPatchIn) {
      return this.patchHeaders(appId, endpointId, endpointHeadersPatchIn);
    }
    recover(appId, endpointId, recoverIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(recoverIn_1.RecoverInSerializer._toJsonObject(recoverIn));
      return request.send(this.requestCtx, recoverOut_1.RecoverOutSerializer._fromJsonObject);
    }
    replayMissing(appId, endpointId, replayIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/replay-missing");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(replayIn_1.ReplayInSerializer._toJsonObject(replayIn));
      return request.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
    }
    getSecret(appId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, endpointSecretOut_1.EndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(appId, endpointId, endpointSecretRotateIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    sendExample(appId, endpointId, eventExampleIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(eventExampleIn_1.EventExampleInSerializer._toJsonObject(eventExampleIn));
      return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    getStats(appId, endpointId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setQueryParams({
        since: options === null || options === undefined ? undefined : options.since,
        until: options === null || options === undefined ? undefined : options.until
      });
      return request.send(this.requestCtx, endpointStats_1.EndpointStatsSerializer._fromJsonObject);
    }
    transformationGet(appId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, endpointTransformationOut_1.EndpointTransformationOutSerializer._fromJsonObject);
    }
    patchTransformation(appId, endpointId, endpointTransformationPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointTransformationPatch_1.EndpointTransformationPatchSerializer._toJsonObject(endpointTransformationPatch));
      return request.sendNoResponseBody(this.requestCtx);
    }
    transformationPartialUpdate(appId, endpointId, endpointTransformationIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(endpointTransformationIn_1.EndpointTransformationInSerializer._toJsonObject(endpointTransformationIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.Endpoint = Endpoint;
});

// node_modules/svix/dist/models/eventTypeIn.js
var require_eventTypeIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeInSerializer = undefined;
  exports.EventTypeInSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas
      };
    }
  };
});

// node_modules/svix/dist/models/environmentIn.js
var require_environmentIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EnvironmentInSerializer = undefined;
  var connectorIn_1 = require_connectorIn();
  var eventTypeIn_1 = require_eventTypeIn();
  exports.EnvironmentInSerializer = {
    _fromJsonObject(object) {
      var _a, _b;
      return {
        connectors: (_a = object["connectors"]) === null || _a === undefined ? undefined : _a.map((item) => connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
        eventTypes: (_b = object["eventTypes"]) === null || _b === undefined ? undefined : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
        settings: object["settings"]
      };
    },
    _toJsonObject(self) {
      var _a, _b;
      return {
        connectors: (_a = self.connectors) === null || _a === undefined ? undefined : _a.map((item) => connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
        eventTypes: (_b = self.eventTypes) === null || _b === undefined ? undefined : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
        settings: self.settings
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypeOut.js
var require_eventTypeOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeOutSerializer = undefined;
  exports.EventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        createdAt: new Date(object["createdAt"]),
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        createdAt: self.createdAt,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/environmentOut.js
var require_environmentOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EnvironmentOutSerializer = undefined;
  var connectorOut_1 = require_connectorOut();
  var eventTypeOut_1 = require_eventTypeOut();
  exports.EnvironmentOutSerializer = {
    _fromJsonObject(object) {
      return {
        connectors: object["connectors"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
        createdAt: new Date(object["createdAt"]),
        eventTypes: object["eventTypes"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
        settings: object["settings"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        connectors: self.connectors.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
        createdAt: self.createdAt,
        eventTypes: self.eventTypes.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
        settings: self.settings,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/api/environment.js
var require_environment = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Environment = undefined;
  var environmentIn_1 = require_environmentIn();
  var environmentOut_1 = require_environmentOut();
  var request_1 = require_request();

  class Environment {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    export(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
    }
    import(environmentIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.Environment = Environment;
});

// node_modules/svix/dist/models/eventTypeImportOpenApiIn.js
var require_eventTypeImportOpenApiIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeImportOpenApiInSerializer = undefined;
  exports.EventTypeImportOpenApiInSerializer = {
    _fromJsonObject(object) {
      return {
        dryRun: object["dryRun"],
        replaceAll: object["replaceAll"],
        spec: object["spec"],
        specRaw: object["specRaw"]
      };
    },
    _toJsonObject(self) {
      return {
        dryRun: self.dryRun,
        replaceAll: self.replaceAll,
        spec: self.spec,
        specRaw: self.specRaw
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypeFromOpenApi.js
var require_eventTypeFromOpenApi = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeFromOpenApiSerializer = undefined;
  exports.EventTypeFromOpenApiSerializer = {
    _fromJsonObject(object) {
      return {
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypeImportOpenApiOutData.js
var require_eventTypeImportOpenApiOutData = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeImportOpenApiOutDataSerializer = undefined;
  var eventTypeFromOpenApi_1 = require_eventTypeFromOpenApi();
  exports.EventTypeImportOpenApiOutDataSerializer = {
    _fromJsonObject(object) {
      var _a;
      return {
        modified: object["modified"],
        toModify: (_a = object["to_modify"]) === null || _a === undefined ? undefined : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item))
      };
    },
    _toJsonObject(self) {
      var _a;
      return {
        modified: self.modified,
        to_modify: (_a = self.toModify) === null || _a === undefined ? undefined : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item))
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypeImportOpenApiOut.js
var require_eventTypeImportOpenApiOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeImportOpenApiOutSerializer = undefined;
  var eventTypeImportOpenApiOutData_1 = require_eventTypeImportOpenApiOutData();
  exports.EventTypeImportOpenApiOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"])
      };
    },
    _toJsonObject(self) {
      return {
        data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data)
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypePatch.js
var require_eventTypePatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypePatchSerializer = undefined;
  exports.EventTypePatchSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        schemas: self.schemas
      };
    }
  };
});

// node_modules/svix/dist/models/eventTypeUpdate.js
var require_eventTypeUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventTypeUpdateSerializer = undefined;
  exports.EventTypeUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        schemas: self.schemas
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseEventTypeOut.js
var require_listResponseEventTypeOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseEventTypeOutSerializer = undefined;
  var eventTypeOut_1 = require_eventTypeOut();
  exports.ListResponseEventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/eventType.js
var require_eventType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventType = undefined;
  var eventTypeImportOpenApiIn_1 = require_eventTypeImportOpenApiIn();
  var eventTypeImportOpenApiOut_1 = require_eventTypeImportOpenApiOut();
  var eventTypeIn_1 = require_eventTypeIn();
  var eventTypeOut_1 = require_eventTypeOut();
  var eventTypePatch_1 = require_eventTypePatch();
  var eventTypeUpdate_1 = require_eventTypeUpdate();
  var listResponseEventTypeOut_1 = require_listResponseEventTypeOut();
  var request_1 = require_request();

  class EventType {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order,
        include_archived: options === null || options === undefined ? undefined : options.includeArchived,
        with_content: options === null || options === undefined ? undefined : options.withContent
      });
      return request.send(this.requestCtx, listResponseEventTypeOut_1.ListResponseEventTypeOutSerializer._fromJsonObject);
    }
    create(eventTypeIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(eventTypeIn_1.EventTypeInSerializer._toJsonObject(eventTypeIn));
      return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    importOpenapi(eventTypeImportOpenApiIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type/import/openapi");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(eventTypeImportOpenApiIn_1.EventTypeImportOpenApiInSerializer._toJsonObject(eventTypeImportOpenApiIn));
      return request.send(this.requestCtx, eventTypeImportOpenApiOut_1.EventTypeImportOpenApiOutSerializer._fromJsonObject);
    }
    get(eventTypeName) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type/{event_type_name}");
      request.setPathParam("event_type_name", eventTypeName);
      return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    update(eventTypeName, eventTypeUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/event-type/{event_type_name}");
      request.setPathParam("event_type_name", eventTypeName);
      request.setBody(eventTypeUpdate_1.EventTypeUpdateSerializer._toJsonObject(eventTypeUpdate));
      return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    delete(eventTypeName, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/event-type/{event_type_name}");
      request.setPathParam("event_type_name", eventTypeName);
      request.setQueryParams({
        expunge: options === null || options === undefined ? undefined : options.expunge
      });
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(eventTypeName, eventTypePatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/event-type/{event_type_name}");
      request.setPathParam("event_type_name", eventTypeName);
      request.setBody(eventTypePatch_1.EventTypePatchSerializer._toJsonObject(eventTypePatch));
      return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
  }
  exports.EventType = EventType;
});

// node_modules/svix/dist/api/health.js
var require_health = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Health = undefined;
  var request_1 = require_request();

  class Health {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get() {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.Health = Health;
});

// node_modules/svix/dist/models/ingestSourceConsumerPortalAccessIn.js
var require_ingestSourceConsumerPortalAccessIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestSourceConsumerPortalAccessInSerializer = undefined;
  exports.IngestSourceConsumerPortalAccessInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        readOnly: object["readOnly"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        readOnly: self.readOnly
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointHeadersIn.js
var require_ingestEndpointHeadersIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointHeadersInSerializer = undefined;
  exports.IngestEndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointHeadersOut.js
var require_ingestEndpointHeadersOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointHeadersOutSerializer = undefined;
  exports.IngestEndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointIn.js
var require_ingestEndpointIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointInSerializer = undefined;
  exports.IngestEndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointOut.js
var require_ingestEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointOutSerializer = undefined;
  exports.IngestEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointSecretIn.js
var require_ingestEndpointSecretIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointSecretInSerializer = undefined;
  exports.IngestEndpointSecretInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointSecretOut.js
var require_ingestEndpointSecretOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointSecretOutSerializer = undefined;
  exports.IngestEndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointTransformationOut.js
var require_ingestEndpointTransformationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointTransformationOutSerializer = undefined;
  exports.IngestEndpointTransformationOutSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointTransformationPatch.js
var require_ingestEndpointTransformationPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointTransformationPatchSerializer = undefined;
  exports.IngestEndpointTransformationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
});

// node_modules/svix/dist/models/ingestEndpointUpdate.js
var require_ingestEndpointUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpointUpdateSerializer = undefined;
  exports.IngestEndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseIngestEndpointOut.js
var require_listResponseIngestEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseIngestEndpointOutSerializer = undefined;
  var ingestEndpointOut_1 = require_ingestEndpointOut();
  exports.ListResponseIngestEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/ingestEndpoint.js
var require_ingestEndpoint = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestEndpoint = undefined;
  var ingestEndpointHeadersIn_1 = require_ingestEndpointHeadersIn();
  var ingestEndpointHeadersOut_1 = require_ingestEndpointHeadersOut();
  var ingestEndpointIn_1 = require_ingestEndpointIn();
  var ingestEndpointOut_1 = require_ingestEndpointOut();
  var ingestEndpointSecretIn_1 = require_ingestEndpointSecretIn();
  var ingestEndpointSecretOut_1 = require_ingestEndpointSecretOut();
  var ingestEndpointTransformationOut_1 = require_ingestEndpointTransformationOut();
  var ingestEndpointTransformationPatch_1 = require_ingestEndpointTransformationPatch();
  var ingestEndpointUpdate_1 = require_ingestEndpointUpdate();
  var listResponseIngestEndpointOut_1 = require_listResponseIngestEndpointOut();
  var request_1 = require_request();

  class IngestEndpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(sourceId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint");
      request.setPathParam("source_id", sourceId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseIngestEndpointOut_1.ListResponseIngestEndpointOutSerializer._fromJsonObject);
    }
    create(sourceId, ingestEndpointIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint");
      request.setPathParam("source_id", sourceId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(ingestEndpointIn_1.IngestEndpointInSerializer._toJsonObject(ingestEndpointIn));
      return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    get(sourceId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    update(sourceId, endpointId, ingestEndpointUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(ingestEndpointUpdate_1.IngestEndpointUpdateSerializer._toJsonObject(ingestEndpointUpdate));
      return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    delete(sourceId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(sourceId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, ingestEndpointHeadersOut_1.IngestEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(sourceId, endpointId, ingestEndpointHeadersIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(ingestEndpointHeadersIn_1.IngestEndpointHeadersInSerializer._toJsonObject(ingestEndpointHeadersIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    getSecret(sourceId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, ingestEndpointSecretOut_1.IngestEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(sourceId, endpointId, ingestEndpointSecretIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret/rotate");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(ingestEndpointSecretIn_1.IngestEndpointSecretInSerializer._toJsonObject(ingestEndpointSecretIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    getTransformation(sourceId, endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, ingestEndpointTransformationOut_1.IngestEndpointTransformationOutSerializer._fromJsonObject);
    }
    setTransformation(sourceId, endpointId, ingestEndpointTransformationPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
      request.setPathParam("source_id", sourceId);
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(ingestEndpointTransformationPatch_1.IngestEndpointTransformationPatchSerializer._toJsonObject(ingestEndpointTransformationPatch));
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.IngestEndpoint = IngestEndpoint;
});

// node_modules/svix/dist/models/adobeSignConfig.js
var require_adobeSignConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AdobeSignConfigSerializer = undefined;
  exports.AdobeSignConfigSerializer = {
    _fromJsonObject(object) {
      return {
        clientId: object["clientId"]
      };
    },
    _toJsonObject(self) {
      return {
        clientId: self.clientId
      };
    }
  };
});

// node_modules/svix/dist/models/airwallexConfig.js
var require_airwallexConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AirwallexConfigSerializer = undefined;
  exports.AirwallexConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/checkbookConfig.js
var require_checkbookConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CheckbookConfigSerializer = undefined;
  exports.CheckbookConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/cronConfig.js
var require_cronConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CronConfigSerializer = undefined;
  exports.CronConfigSerializer = {
    _fromJsonObject(object) {
      return {
        contentType: object["contentType"],
        payload: object["payload"],
        schedule: object["schedule"]
      };
    },
    _toJsonObject(self) {
      return {
        contentType: self.contentType,
        payload: self.payload,
        schedule: self.schedule
      };
    }
  };
});

// node_modules/svix/dist/models/docusignConfig.js
var require_docusignConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DocusignConfigSerializer = undefined;
  exports.DocusignConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/easypostConfig.js
var require_easypostConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EasypostConfigSerializer = undefined;
  exports.EasypostConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/githubConfig.js
var require_githubConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GithubConfigSerializer = undefined;
  exports.GithubConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/hubspotConfig.js
var require_hubspotConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HubspotConfigSerializer = undefined;
  exports.HubspotConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/orumIoConfig.js
var require_orumIoConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OrumIoConfigSerializer = undefined;
  exports.OrumIoConfigSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
});

// node_modules/svix/dist/models/pandaDocConfig.js
var require_pandaDocConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PandaDocConfigSerializer = undefined;
  exports.PandaDocConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/portIoConfig.js
var require_portIoConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PortIoConfigSerializer = undefined;
  exports.PortIoConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/rutterConfig.js
var require_rutterConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RutterConfigSerializer = undefined;
  exports.RutterConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/segmentConfig.js
var require_segmentConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SegmentConfigSerializer = undefined;
  exports.SegmentConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/shopifyConfig.js
var require_shopifyConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ShopifyConfigSerializer = undefined;
  exports.ShopifyConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/slackConfig.js
var require_slackConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SlackConfigSerializer = undefined;
  exports.SlackConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/stripeConfig.js
var require_stripeConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StripeConfigSerializer = undefined;
  exports.StripeConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/svixConfig.js
var require_svixConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SvixConfigSerializer = undefined;
  exports.SvixConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/telnyxConfig.js
var require_telnyxConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TelnyxConfigSerializer = undefined;
  exports.TelnyxConfigSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
});

// node_modules/svix/dist/models/vapiConfig.js
var require_vapiConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VapiConfigSerializer = undefined;
  exports.VapiConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/veriffConfig.js
var require_veriffConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VeriffConfigSerializer = undefined;
  exports.VeriffConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/zoomConfig.js
var require_zoomConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ZoomConfigSerializer = undefined;
  exports.ZoomConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
});

// node_modules/svix/dist/models/ingestSourceIn.js
var require_ingestSourceIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestSourceInSerializer = undefined;
  var adobeSignConfig_1 = require_adobeSignConfig();
  var airwallexConfig_1 = require_airwallexConfig();
  var checkbookConfig_1 = require_checkbookConfig();
  var cronConfig_1 = require_cronConfig();
  var docusignConfig_1 = require_docusignConfig();
  var easypostConfig_1 = require_easypostConfig();
  var githubConfig_1 = require_githubConfig();
  var hubspotConfig_1 = require_hubspotConfig();
  var orumIoConfig_1 = require_orumIoConfig();
  var pandaDocConfig_1 = require_pandaDocConfig();
  var portIoConfig_1 = require_portIoConfig();
  var rutterConfig_1 = require_rutterConfig();
  var segmentConfig_1 = require_segmentConfig();
  var shopifyConfig_1 = require_shopifyConfig();
  var slackConfig_1 = require_slackConfig();
  var stripeConfig_1 = require_stripeConfig();
  var svixConfig_1 = require_svixConfig();
  var telnyxConfig_1 = require_telnyxConfig();
  var vapiConfig_1 = require_vapiConfig();
  var veriffConfig_1 = require_veriffConfig();
  var zoomConfig_1 = require_zoomConfig();
  exports.IngestSourceInSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "generic-webhook":
            return {};
          case "cron":
            return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
          case "adobe-sign":
            return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
          case "beehiiv":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "brex":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "checkbook":
            return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
          case "clerk":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "docusign":
            return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
          case "easypost":
            return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
          case "github":
            return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
          case "guesty":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "hubspot":
            return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
          case "incident-io":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "lithic":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "nash":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "orum-io":
            return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
          case "panda-doc":
            return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
          case "port-io":
            return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
          case "pleo":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "replicate":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "resend":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "rutter":
            return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
          case "safebase":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "sardine":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "segment":
            return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
          case "shopify":
            return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
          case "slack":
            return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
          case "stripe":
            return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
          case "stych":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "svix":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "zoom":
            return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
          case "telnyx":
            return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
          case "vapi":
            return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
          case "open-ai":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "render":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "veriff":
            return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
          case "airwallex":
            return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "generic-webhook":
          config = {};
          break;
        case "cron":
          config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
          break;
        case "adobe-sign":
          config = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
          break;
        case "beehiiv":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "brex":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "checkbook":
          config = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
          break;
        case "clerk":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "docusign":
          config = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
          break;
        case "easypost":
          config = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
          break;
        case "github":
          config = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
          break;
        case "guesty":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "hubspot":
          config = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
          break;
        case "incident-io":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "lithic":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "nash":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "orum-io":
          config = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
          break;
        case "panda-doc":
          config = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
          break;
        case "port-io":
          config = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
          break;
        case "pleo":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "replicate":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "resend":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "rutter":
          config = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
          break;
        case "safebase":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "sardine":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "segment":
          config = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
          break;
        case "shopify":
          config = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
          break;
        case "slack":
          config = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
          break;
        case "stripe":
          config = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
          break;
        case "stych":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "svix":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "zoom":
          config = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
          break;
        case "telnyx":
          config = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
          break;
        case "vapi":
          config = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
          break;
        case "open-ai":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "render":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "veriff":
          config = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
          break;
        case "airwallex":
          config = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        metadata: self.metadata,
        name: self.name,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/adobeSignConfigOut.js
var require_adobeSignConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AdobeSignConfigOutSerializer = undefined;
  exports.AdobeSignConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/airwallexConfigOut.js
var require_airwallexConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AirwallexConfigOutSerializer = undefined;
  exports.AirwallexConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/checkbookConfigOut.js
var require_checkbookConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CheckbookConfigOutSerializer = undefined;
  exports.CheckbookConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/docusignConfigOut.js
var require_docusignConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DocusignConfigOutSerializer = undefined;
  exports.DocusignConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/easypostConfigOut.js
var require_easypostConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EasypostConfigOutSerializer = undefined;
  exports.EasypostConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/githubConfigOut.js
var require_githubConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GithubConfigOutSerializer = undefined;
  exports.GithubConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/hubspotConfigOut.js
var require_hubspotConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HubspotConfigOutSerializer = undefined;
  exports.HubspotConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/orumIoConfigOut.js
var require_orumIoConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OrumIoConfigOutSerializer = undefined;
  exports.OrumIoConfigOutSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
});

// node_modules/svix/dist/models/pandaDocConfigOut.js
var require_pandaDocConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PandaDocConfigOutSerializer = undefined;
  exports.PandaDocConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/portIoConfigOut.js
var require_portIoConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PortIoConfigOutSerializer = undefined;
  exports.PortIoConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/rutterConfigOut.js
var require_rutterConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RutterConfigOutSerializer = undefined;
  exports.RutterConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/segmentConfigOut.js
var require_segmentConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SegmentConfigOutSerializer = undefined;
  exports.SegmentConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/shopifyConfigOut.js
var require_shopifyConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ShopifyConfigOutSerializer = undefined;
  exports.ShopifyConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/slackConfigOut.js
var require_slackConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SlackConfigOutSerializer = undefined;
  exports.SlackConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/stripeConfigOut.js
var require_stripeConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StripeConfigOutSerializer = undefined;
  exports.StripeConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/svixConfigOut.js
var require_svixConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SvixConfigOutSerializer = undefined;
  exports.SvixConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/telnyxConfigOut.js
var require_telnyxConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TelnyxConfigOutSerializer = undefined;
  exports.TelnyxConfigOutSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
});

// node_modules/svix/dist/models/vapiConfigOut.js
var require_vapiConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VapiConfigOutSerializer = undefined;
  exports.VapiConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/veriffConfigOut.js
var require_veriffConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VeriffConfigOutSerializer = undefined;
  exports.VeriffConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/zoomConfigOut.js
var require_zoomConfigOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ZoomConfigOutSerializer = undefined;
  exports.ZoomConfigOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/ingestSourceOut.js
var require_ingestSourceOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestSourceOutSerializer = undefined;
  var adobeSignConfigOut_1 = require_adobeSignConfigOut();
  var airwallexConfigOut_1 = require_airwallexConfigOut();
  var checkbookConfigOut_1 = require_checkbookConfigOut();
  var cronConfig_1 = require_cronConfig();
  var docusignConfigOut_1 = require_docusignConfigOut();
  var easypostConfigOut_1 = require_easypostConfigOut();
  var githubConfigOut_1 = require_githubConfigOut();
  var hubspotConfigOut_1 = require_hubspotConfigOut();
  var orumIoConfigOut_1 = require_orumIoConfigOut();
  var pandaDocConfigOut_1 = require_pandaDocConfigOut();
  var portIoConfigOut_1 = require_portIoConfigOut();
  var rutterConfigOut_1 = require_rutterConfigOut();
  var segmentConfigOut_1 = require_segmentConfigOut();
  var shopifyConfigOut_1 = require_shopifyConfigOut();
  var slackConfigOut_1 = require_slackConfigOut();
  var stripeConfigOut_1 = require_stripeConfigOut();
  var svixConfigOut_1 = require_svixConfigOut();
  var telnyxConfigOut_1 = require_telnyxConfigOut();
  var vapiConfigOut_1 = require_vapiConfigOut();
  var veriffConfigOut_1 = require_veriffConfigOut();
  var zoomConfigOut_1 = require_zoomConfigOut();
  exports.IngestSourceOutSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "generic-webhook":
            return {};
          case "cron":
            return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
          case "adobe-sign":
            return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
          case "beehiiv":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "brex":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "checkbook":
            return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
          case "clerk":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "docusign":
            return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
          case "easypost":
            return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
          case "github":
            return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
          case "guesty":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "hubspot":
            return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
          case "incident-io":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "lithic":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "nash":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "orum-io":
            return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
          case "panda-doc":
            return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
          case "port-io":
            return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
          case "pleo":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "replicate":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "resend":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "rutter":
            return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
          case "safebase":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "sardine":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "segment":
            return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
          case "shopify":
            return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
          case "slack":
            return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
          case "stripe":
            return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
          case "stych":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "svix":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "zoom":
            return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
          case "telnyx":
            return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
          case "vapi":
            return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
          case "open-ai":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "render":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "veriff":
            return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
          case "airwallex":
            return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        createdAt: new Date(object["createdAt"]),
        id: object["id"],
        ingestUrl: object["ingestUrl"],
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "generic-webhook":
          config = {};
          break;
        case "cron":
          config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
          break;
        case "adobe-sign":
          config = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
          break;
        case "beehiiv":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "brex":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "checkbook":
          config = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
          break;
        case "clerk":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "docusign":
          config = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
          break;
        case "easypost":
          config = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
          break;
        case "github":
          config = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
          break;
        case "guesty":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "hubspot":
          config = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
          break;
        case "incident-io":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "lithic":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "nash":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "orum-io":
          config = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
          break;
        case "panda-doc":
          config = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
          break;
        case "port-io":
          config = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
          break;
        case "pleo":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "replicate":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "resend":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "rutter":
          config = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
          break;
        case "safebase":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "sardine":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "segment":
          config = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
          break;
        case "shopify":
          config = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
          break;
        case "slack":
          config = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
          break;
        case "stripe":
          config = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
          break;
        case "stych":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "svix":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "zoom":
          config = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
          break;
        case "telnyx":
          config = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
          break;
        case "vapi":
          config = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
          break;
        case "open-ai":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "render":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "veriff":
          config = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
          break;
        case "airwallex":
          config = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        createdAt: self.createdAt,
        id: self.id,
        ingestUrl: self.ingestUrl,
        metadata: self.metadata,
        name: self.name,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseIngestSourceOut.js
var require_listResponseIngestSourceOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseIngestSourceOutSerializer = undefined;
  var ingestSourceOut_1 = require_ingestSourceOut();
  exports.ListResponseIngestSourceOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/rotateTokenOut.js
var require_rotateTokenOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RotateTokenOutSerializer = undefined;
  exports.RotateTokenOutSerializer = {
    _fromJsonObject(object) {
      return {
        ingestUrl: object["ingestUrl"]
      };
    },
    _toJsonObject(self) {
      return {
        ingestUrl: self.ingestUrl
      };
    }
  };
});

// node_modules/svix/dist/api/ingestSource.js
var require_ingestSource = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IngestSource = undefined;
  var ingestSourceIn_1 = require_ingestSourceIn();
  var ingestSourceOut_1 = require_ingestSourceOut();
  var listResponseIngestSourceOut_1 = require_listResponseIngestSourceOut();
  var rotateTokenOut_1 = require_rotateTokenOut();
  var request_1 = require_request();

  class IngestSource {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseIngestSourceOut_1.ListResponseIngestSourceOutSerializer._fromJsonObject);
    }
    create(ingestSourceIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
      return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    get(sourceId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}");
      request.setPathParam("source_id", sourceId);
      return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    update(sourceId, ingestSourceIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}");
      request.setPathParam("source_id", sourceId);
      request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
      return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    delete(sourceId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}");
      request.setPathParam("source_id", sourceId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    rotateToken(sourceId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/token/rotate");
      request.setPathParam("source_id", sourceId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, rotateTokenOut_1.RotateTokenOutSerializer._fromJsonObject);
    }
  }
  exports.IngestSource = IngestSource;
});

// node_modules/svix/dist/api/ingest.js
var require_ingest = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Ingest = undefined;
  var dashboardAccessOut_1 = require_dashboardAccessOut();
  var ingestSourceConsumerPortalAccessIn_1 = require_ingestSourceConsumerPortalAccessIn();
  var ingestEndpoint_1 = require_ingestEndpoint();
  var ingestSource_1 = require_ingestSource();
  var request_1 = require_request();

  class Ingest {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get endpoint() {
      return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
    }
    get source() {
      return new ingestSource_1.IngestSource(this.requestCtx);
    }
    dashboard(sourceId, ingestSourceConsumerPortalAccessIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
      request.setPathParam("source_id", sourceId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn));
      return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
  }
  exports.Ingest = Ingest;
});

// node_modules/svix/dist/models/integrationIn.js
var require_integrationIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IntegrationInSerializer = undefined;
  exports.IntegrationInSerializer = {
    _fromJsonObject(object) {
      return {
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
});

// node_modules/svix/dist/models/integrationKeyOut.js
var require_integrationKeyOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IntegrationKeyOutSerializer = undefined;
  exports.IntegrationKeyOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/integrationOut.js
var require_integrationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IntegrationOutSerializer = undefined;
  exports.IntegrationOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        featureFlags: object["featureFlags"],
        id: object["id"],
        name: object["name"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        featureFlags: self.featureFlags,
        id: self.id,
        name: self.name,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/integrationUpdate.js
var require_integrationUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.IntegrationUpdateSerializer = undefined;
  exports.IntegrationUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseIntegrationOut.js
var require_listResponseIntegrationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseIntegrationOutSerializer = undefined;
  var integrationOut_1 = require_integrationOut();
  exports.ListResponseIntegrationOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/integration.js
var require_integration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Integration = undefined;
  var integrationIn_1 = require_integrationIn();
  var integrationKeyOut_1 = require_integrationKeyOut();
  var integrationOut_1 = require_integrationOut();
  var integrationUpdate_1 = require_integrationUpdate();
  var listResponseIntegrationOut_1 = require_listResponseIntegrationOut();
  var request_1 = require_request();

  class Integration {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(appId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration");
      request.setPathParam("app_id", appId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseIntegrationOut_1.ListResponseIntegrationOutSerializer._fromJsonObject);
    }
    create(appId, integrationIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(integrationIn_1.IntegrationInSerializer._toJsonObject(integrationIn));
      return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    get(appId, integId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("integ_id", integId);
      return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    update(appId, integId, integrationUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/integration/{integ_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("integ_id", integId);
      request.setBody(integrationUpdate_1.IntegrationUpdateSerializer._toJsonObject(integrationUpdate));
      return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    delete(appId, integId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/integration/{integ_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("integ_id", integId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    getKey(appId, integId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}/key");
      request.setPathParam("app_id", appId);
      request.setPathParam("integ_id", integId);
      return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
    rotateKey(appId, integId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration/{integ_id}/key/rotate");
      request.setPathParam("app_id", appId);
      request.setPathParam("integ_id", integId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
  }
  exports.Integration = Integration;
});

// node_modules/svix/dist/models/expungeAllContentsOut.js
var require_expungeAllContentsOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ExpungeAllContentsOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.ExpungeAllContentsOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseMessageOut.js
var require_listResponseMessageOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseMessageOutSerializer = undefined;
  var messageOut_1 = require_messageOut();
  exports.ListResponseMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageOut_1.MessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageOut_1.MessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/pollingEndpointConsumerSeekIn.js
var require_pollingEndpointConsumerSeekIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PollingEndpointConsumerSeekInSerializer = undefined;
  exports.PollingEndpointConsumerSeekInSerializer = {
    _fromJsonObject(object) {
      return {
        after: new Date(object["after"])
      };
    },
    _toJsonObject(self) {
      return {
        after: self.after
      };
    }
  };
});

// node_modules/svix/dist/models/pollingEndpointConsumerSeekOut.js
var require_pollingEndpointConsumerSeekOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PollingEndpointConsumerSeekOutSerializer = undefined;
  exports.PollingEndpointConsumerSeekOutSerializer = {
    _fromJsonObject(object) {
      return {
        iterator: object["iterator"]
      };
    },
    _toJsonObject(self) {
      return {
        iterator: self.iterator
      };
    }
  };
});

// node_modules/svix/dist/models/pollingEndpointMessageOut.js
var require_pollingEndpointMessageOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PollingEndpointMessageOutSerializer = undefined;
  exports.PollingEndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
        eventId: object["eventId"],
        eventType: object["eventType"],
        headers: object["headers"],
        id: object["id"],
        payload: object["payload"],
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        deliverAt: self.deliverAt,
        eventId: self.eventId,
        eventType: self.eventType,
        headers: self.headers,
        id: self.id,
        payload: self.payload,
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
});

// node_modules/svix/dist/models/pollingEndpointOut.js
var require_pollingEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PollingEndpointOutSerializer = undefined;
  var pollingEndpointMessageOut_1 = require_pollingEndpointMessageOut();
  exports.PollingEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator
      };
    }
  };
});

// node_modules/svix/dist/api/messagePoller.js
var require_messagePoller = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessagePoller = undefined;
  var pollingEndpointConsumerSeekIn_1 = require_pollingEndpointConsumerSeekIn();
  var pollingEndpointConsumerSeekOut_1 = require_pollingEndpointConsumerSeekOut();
  var pollingEndpointOut_1 = require_pollingEndpointOut();
  var request_1 = require_request();

  class MessagePoller {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    poll(appId, sinkId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("sink_id", sinkId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        event_type: options === null || options === undefined ? undefined : options.eventType,
        channel: options === null || options === undefined ? undefined : options.channel,
        after: options === null || options === undefined ? undefined : options.after
      });
      return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerPoll(appId, sinkId, consumerId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("sink_id", sinkId);
      request.setPathParam("consumer_id", consumerId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator
      });
      return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerSeek(appId, sinkId, consumerId, pollingEndpointConsumerSeekIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}/seek");
      request.setPathParam("app_id", appId);
      request.setPathParam("sink_id", sinkId);
      request.setPathParam("consumer_id", consumerId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(pollingEndpointConsumerSeekIn_1.PollingEndpointConsumerSeekInSerializer._toJsonObject(pollingEndpointConsumerSeekIn));
      return request.send(this.requestCtx, pollingEndpointConsumerSeekOut_1.PollingEndpointConsumerSeekOutSerializer._fromJsonObject);
    }
  }
  exports.MessagePoller = MessagePoller;
});

// node_modules/svix/dist/models/messageIn.js
var require_messageIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageInSerializer = undefined;
  var applicationIn_1 = require_applicationIn();
  exports.MessageInSerializer = {
    _fromJsonObject(object) {
      return {
        application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : undefined,
        channels: object["channels"],
        deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
        eventId: object["eventId"],
        eventType: object["eventType"],
        payload: object["payload"],
        payloadRetentionHours: object["payloadRetentionHours"],
        payloadRetentionPeriod: object["payloadRetentionPeriod"],
        tags: object["tags"],
        transformationsParams: object["transformationsParams"]
      };
    },
    _toJsonObject(self) {
      return {
        application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : undefined,
        channels: self.channels,
        deliverAt: self.deliverAt,
        eventId: self.eventId,
        eventType: self.eventType,
        payload: self.payload,
        payloadRetentionHours: self.payloadRetentionHours,
        payloadRetentionPeriod: self.payloadRetentionPeriod,
        tags: self.tags,
        transformationsParams: self.transformationsParams
      };
    }
  };
});

// node_modules/svix/dist/api/message.js
var require_message = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.messageInRaw = exports.Message = undefined;
  var expungeAllContentsOut_1 = require_expungeAllContentsOut();
  var listResponseMessageOut_1 = require_listResponseMessageOut();
  var messageOut_1 = require_messageOut();
  var messagePoller_1 = require_messagePoller();
  var request_1 = require_request();
  var messageIn_1 = require_messageIn();

  class Message {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get poller() {
      return new messagePoller_1.MessagePoller(this.requestCtx);
    }
    list(appId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg");
      request.setPathParam("app_id", appId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        channel: options === null || options === undefined ? undefined : options.channel,
        before: options === null || options === undefined ? undefined : options.before,
        after: options === null || options === undefined ? undefined : options.after,
        with_content: options === null || options === undefined ? undefined : options.withContent,
        tag: options === null || options === undefined ? undefined : options.tag,
        event_types: options === null || options === undefined ? undefined : options.eventTypes
      });
      return request.send(this.requestCtx, listResponseMessageOut_1.ListResponseMessageOutSerializer._fromJsonObject);
    }
    create(appId, messageIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg");
      request.setPathParam("app_id", appId);
      request.setQueryParams({
        with_content: options === null || options === undefined ? undefined : options.withContent
      });
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(messageIn_1.MessageInSerializer._toJsonObject(messageIn));
      return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeAllContents(appId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/expunge-all-contents");
      request.setPathParam("app_id", appId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, expungeAllContentsOut_1.ExpungeAllContentsOutSerializer._fromJsonObject);
    }
    get(appId, msgId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setQueryParams({
        with_content: options === null || options === undefined ? undefined : options.withContent
      });
      return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/content");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.Message = Message;
  function messageInRaw(eventType, payload, contentType) {
    const headers = contentType ? { "content-type": contentType } : undefined;
    return {
      eventType,
      payload: {},
      transformationsParams: {
        rawPayload: payload,
        headers
      }
    };
  }
  exports.messageInRaw = messageInRaw;
});

// node_modules/svix/dist/models/emptyResponse.js
var require_emptyResponse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EmptyResponseSerializer = undefined;
  exports.EmptyResponseSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/messageStatus.js
var require_messageStatus = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageStatusSerializer = exports.MessageStatus = undefined;
  var MessageStatus;
  (function(MessageStatus2) {
    MessageStatus2[MessageStatus2["Success"] = 0] = "Success";
    MessageStatus2[MessageStatus2["Pending"] = 1] = "Pending";
    MessageStatus2[MessageStatus2["Fail"] = 2] = "Fail";
    MessageStatus2[MessageStatus2["Sending"] = 3] = "Sending";
  })(MessageStatus = exports.MessageStatus || (exports.MessageStatus = {}));
  exports.MessageStatusSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/messageStatusText.js
var require_messageStatusText = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageStatusTextSerializer = exports.MessageStatusText = undefined;
  var MessageStatusText;
  (function(MessageStatusText2) {
    MessageStatusText2["Success"] = "success";
    MessageStatusText2["Pending"] = "pending";
    MessageStatusText2["Fail"] = "fail";
    MessageStatusText2["Sending"] = "sending";
  })(MessageStatusText = exports.MessageStatusText || (exports.MessageStatusText = {}));
  exports.MessageStatusTextSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/endpointMessageOut.js
var require_endpointMessageOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointMessageOutSerializer = undefined;
  var messageStatus_1 = require_messageStatus();
  var messageStatusText_1 = require_messageStatusText();
  exports.EndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
        eventId: object["eventId"],
        eventType: object["eventType"],
        id: object["id"],
        nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
        payload: object["payload"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        deliverAt: self.deliverAt,
        eventId: self.eventId,
        eventType: self.eventType,
        id: self.id,
        nextAttempt: self.nextAttempt,
        payload: self.payload,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseEndpointMessageOut.js
var require_listResponseEndpointMessageOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseEndpointMessageOutSerializer = undefined;
  var endpointMessageOut_1 = require_endpointMessageOut();
  exports.ListResponseEndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/messageAttemptTriggerType.js
var require_messageAttemptTriggerType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageAttemptTriggerTypeSerializer = exports.MessageAttemptTriggerType = undefined;
  var MessageAttemptTriggerType;
  (function(MessageAttemptTriggerType2) {
    MessageAttemptTriggerType2[MessageAttemptTriggerType2["Scheduled"] = 0] = "Scheduled";
    MessageAttemptTriggerType2[MessageAttemptTriggerType2["Manual"] = 1] = "Manual";
  })(MessageAttemptTriggerType = exports.MessageAttemptTriggerType || (exports.MessageAttemptTriggerType = {}));
  exports.MessageAttemptTriggerTypeSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/messageAttemptOut.js
var require_messageAttemptOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageAttemptOutSerializer = undefined;
  var messageAttemptTriggerType_1 = require_messageAttemptTriggerType();
  var messageOut_1 = require_messageOut();
  var messageStatus_1 = require_messageStatus();
  var messageStatusText_1 = require_messageStatusText();
  exports.MessageAttemptOutSerializer = {
    _fromJsonObject(object) {
      return {
        endpointId: object["endpointId"],
        id: object["id"],
        msg: object["msg"] ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"]) : undefined,
        msgId: object["msgId"],
        response: object["response"],
        responseDurationMs: object["responseDurationMs"],
        responseStatusCode: object["responseStatusCode"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        timestamp: new Date(object["timestamp"]),
        triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        endpointId: self.endpointId,
        id: self.id,
        msg: self.msg ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : undefined,
        msgId: self.msgId,
        response: self.response,
        responseDurationMs: self.responseDurationMs,
        responseStatusCode: self.responseStatusCode,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        timestamp: self.timestamp,
        triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseMessageAttemptOut.js
var require_listResponseMessageAttemptOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseMessageAttemptOutSerializer = undefined;
  var messageAttemptOut_1 = require_messageAttemptOut();
  exports.ListResponseMessageAttemptOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/messageEndpointOut.js
var require_messageEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageEndpointOutSerializer = undefined;
  var messageStatus_1 = require_messageStatus();
  var messageStatusText_1 = require_messageStatusText();
  exports.MessageEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
        rateLimit: object["rateLimit"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        nextAttempt: self.nextAttempt,
        rateLimit: self.rateLimit,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url,
        version: self.version
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseMessageEndpointOut.js
var require_listResponseMessageEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseMessageEndpointOutSerializer = undefined;
  var messageEndpointOut_1 = require_messageEndpointOut();
  exports.ListResponseMessageEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/api/messageAttempt.js
var require_messageAttempt = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MessageAttempt = undefined;
  var emptyResponse_1 = require_emptyResponse();
  var listResponseEndpointMessageOut_1 = require_listResponseEndpointMessageOut();
  var listResponseMessageAttemptOut_1 = require_listResponseMessageAttemptOut();
  var listResponseMessageEndpointOut_1 = require_listResponseMessageEndpointOut();
  var messageAttemptOut_1 = require_messageAttemptOut();
  var request_1 = require_request();

  class MessageAttempt {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    listByEndpoint(appId, endpointId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        status: options === null || options === undefined ? undefined : options.status,
        status_code_class: options === null || options === undefined ? undefined : options.statusCodeClass,
        channel: options === null || options === undefined ? undefined : options.channel,
        tag: options === null || options === undefined ? undefined : options.tag,
        before: options === null || options === undefined ? undefined : options.before,
        after: options === null || options === undefined ? undefined : options.after,
        with_content: options === null || options === undefined ? undefined : options.withContent,
        with_msg: options === null || options === undefined ? undefined : options.withMsg,
        event_types: options === null || options === undefined ? undefined : options.eventTypes
      });
      return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listByMsg(appId, msgId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        status: options === null || options === undefined ? undefined : options.status,
        status_code_class: options === null || options === undefined ? undefined : options.statusCodeClass,
        channel: options === null || options === undefined ? undefined : options.channel,
        tag: options === null || options === undefined ? undefined : options.tag,
        endpoint_id: options === null || options === undefined ? undefined : options.endpointId,
        before: options === null || options === undefined ? undefined : options.before,
        after: options === null || options === undefined ? undefined : options.after,
        with_content: options === null || options === undefined ? undefined : options.withContent,
        event_types: options === null || options === undefined ? undefined : options.eventTypes
      });
      return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listAttemptedMessages(appId, endpointId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
      request.setPathParam("app_id", appId);
      request.setPathParam("endpoint_id", endpointId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        channel: options === null || options === undefined ? undefined : options.channel,
        tag: options === null || options === undefined ? undefined : options.tag,
        status: options === null || options === undefined ? undefined : options.status,
        before: options === null || options === undefined ? undefined : options.before,
        after: options === null || options === undefined ? undefined : options.after,
        with_content: options === null || options === undefined ? undefined : options.withContent,
        event_types: options === null || options === undefined ? undefined : options.eventTypes
      });
      return request.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
    }
    get(appId, msgId, attemptId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setPathParam("attempt_id", attemptId);
      return request.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId, attemptId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setPathParam("attempt_id", attemptId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    listAttemptedDestinations(appId, msgId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator
      });
      return request.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
    }
    resend(appId, msgId, endpointId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
      request.setPathParam("app_id", appId);
      request.setPathParam("msg_id", msgId);
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
  }
  exports.MessageAttempt = MessageAttempt;
});

// node_modules/svix/dist/models/operationalWebhookEndpointOut.js
var require_operationalWebhookEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointOutSerializer = undefined;
  exports.OperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseOperationalWebhookEndpointOut.js
var require_listResponseOperationalWebhookEndpointOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseOperationalWebhookEndpointOutSerializer = undefined;
  var operationalWebhookEndpointOut_1 = require_operationalWebhookEndpointOut();
  exports.ListResponseOperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointHeadersIn.js
var require_operationalWebhookEndpointHeadersIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointHeadersInSerializer = undefined;
  exports.OperationalWebhookEndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointHeadersOut.js
var require_operationalWebhookEndpointHeadersOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointHeadersOutSerializer = undefined;
  exports.OperationalWebhookEndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointIn.js
var require_operationalWebhookEndpointIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointInSerializer = undefined;
  exports.OperationalWebhookEndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointSecretIn.js
var require_operationalWebhookEndpointSecretIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointSecretInSerializer = undefined;
  exports.OperationalWebhookEndpointSecretInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointSecretOut.js
var require_operationalWebhookEndpointSecretOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointSecretOutSerializer = undefined;
  exports.OperationalWebhookEndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/operationalWebhookEndpointUpdate.js
var require_operationalWebhookEndpointUpdate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpointUpdateSerializer = undefined;
  exports.OperationalWebhookEndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/api/operationalWebhookEndpoint.js
var require_operationalWebhookEndpoint = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhookEndpoint = undefined;
  var listResponseOperationalWebhookEndpointOut_1 = require_listResponseOperationalWebhookEndpointOut();
  var operationalWebhookEndpointHeadersIn_1 = require_operationalWebhookEndpointHeadersIn();
  var operationalWebhookEndpointHeadersOut_1 = require_operationalWebhookEndpointHeadersOut();
  var operationalWebhookEndpointIn_1 = require_operationalWebhookEndpointIn();
  var operationalWebhookEndpointOut_1 = require_operationalWebhookEndpointOut();
  var operationalWebhookEndpointSecretIn_1 = require_operationalWebhookEndpointSecretIn();
  var operationalWebhookEndpointSecretOut_1 = require_operationalWebhookEndpointSecretOut();
  var operationalWebhookEndpointUpdate_1 = require_operationalWebhookEndpointUpdate();
  var request_1 = require_request();

  class OperationalWebhookEndpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseOperationalWebhookEndpointOut_1.ListResponseOperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    create(operationalWebhookEndpointIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(operationalWebhookEndpointIn_1.OperationalWebhookEndpointInSerializer._toJsonObject(operationalWebhookEndpointIn));
      return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    get(endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    update(endpointId, operationalWebhookEndpointUpdate) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(operationalWebhookEndpointUpdate_1.OperationalWebhookEndpointUpdateSerializer._toJsonObject(operationalWebhookEndpointUpdate));
      return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    delete(endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request.setPathParam("endpoint_id", endpointId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, operationalWebhookEndpointHeadersOut_1.OperationalWebhookEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(endpointId, operationalWebhookEndpointHeadersIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
      request.setPathParam("endpoint_id", endpointId);
      request.setBody(operationalWebhookEndpointHeadersIn_1.OperationalWebhookEndpointHeadersInSerializer._toJsonObject(operationalWebhookEndpointHeadersIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
    getSecret(endpointId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret");
      request.setPathParam("endpoint_id", endpointId);
      return request.send(this.requestCtx, operationalWebhookEndpointSecretOut_1.OperationalWebhookEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(endpointId, operationalWebhookEndpointSecretIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret/rotate");
      request.setPathParam("endpoint_id", endpointId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(operationalWebhookEndpointSecretIn_1.OperationalWebhookEndpointSecretInSerializer._toJsonObject(operationalWebhookEndpointSecretIn));
      return request.sendNoResponseBody(this.requestCtx);
    }
  }
  exports.OperationalWebhookEndpoint = OperationalWebhookEndpoint;
});

// node_modules/svix/dist/api/operationalWebhook.js
var require_operationalWebhook = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperationalWebhook = undefined;
  var operationalWebhookEndpoint_1 = require_operationalWebhookEndpoint();

  class OperationalWebhook {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get endpoint() {
      return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
  }
  exports.OperationalWebhook = OperationalWebhook;
});

// node_modules/svix/dist/models/aggregateEventTypesOut.js
var require_aggregateEventTypesOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AggregateEventTypesOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.AggregateEventTypesOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
});

// node_modules/svix/dist/models/appUsageStatsIn.js
var require_appUsageStatsIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AppUsageStatsInSerializer = undefined;
  exports.AppUsageStatsInSerializer = {
    _fromJsonObject(object) {
      return {
        appIds: object["appIds"],
        since: new Date(object["since"]),
        until: new Date(object["until"])
      };
    },
    _toJsonObject(self) {
      return {
        appIds: self.appIds,
        since: self.since,
        until: self.until
      };
    }
  };
});

// node_modules/svix/dist/models/appUsageStatsOut.js
var require_appUsageStatsOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AppUsageStatsOutSerializer = undefined;
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  var backgroundTaskType_1 = require_backgroundTaskType();
  exports.AppUsageStatsOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
        unresolvedAppIds: object["unresolvedAppIds"]
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
        unresolvedAppIds: self.unresolvedAppIds
      };
    }
  };
});

// node_modules/svix/dist/api/statistics.js
var require_statistics = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Statistics = undefined;
  var aggregateEventTypesOut_1 = require_aggregateEventTypesOut();
  var appUsageStatsIn_1 = require_appUsageStatsIn();
  var appUsageStatsOut_1 = require_appUsageStatsOut();
  var request_1 = require_request();

  class Statistics {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    aggregateAppStats(appUsageStatsIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn));
      return request.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
    }
    aggregateEventTypes() {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
      return request.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
    }
  }
  exports.Statistics = Statistics;
});

// node_modules/svix/dist/models/httpSinkHeadersPatchIn.js
var require_httpSinkHeadersPatchIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HttpSinkHeadersPatchInSerializer = undefined;
  exports.HttpSinkHeadersPatchInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
});

// node_modules/svix/dist/models/sinkTransformationOut.js
var require_sinkTransformationOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkTransformationOutSerializer = undefined;
  exports.SinkTransformationOutSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
});

// node_modules/svix/dist/models/streamEventTypeOut.js
var require_streamEventTypeOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamEventTypeOutSerializer = undefined;
  exports.StreamEventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        createdAt: new Date(object["createdAt"]),
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        name: object["name"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        createdAt: self.createdAt,
        deprecated: self.deprecated,
        description: self.description,
        featureFlags: self.featureFlags,
        name: self.name,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseStreamEventTypeOut.js
var require_listResponseStreamEventTypeOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseStreamEventTypeOutSerializer = undefined;
  var streamEventTypeOut_1 = require_streamEventTypeOut();
  exports.ListResponseStreamEventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => streamEventTypeOut_1.StreamEventTypeOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/streamEventTypeIn.js
var require_streamEventTypeIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamEventTypeInSerializer = undefined;
  exports.StreamEventTypeInSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
});

// node_modules/svix/dist/models/streamEventTypePatch.js
var require_streamEventTypePatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamEventTypePatchSerializer = undefined;
  exports.StreamEventTypePatchSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
});

// node_modules/svix/dist/api/streamingEventType.js
var require_streamingEventType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamingEventType = undefined;
  var listResponseStreamEventTypeOut_1 = require_listResponseStreamEventTypeOut();
  var streamEventTypeIn_1 = require_streamEventTypeIn();
  var streamEventTypeOut_1 = require_streamEventTypeOut();
  var streamEventTypePatch_1 = require_streamEventTypePatch();
  var request_1 = require_request();

  class StreamingEventType {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order,
        include_archived: options === null || options === undefined ? undefined : options.includeArchived
      });
      return request.send(this.requestCtx, listResponseStreamEventTypeOut_1.ListResponseStreamEventTypeOutSerializer._fromJsonObject);
    }
    create(streamEventTypeIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/event-type");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
      return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    get(name) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type/{name}");
      request.setPathParam("name", name);
      return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    update(name, streamEventTypeIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/event-type/{name}");
      request.setPathParam("name", name);
      request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
      return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    delete(name, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/event-type/{name}");
      request.setPathParam("name", name);
      request.setQueryParams({
        expunge: options === null || options === undefined ? undefined : options.expunge
      });
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(name, streamEventTypePatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/event-type/{name}");
      request.setPathParam("name", name);
      request.setBody(streamEventTypePatch_1.StreamEventTypePatchSerializer._toJsonObject(streamEventTypePatch));
      return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
  }
  exports.StreamingEventType = StreamingEventType;
});

// node_modules/svix/dist/models/eventIn.js
var require_eventIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventInSerializer = undefined;
  exports.EventInSerializer = {
    _fromJsonObject(object) {
      return {
        eventType: object["eventType"],
        payload: object["payload"]
      };
    },
    _toJsonObject(self) {
      return {
        eventType: self.eventType,
        payload: self.payload
      };
    }
  };
});

// node_modules/svix/dist/models/streamIn.js
var require_streamIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamInSerializer = undefined;
  exports.StreamInSerializer = {
    _fromJsonObject(object) {
      return {
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        metadata: self.metadata,
        name: self.name,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/createStreamEventsIn.js
var require_createStreamEventsIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CreateStreamEventsInSerializer = undefined;
  var eventIn_1 = require_eventIn();
  var streamIn_1 = require_streamIn();
  exports.CreateStreamEventsInSerializer = {
    _fromJsonObject(object) {
      return {
        events: object["events"].map((item) => eventIn_1.EventInSerializer._fromJsonObject(item)),
        stream: object["stream"] ? streamIn_1.StreamInSerializer._fromJsonObject(object["stream"]) : undefined
      };
    },
    _toJsonObject(self) {
      return {
        events: self.events.map((item) => eventIn_1.EventInSerializer._toJsonObject(item)),
        stream: self.stream ? streamIn_1.StreamInSerializer._toJsonObject(self.stream) : undefined
      };
    }
  };
});

// node_modules/svix/dist/models/createStreamEventsOut.js
var require_createStreamEventsOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CreateStreamEventsOutSerializer = undefined;
  exports.CreateStreamEventsOutSerializer = {
    _fromJsonObject(_object) {
      return {};
    },
    _toJsonObject(_self) {
      return {};
    }
  };
});

// node_modules/svix/dist/models/eventOut.js
var require_eventOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventOutSerializer = undefined;
  exports.EventOutSerializer = {
    _fromJsonObject(object) {
      return {
        eventType: object["eventType"],
        payload: object["payload"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        eventType: self.eventType,
        payload: self.payload,
        timestamp: self.timestamp
      };
    }
  };
});

// node_modules/svix/dist/models/eventStreamOut.js
var require_eventStreamOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EventStreamOutSerializer = undefined;
  var eventOut_1 = require_eventOut();
  exports.EventStreamOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => eventOut_1.EventOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => eventOut_1.EventOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator
      };
    }
  };
});

// node_modules/svix/dist/api/streamingEvents.js
var require_streamingEvents = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamingEvents = undefined;
  var createStreamEventsIn_1 = require_createStreamEventsIn();
  var createStreamEventsOut_1 = require_createStreamEventsOut();
  var eventStreamOut_1 = require_eventStreamOut();
  var request_1 = require_request();

  class StreamingEvents {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    create(streamId, createStreamEventsIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/events");
      request.setPathParam("stream_id", streamId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(createStreamEventsIn_1.CreateStreamEventsInSerializer._toJsonObject(createStreamEventsIn));
      return request.send(this.requestCtx, createStreamEventsOut_1.CreateStreamEventsOutSerializer._fromJsonObject);
    }
    get(streamId, sinkId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/events");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        after: options === null || options === undefined ? undefined : options.after
      });
      return request.send(this.requestCtx, eventStreamOut_1.EventStreamOutSerializer._fromJsonObject);
    }
  }
  exports.StreamingEvents = StreamingEvents;
});

// node_modules/svix/dist/models/azureBlobStorageConfig.js
var require_azureBlobStorageConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AzureBlobStorageConfigSerializer = undefined;
  exports.AzureBlobStorageConfigSerializer = {
    _fromJsonObject(object) {
      return {
        accessKey: object["accessKey"],
        account: object["account"],
        container: object["container"]
      };
    },
    _toJsonObject(self) {
      return {
        accessKey: self.accessKey,
        account: self.account,
        container: self.container
      };
    }
  };
});

// node_modules/svix/dist/models/googleCloudStorageConfig.js
var require_googleCloudStorageConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GoogleCloudStorageConfigSerializer = undefined;
  exports.GoogleCloudStorageConfigSerializer = {
    _fromJsonObject(object) {
      return {
        bucket: object["bucket"],
        credentials: object["credentials"]
      };
    },
    _toJsonObject(self) {
      return {
        bucket: self.bucket,
        credentials: self.credentials
      };
    }
  };
});

// node_modules/svix/dist/models/s3Config.js
var require_s3Config = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.S3ConfigSerializer = undefined;
  exports.S3ConfigSerializer = {
    _fromJsonObject(object) {
      return {
        accessKeyId: object["accessKeyId"],
        bucket: object["bucket"],
        region: object["region"],
        secretAccessKey: object["secretAccessKey"]
      };
    },
    _toJsonObject(self) {
      return {
        accessKeyId: self.accessKeyId,
        bucket: self.bucket,
        region: self.region,
        secretAccessKey: self.secretAccessKey
      };
    }
  };
});

// node_modules/svix/dist/models/sinkHttpConfig.js
var require_sinkHttpConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkHttpConfigSerializer = undefined;
  exports.SinkHttpConfigSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        key: object["key"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        key: self.key,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/sinkOtelV1Config.js
var require_sinkOtelV1Config = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkOtelV1ConfigSerializer = undefined;
  exports.SinkOtelV1ConfigSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/sinkStatus.js
var require_sinkStatus = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkStatusSerializer = exports.SinkStatus = undefined;
  var SinkStatus;
  (function(SinkStatus2) {
    SinkStatus2["Enabled"] = "enabled";
    SinkStatus2["Paused"] = "paused";
    SinkStatus2["Disabled"] = "disabled";
    SinkStatus2["Retrying"] = "retrying";
  })(SinkStatus = exports.SinkStatus || (exports.SinkStatus = {}));
  exports.SinkStatusSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/streamSinkOut.js
var require_streamSinkOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamSinkOutSerializer = undefined;
  var azureBlobStorageConfig_1 = require_azureBlobStorageConfig();
  var googleCloudStorageConfig_1 = require_googleCloudStorageConfig();
  var s3Config_1 = require_s3Config();
  var sinkHttpConfig_1 = require_sinkHttpConfig();
  var sinkOtelV1Config_1 = require_sinkOtelV1Config();
  var sinkStatus_1 = require_sinkStatus();
  exports.StreamSinkOutSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "poller":
            return {};
          case "azureBlobStorage":
            return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
          case "otelTracing":
            return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
          case "http":
            return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
          case "amazonS3":
            return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
          case "googleCloudStorage":
            return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        batchSize: object["batchSize"],
        createdAt: new Date(object["createdAt"]),
        currentIterator: object["currentIterator"],
        eventTypes: object["eventTypes"],
        failureReason: object["failureReason"],
        id: object["id"],
        maxWaitSecs: object["maxWaitSecs"],
        metadata: object["metadata"],
        nextRetryAt: object["nextRetryAt"] ? new Date(object["nextRetryAt"]) : null,
        status: sinkStatus_1.SinkStatusSerializer._fromJsonObject(object["status"]),
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "poller":
          config = {};
          break;
        case "azureBlobStorage":
          config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
          break;
        case "otelTracing":
          config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
          break;
        case "http":
          config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
          break;
        case "amazonS3":
          config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
          break;
        case "googleCloudStorage":
          config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        batchSize: self.batchSize,
        createdAt: self.createdAt,
        currentIterator: self.currentIterator,
        eventTypes: self.eventTypes,
        failureReason: self.failureReason,
        id: self.id,
        maxWaitSecs: self.maxWaitSecs,
        metadata: self.metadata,
        nextRetryAt: self.nextRetryAt,
        status: sinkStatus_1.SinkStatusSerializer._toJsonObject(self.status),
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseStreamSinkOut.js
var require_listResponseStreamSinkOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseStreamSinkOutSerializer = undefined;
  var streamSinkOut_1 = require_streamSinkOut();
  exports.ListResponseStreamSinkOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => streamSinkOut_1.StreamSinkOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/sinkSecretOut.js
var require_sinkSecretOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkSecretOutSerializer = undefined;
  exports.SinkSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
});

// node_modules/svix/dist/models/sinkTransformIn.js
var require_sinkTransformIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkTransformInSerializer = undefined;
  exports.SinkTransformInSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code
      };
    }
  };
});

// node_modules/svix/dist/models/sinkStatusIn.js
var require_sinkStatusIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SinkStatusInSerializer = exports.SinkStatusIn = undefined;
  var SinkStatusIn;
  (function(SinkStatusIn2) {
    SinkStatusIn2["Enabled"] = "enabled";
    SinkStatusIn2["Disabled"] = "disabled";
  })(SinkStatusIn = exports.SinkStatusIn || (exports.SinkStatusIn = {}));
  exports.SinkStatusInSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/streamSinkIn.js
var require_streamSinkIn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamSinkInSerializer = undefined;
  var azureBlobStorageConfig_1 = require_azureBlobStorageConfig();
  var googleCloudStorageConfig_1 = require_googleCloudStorageConfig();
  var s3Config_1 = require_s3Config();
  var sinkHttpConfig_1 = require_sinkHttpConfig();
  var sinkOtelV1Config_1 = require_sinkOtelV1Config();
  var sinkStatusIn_1 = require_sinkStatusIn();
  exports.StreamSinkInSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "poller":
            return {};
          case "azureBlobStorage":
            return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
          case "otelTracing":
            return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
          case "http":
            return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
          case "amazonS3":
            return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
          case "googleCloudStorage":
            return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        batchSize: object["batchSize"],
        eventTypes: object["eventTypes"],
        maxWaitSecs: object["maxWaitSecs"],
        metadata: object["metadata"],
        status: object["status"] ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"]) : undefined,
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "poller":
          config = {};
          break;
        case "azureBlobStorage":
          config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
          break;
        case "otelTracing":
          config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
          break;
        case "http":
          config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
          break;
        case "amazonS3":
          config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
          break;
        case "googleCloudStorage":
          config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        batchSize: self.batchSize,
        eventTypes: self.eventTypes,
        maxWaitSecs: self.maxWaitSecs,
        metadata: self.metadata,
        status: self.status ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status) : undefined,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/models/amazonS3PatchConfig.js
var require_amazonS3PatchConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AmazonS3PatchConfigSerializer = undefined;
  exports.AmazonS3PatchConfigSerializer = {
    _fromJsonObject(object) {
      return {
        accessKeyId: object["accessKeyId"],
        bucket: object["bucket"],
        region: object["region"],
        secretAccessKey: object["secretAccessKey"]
      };
    },
    _toJsonObject(self) {
      return {
        accessKeyId: self.accessKeyId,
        bucket: self.bucket,
        region: self.region,
        secretAccessKey: self.secretAccessKey
      };
    }
  };
});

// node_modules/svix/dist/models/azureBlobStoragePatchConfig.js
var require_azureBlobStoragePatchConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AzureBlobStoragePatchConfigSerializer = undefined;
  exports.AzureBlobStoragePatchConfigSerializer = {
    _fromJsonObject(object) {
      return {
        accessKey: object["accessKey"],
        account: object["account"],
        container: object["container"]
      };
    },
    _toJsonObject(self) {
      return {
        accessKey: self.accessKey,
        account: self.account,
        container: self.container
      };
    }
  };
});

// node_modules/svix/dist/models/googleCloudStoragePatchConfig.js
var require_googleCloudStoragePatchConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GoogleCloudStoragePatchConfigSerializer = undefined;
  exports.GoogleCloudStoragePatchConfigSerializer = {
    _fromJsonObject(object) {
      return {
        bucket: object["bucket"],
        credentials: object["credentials"]
      };
    },
    _toJsonObject(self) {
      return {
        bucket: self.bucket,
        credentials: self.credentials
      };
    }
  };
});

// node_modules/svix/dist/models/httpPatchConfig.js
var require_httpPatchConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HttpPatchConfigSerializer = undefined;
  exports.HttpPatchConfigSerializer = {
    _fromJsonObject(object) {
      return {
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/otelTracingPatchConfig.js
var require_otelTracingPatchConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OtelTracingPatchConfigSerializer = undefined;
  exports.OtelTracingPatchConfigSerializer = {
    _fromJsonObject(object) {
      return {
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        url: self.url
      };
    }
  };
});

// node_modules/svix/dist/models/streamSinkPatch.js
var require_streamSinkPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamSinkPatchSerializer = undefined;
  var amazonS3PatchConfig_1 = require_amazonS3PatchConfig();
  var azureBlobStoragePatchConfig_1 = require_azureBlobStoragePatchConfig();
  var googleCloudStoragePatchConfig_1 = require_googleCloudStoragePatchConfig();
  var httpPatchConfig_1 = require_httpPatchConfig();
  var otelTracingPatchConfig_1 = require_otelTracingPatchConfig();
  var sinkStatusIn_1 = require_sinkStatusIn();
  exports.StreamSinkPatchSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "poller":
            return {};
          case "azureBlobStorage":
            return azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._fromJsonObject(object["config"]);
          case "otelTracing":
            return otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._fromJsonObject(object["config"]);
          case "http":
            return httpPatchConfig_1.HttpPatchConfigSerializer._fromJsonObject(object["config"]);
          case "amazonS3":
            return amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._fromJsonObject(object["config"]);
          case "googleCloudStorage":
            return googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        batchSize: object["batchSize"],
        eventTypes: object["eventTypes"],
        maxWaitSecs: object["maxWaitSecs"],
        metadata: object["metadata"],
        status: object["status"] ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"]) : undefined,
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "poller":
          config = {};
          break;
        case "azureBlobStorage":
          config = azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._toJsonObject(self.config);
          break;
        case "otelTracing":
          config = otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._toJsonObject(self.config);
          break;
        case "http":
          config = httpPatchConfig_1.HttpPatchConfigSerializer._toJsonObject(self.config);
          break;
        case "amazonS3":
          config = amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._toJsonObject(self.config);
          break;
        case "googleCloudStorage":
          config = googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        batchSize: self.batchSize,
        eventTypes: self.eventTypes,
        maxWaitSecs: self.maxWaitSecs,
        metadata: self.metadata,
        status: self.status ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status) : undefined,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/api/streamingSink.js
var require_streamingSink = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamingSink = undefined;
  var emptyResponse_1 = require_emptyResponse();
  var endpointSecretRotateIn_1 = require_endpointSecretRotateIn();
  var listResponseStreamSinkOut_1 = require_listResponseStreamSinkOut();
  var sinkSecretOut_1 = require_sinkSecretOut();
  var sinkTransformIn_1 = require_sinkTransformIn();
  var streamSinkIn_1 = require_streamSinkIn();
  var streamSinkOut_1 = require_streamSinkOut();
  var streamSinkPatch_1 = require_streamSinkPatch();
  var request_1 = require_request();

  class StreamingSink {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(streamId, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink");
      request.setPathParam("stream_id", streamId);
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseStreamSinkOut_1.ListResponseStreamSinkOutSerializer._fromJsonObject);
    }
    create(streamId, streamSinkIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink");
      request.setPathParam("stream_id", streamId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
      return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    get(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    update(streamId, sinkId, streamSinkIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}/sink/{sink_id}");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
      return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    delete(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}/sink/{sink_id}");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(streamId, sinkId, streamSinkPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setBody(streamSinkPatch_1.StreamSinkPatchSerializer._toJsonObject(streamSinkPatch));
      return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    getSecret(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.send(this.requestCtx, sinkSecretOut_1.SinkSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(streamId, sinkId, endpointSecretRotateIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret/rotate");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
      return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
    transformationPartialUpdate(streamId, sinkId, sinkTransformIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setBody(sinkTransformIn_1.SinkTransformInSerializer._toJsonObject(sinkTransformIn));
      return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
  }
  exports.StreamingSink = StreamingSink;
});

// node_modules/svix/dist/models/streamOut.js
var require_streamOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamOutSerializer = undefined;
  exports.StreamOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        id: object["id"],
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        id: self.id,
        metadata: self.metadata,
        name: self.name,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
});

// node_modules/svix/dist/models/listResponseStreamOut.js
var require_listResponseStreamOut = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ListResponseStreamOutSerializer = undefined;
  var streamOut_1 = require_streamOut();
  exports.ListResponseStreamOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => streamOut_1.StreamOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => streamOut_1.StreamOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
});

// node_modules/svix/dist/models/streamPatch.js
var require_streamPatch = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamPatchSerializer = undefined;
  exports.StreamPatchSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        metadata: object["metadata"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        metadata: self.metadata,
        uid: self.uid
      };
    }
  };
});

// node_modules/svix/dist/api/streamingStream.js
var require_streamingStream = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamingStream = undefined;
  var listResponseStreamOut_1 = require_listResponseStreamOut();
  var streamIn_1 = require_streamIn();
  var streamOut_1 = require_streamOut();
  var streamPatch_1 = require_streamPatch();
  var request_1 = require_request();

  class StreamingStream {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream");
      request.setQueryParams({
        limit: options === null || options === undefined ? undefined : options.limit,
        iterator: options === null || options === undefined ? undefined : options.iterator,
        order: options === null || options === undefined ? undefined : options.order
      });
      return request.send(this.requestCtx, listResponseStreamOut_1.ListResponseStreamOutSerializer._fromJsonObject);
    }
    create(streamIn, options) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream");
      request.setHeaderParam("idempotency-key", options === null || options === undefined ? undefined : options.idempotencyKey);
      request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
      return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    get(streamId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}");
      request.setPathParam("stream_id", streamId);
      return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    update(streamId, streamIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}");
      request.setPathParam("stream_id", streamId);
      request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
      return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    delete(streamId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}");
      request.setPathParam("stream_id", streamId);
      return request.sendNoResponseBody(this.requestCtx);
    }
    patch(streamId, streamPatch) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}");
      request.setPathParam("stream_id", streamId);
      request.setBody(streamPatch_1.StreamPatchSerializer._toJsonObject(streamPatch));
      return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
  }
  exports.StreamingStream = StreamingStream;
});

// node_modules/svix/dist/api/streaming.js
var require_streaming = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Streaming = undefined;
  var endpointHeadersOut_1 = require_endpointHeadersOut();
  var httpSinkHeadersPatchIn_1 = require_httpSinkHeadersPatchIn();
  var sinkTransformationOut_1 = require_sinkTransformationOut();
  var streamingEventType_1 = require_streamingEventType();
  var streamingEvents_1 = require_streamingEvents();
  var streamingSink_1 = require_streamingSink();
  var streamingStream_1 = require_streamingStream();
  var request_1 = require_request();

  class Streaming {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get event_type() {
      return new streamingEventType_1.StreamingEventType(this.requestCtx);
    }
    get events() {
      return new streamingEvents_1.StreamingEvents(this.requestCtx);
    }
    get sink() {
      return new streamingSink_1.StreamingSink(this.requestCtx);
    }
    get stream() {
      return new streamingStream_1.StreamingStream(this.requestCtx);
    }
    sinkHeadersGet(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkHeadersPatch(streamId, sinkId, httpSinkHeadersPatchIn) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      request.setBody(httpSinkHeadersPatchIn_1.HttpSinkHeadersPatchInSerializer._toJsonObject(httpSinkHeadersPatchIn));
      return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkTransformationGet(streamId, sinkId) {
      const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
      request.setPathParam("stream_id", streamId);
      request.setPathParam("sink_id", sinkId);
      return request.send(this.requestCtx, sinkTransformationOut_1.SinkTransformationOutSerializer._fromJsonObject);
    }
  }
  exports.Streaming = Streaming;
});

// node_modules/svix/dist/HttpErrors.js
var require_HttpErrors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HTTPValidationError = exports.ValidationError = exports.HttpErrorOut = undefined;

  class HttpErrorOut {
    static getAttributeTypeMap() {
      return HttpErrorOut.attributeTypeMap;
    }
  }
  exports.HttpErrorOut = HttpErrorOut;
  HttpErrorOut.discriminator = undefined;
  HttpErrorOut.mapping = undefined;
  HttpErrorOut.attributeTypeMap = [
    {
      name: "code",
      baseName: "code",
      type: "string",
      format: ""
    },
    {
      name: "detail",
      baseName: "detail",
      type: "string",
      format: ""
    }
  ];

  class ValidationError {
    static getAttributeTypeMap() {
      return ValidationError.attributeTypeMap;
    }
  }
  exports.ValidationError = ValidationError;
  ValidationError.discriminator = undefined;
  ValidationError.mapping = undefined;
  ValidationError.attributeTypeMap = [
    {
      name: "loc",
      baseName: "loc",
      type: "Array<string>",
      format: ""
    },
    {
      name: "msg",
      baseName: "msg",
      type: "string",
      format: ""
    },
    {
      name: "type",
      baseName: "type",
      type: "string",
      format: ""
    }
  ];

  class HTTPValidationError {
    static getAttributeTypeMap() {
      return HTTPValidationError.attributeTypeMap;
    }
  }
  exports.HTTPValidationError = HTTPValidationError;
  HTTPValidationError.discriminator = undefined;
  HTTPValidationError.mapping = undefined;
  HTTPValidationError.attributeTypeMap = [
    {
      name: "detail",
      baseName: "detail",
      type: "Array<ValidationError>",
      format: ""
    }
  ];
});

// node_modules/standardwebhooks/dist/timing_safe_equal.js
var require_timing_safe_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timingSafeEqual = undefined;
  function assert(expr, msg = "") {
    if (!expr) {
      throw new Error(msg);
    }
  }
  function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
      return false;
    }
    if (!(a instanceof DataView)) {
      a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
    }
    if (!(b instanceof DataView)) {
      b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i2 = -1;
    while (++i2 < length) {
      out |= a.getUint8(i2) ^ b.getUint8(i2);
    }
    return out === 0;
  }
  exports.timingSafeEqual = timingSafeEqual;
});

// node_modules/@stablelib/base64/lib/base64.js
var require_base64 = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  var INVALID_BYTE = 256;
  var Coder = function() {
    function Coder2(_paddingCharacter) {
      if (_paddingCharacter === undefined) {
        _paddingCharacter = "=";
      }
      this._paddingCharacter = _paddingCharacter;
    }
    Coder2.prototype.encodedLength = function(length) {
      if (!this._paddingCharacter) {
        return (length * 8 + 5) / 6 | 0;
      }
      return (length + 2) / 3 * 4 | 0;
    };
    Coder2.prototype.encode = function(data) {
      var out = "";
      var i2 = 0;
      for (;i2 < data.length - 2; i2 += 3) {
        var c = data[i2] << 16 | data[i2 + 1] << 8 | data[i2 + 2];
        out += this._encodeByte(c >>> 3 * 6 & 63);
        out += this._encodeByte(c >>> 2 * 6 & 63);
        out += this._encodeByte(c >>> 1 * 6 & 63);
        out += this._encodeByte(c >>> 0 * 6 & 63);
      }
      var left = data.length - i2;
      if (left > 0) {
        var c = data[i2] << 16 | (left === 2 ? data[i2 + 1] << 8 : 0);
        out += this._encodeByte(c >>> 3 * 6 & 63);
        out += this._encodeByte(c >>> 2 * 6 & 63);
        if (left === 2) {
          out += this._encodeByte(c >>> 1 * 6 & 63);
        } else {
          out += this._paddingCharacter || "";
        }
        out += this._paddingCharacter || "";
      }
      return out;
    };
    Coder2.prototype.maxDecodedLength = function(length) {
      if (!this._paddingCharacter) {
        return (length * 6 + 7) / 8 | 0;
      }
      return length / 4 * 3 | 0;
    };
    Coder2.prototype.decodedLength = function(s) {
      return this.maxDecodedLength(s.length - this._getPaddingLength(s));
    };
    Coder2.prototype.decode = function(s) {
      if (s.length === 0) {
        return new Uint8Array(0);
      }
      var paddingLength = this._getPaddingLength(s);
      var length = s.length - paddingLength;
      var out = new Uint8Array(this.maxDecodedLength(length));
      var op = 0;
      var i2 = 0;
      var haveBad = 0;
      var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
      for (;i2 < length - 4; i2 += 4) {
        v0 = this._decodeChar(s.charCodeAt(i2 + 0));
        v1 = this._decodeChar(s.charCodeAt(i2 + 1));
        v2 = this._decodeChar(s.charCodeAt(i2 + 2));
        v3 = this._decodeChar(s.charCodeAt(i2 + 3));
        out[op++] = v0 << 2 | v1 >>> 4;
        out[op++] = v1 << 4 | v2 >>> 2;
        out[op++] = v2 << 6 | v3;
        haveBad |= v0 & INVALID_BYTE;
        haveBad |= v1 & INVALID_BYTE;
        haveBad |= v2 & INVALID_BYTE;
        haveBad |= v3 & INVALID_BYTE;
      }
      if (i2 < length - 1) {
        v0 = this._decodeChar(s.charCodeAt(i2));
        v1 = this._decodeChar(s.charCodeAt(i2 + 1));
        out[op++] = v0 << 2 | v1 >>> 4;
        haveBad |= v0 & INVALID_BYTE;
        haveBad |= v1 & INVALID_BYTE;
      }
      if (i2 < length - 2) {
        v2 = this._decodeChar(s.charCodeAt(i2 + 2));
        out[op++] = v1 << 4 | v2 >>> 2;
        haveBad |= v2 & INVALID_BYTE;
      }
      if (i2 < length - 3) {
        v3 = this._decodeChar(s.charCodeAt(i2 + 3));
        out[op++] = v2 << 6 | v3;
        haveBad |= v3 & INVALID_BYTE;
      }
      if (haveBad !== 0) {
        throw new Error("Base64Coder: incorrect characters for decoding");
      }
      return out;
    };
    Coder2.prototype._encodeByte = function(b) {
      var result = b;
      result += 65;
      result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
      result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
      result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
      result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
      return String.fromCharCode(result);
    };
    Coder2.prototype._decodeChar = function(c) {
      var result = INVALID_BYTE;
      result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
      result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
      result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
      result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
      result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
      return result;
    };
    Coder2.prototype._getPaddingLength = function(s) {
      var paddingLength = 0;
      if (this._paddingCharacter) {
        for (var i2 = s.length - 1;i2 >= 0; i2--) {
          if (s[i2] !== this._paddingCharacter) {
            break;
          }
          paddingLength++;
        }
        if (s.length < 4 || paddingLength > 2) {
          throw new Error("Base64Coder: incorrect padding");
        }
      }
      return paddingLength;
    };
    return Coder2;
  }();
  exports.Coder = Coder;
  var stdCoder = new Coder;
  function encode(data) {
    return stdCoder.encode(data);
  }
  exports.encode = encode;
  function decode(s) {
    return stdCoder.decode(s);
  }
  exports.decode = decode;
  var URLSafeCoder = function(_super) {
    __extends(URLSafeCoder2, _super);
    function URLSafeCoder2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    URLSafeCoder2.prototype._encodeByte = function(b) {
      var result = b;
      result += 65;
      result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
      result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
      result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
      result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
      return String.fromCharCode(result);
    };
    URLSafeCoder2.prototype._decodeChar = function(c) {
      var result = INVALID_BYTE;
      result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
      result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
      result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
      result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
      result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
      return result;
    };
    return URLSafeCoder2;
  }(Coder);
  exports.URLSafeCoder = URLSafeCoder;
  var urlSafeCoder = new URLSafeCoder;
  function encodeURLSafe(data) {
    return urlSafeCoder.encode(data);
  }
  exports.encodeURLSafe = encodeURLSafe;
  function decodeURLSafe(s) {
    return urlSafeCoder.decode(s);
  }
  exports.decodeURLSafe = decodeURLSafe;
  exports.encodedLength = function(length) {
    return stdCoder.encodedLength(length);
  };
  exports.maxDecodedLength = function(length) {
    return stdCoder.maxDecodedLength(length);
  };
  exports.decodedLength = function(s) {
    return stdCoder.decodedLength(s);
  };
});

// node_modules/fast-sha256/sha256.js
var require_sha256 = __commonJS((exports, module) => {
  (function(root, factory) {
    var exports2 = {};
    factory(exports2);
    var sha256 = exports2["default"];
    for (var k in exports2) {
      sha256[k] = exports2[k];
    }
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = sha256;
    } else if (typeof define === "function" && define.amd) {
      define(function() {
        return sha256;
      });
    } else {
      root.sha256 = sha256;
    }
  })(exports, function(exports2) {
    exports2.__esModule = true;
    exports2.digestLength = 32;
    exports2.blockSize = 64;
    var K = new Uint32Array([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    function hashBlocks(w, v, p, pos, len) {
      var a, b, c, d, e, f, g, h, u, i2, j, t1, t2;
      while (len >= 64) {
        a = v[0];
        b = v[1];
        c = v[2];
        d = v[3];
        e = v[4];
        f = v[5];
        g = v[6];
        h = v[7];
        for (i2 = 0;i2 < 16; i2++) {
          j = pos + i2 * 4;
          w[i2] = (p[j] & 255) << 24 | (p[j + 1] & 255) << 16 | (p[j + 2] & 255) << 8 | p[j + 3] & 255;
        }
        for (i2 = 16;i2 < 64; i2++) {
          u = w[i2 - 2];
          t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
          u = w[i2 - 15];
          t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
          w[i2] = (t1 + w[i2 - 7] | 0) + (t2 + w[i2 - 16] | 0);
        }
        for (i2 = 0;i2 < 64; i2++) {
          t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i2] + w[i2] | 0) | 0) | 0;
          t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
          h = g;
          g = f;
          f = e;
          e = d + t1 | 0;
          d = c;
          c = b;
          b = a;
          a = t1 + t2 | 0;
        }
        v[0] += a;
        v[1] += b;
        v[2] += c;
        v[3] += d;
        v[4] += e;
        v[5] += f;
        v[6] += g;
        v[7] += h;
        pos += 64;
        len -= 64;
      }
      return pos;
    }
    var Hash = function() {
      function Hash2() {
        this.digestLength = exports2.digestLength;
        this.blockSize = exports2.blockSize;
        this.state = new Int32Array(8);
        this.temp = new Int32Array(64);
        this.buffer = new Uint8Array(128);
        this.bufferLength = 0;
        this.bytesHashed = 0;
        this.finished = false;
        this.reset();
      }
      Hash2.prototype.reset = function() {
        this.state[0] = 1779033703;
        this.state[1] = 3144134277;
        this.state[2] = 1013904242;
        this.state[3] = 2773480762;
        this.state[4] = 1359893119;
        this.state[5] = 2600822924;
        this.state[6] = 528734635;
        this.state[7] = 1541459225;
        this.bufferLength = 0;
        this.bytesHashed = 0;
        this.finished = false;
        return this;
      };
      Hash2.prototype.clean = function() {
        for (var i2 = 0;i2 < this.buffer.length; i2++) {
          this.buffer[i2] = 0;
        }
        for (var i2 = 0;i2 < this.temp.length; i2++) {
          this.temp[i2] = 0;
        }
        this.reset();
      };
      Hash2.prototype.update = function(data, dataLength) {
        if (dataLength === undefined) {
          dataLength = data.length;
        }
        if (this.finished) {
          throw new Error("SHA256: can't update because hash was finished.");
        }
        var dataPos = 0;
        this.bytesHashed += dataLength;
        if (this.bufferLength > 0) {
          while (this.bufferLength < 64 && dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++];
            dataLength--;
          }
          if (this.bufferLength === 64) {
            hashBlocks(this.temp, this.state, this.buffer, 0, 64);
            this.bufferLength = 0;
          }
        }
        if (dataLength >= 64) {
          dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
          dataLength %= 64;
        }
        while (dataLength > 0) {
          this.buffer[this.bufferLength++] = data[dataPos++];
          dataLength--;
        }
        return this;
      };
      Hash2.prototype.finish = function(out) {
        if (!this.finished) {
          var bytesHashed = this.bytesHashed;
          var left = this.bufferLength;
          var bitLenHi = bytesHashed / 536870912 | 0;
          var bitLenLo = bytesHashed << 3;
          var padLength = bytesHashed % 64 < 56 ? 64 : 128;
          this.buffer[left] = 128;
          for (var i2 = left + 1;i2 < padLength - 8; i2++) {
            this.buffer[i2] = 0;
          }
          this.buffer[padLength - 8] = bitLenHi >>> 24 & 255;
          this.buffer[padLength - 7] = bitLenHi >>> 16 & 255;
          this.buffer[padLength - 6] = bitLenHi >>> 8 & 255;
          this.buffer[padLength - 5] = bitLenHi >>> 0 & 255;
          this.buffer[padLength - 4] = bitLenLo >>> 24 & 255;
          this.buffer[padLength - 3] = bitLenLo >>> 16 & 255;
          this.buffer[padLength - 2] = bitLenLo >>> 8 & 255;
          this.buffer[padLength - 1] = bitLenLo >>> 0 & 255;
          hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
          this.finished = true;
        }
        for (var i2 = 0;i2 < 8; i2++) {
          out[i2 * 4 + 0] = this.state[i2] >>> 24 & 255;
          out[i2 * 4 + 1] = this.state[i2] >>> 16 & 255;
          out[i2 * 4 + 2] = this.state[i2] >>> 8 & 255;
          out[i2 * 4 + 3] = this.state[i2] >>> 0 & 255;
        }
        return this;
      };
      Hash2.prototype.digest = function() {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
      };
      Hash2.prototype._saveState = function(out) {
        for (var i2 = 0;i2 < this.state.length; i2++) {
          out[i2] = this.state[i2];
        }
      };
      Hash2.prototype._restoreState = function(from, bytesHashed) {
        for (var i2 = 0;i2 < this.state.length; i2++) {
          this.state[i2] = from[i2];
        }
        this.bytesHashed = bytesHashed;
        this.finished = false;
        this.bufferLength = 0;
      };
      return Hash2;
    }();
    exports2.Hash = Hash;
    var HMAC = function() {
      function HMAC2(key) {
        this.inner = new Hash;
        this.outer = new Hash;
        this.blockSize = this.inner.blockSize;
        this.digestLength = this.inner.digestLength;
        var pad = new Uint8Array(this.blockSize);
        if (key.length > this.blockSize) {
          new Hash().update(key).finish(pad).clean();
        } else {
          for (var i2 = 0;i2 < key.length; i2++) {
            pad[i2] = key[i2];
          }
        }
        for (var i2 = 0;i2 < pad.length; i2++) {
          pad[i2] ^= 54;
        }
        this.inner.update(pad);
        for (var i2 = 0;i2 < pad.length; i2++) {
          pad[i2] ^= 54 ^ 92;
        }
        this.outer.update(pad);
        this.istate = new Uint32Array(8);
        this.ostate = new Uint32Array(8);
        this.inner._saveState(this.istate);
        this.outer._saveState(this.ostate);
        for (var i2 = 0;i2 < pad.length; i2++) {
          pad[i2] = 0;
        }
      }
      HMAC2.prototype.reset = function() {
        this.inner._restoreState(this.istate, this.inner.blockSize);
        this.outer._restoreState(this.ostate, this.outer.blockSize);
        return this;
      };
      HMAC2.prototype.clean = function() {
        for (var i2 = 0;i2 < this.istate.length; i2++) {
          this.ostate[i2] = this.istate[i2] = 0;
        }
        this.inner.clean();
        this.outer.clean();
      };
      HMAC2.prototype.update = function(data) {
        this.inner.update(data);
        return this;
      };
      HMAC2.prototype.finish = function(out) {
        if (this.outer.finished) {
          this.outer.finish(out);
        } else {
          this.inner.finish(out);
          this.outer.update(out, this.digestLength).finish(out);
        }
        return this;
      };
      HMAC2.prototype.digest = function() {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
      };
      return HMAC2;
    }();
    exports2.HMAC = HMAC;
    function hash(data) {
      var h = new Hash().update(data);
      var digest = h.digest();
      h.clean();
      return digest;
    }
    exports2.hash = hash;
    exports2["default"] = hash;
    function hmac(key, data) {
      var h = new HMAC(key).update(data);
      var digest = h.digest();
      h.clean();
      return digest;
    }
    exports2.hmac = hmac;
    function fillBuffer(buffer, hmac2, info, counter) {
      var num = counter[0];
      if (num === 0) {
        throw new Error("hkdf: cannot expand more");
      }
      hmac2.reset();
      if (num > 1) {
        hmac2.update(buffer);
      }
      if (info) {
        hmac2.update(info);
      }
      hmac2.update(counter);
      hmac2.finish(buffer);
      counter[0]++;
    }
    var hkdfSalt = new Uint8Array(exports2.digestLength);
    function hkdf(key, salt, info, length) {
      if (salt === undefined) {
        salt = hkdfSalt;
      }
      if (length === undefined) {
        length = 32;
      }
      var counter = new Uint8Array([1]);
      var okm = hmac(salt, key);
      var hmac_ = new HMAC(okm);
      var buffer = new Uint8Array(hmac_.digestLength);
      var bufpos = buffer.length;
      var out = new Uint8Array(length);
      for (var i2 = 0;i2 < length; i2++) {
        if (bufpos === buffer.length) {
          fillBuffer(buffer, hmac_, info, counter);
          bufpos = 0;
        }
        out[i2] = buffer[bufpos++];
      }
      hmac_.clean();
      buffer.fill(0);
      counter.fill(0);
      return out;
    }
    exports2.hkdf = hkdf;
    function pbkdf2(password, salt, iterations, dkLen) {
      var prf = new HMAC(password);
      var len = prf.digestLength;
      var ctr = new Uint8Array(4);
      var t = new Uint8Array(len);
      var u = new Uint8Array(len);
      var dk = new Uint8Array(dkLen);
      for (var i2 = 0;i2 * len < dkLen; i2++) {
        var c = i2 + 1;
        ctr[0] = c >>> 24 & 255;
        ctr[1] = c >>> 16 & 255;
        ctr[2] = c >>> 8 & 255;
        ctr[3] = c >>> 0 & 255;
        prf.reset();
        prf.update(salt);
        prf.update(ctr);
        prf.finish(u);
        for (var j = 0;j < len; j++) {
          t[j] = u[j];
        }
        for (var j = 2;j <= iterations; j++) {
          prf.reset();
          prf.update(u).finish(u);
          for (var k = 0;k < len; k++) {
            t[k] ^= u[k];
          }
        }
        for (var j = 0;j < len && i2 * len + j < dkLen; j++) {
          dk[i2 * len + j] = t[j];
        }
      }
      for (var i2 = 0;i2 < len; i2++) {
        t[i2] = u[i2] = 0;
      }
      for (var i2 = 0;i2 < 4; i2++) {
        ctr[i2] = 0;
      }
      prf.clean();
      return dk;
    }
    exports2.pbkdf2 = pbkdf2;
  });
});

// node_modules/standardwebhooks/dist/index.js
var require_dist2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Webhook = exports.WebhookVerificationError = undefined;
  var timing_safe_equal_1 = require_timing_safe_equal();
  var base64 = require_base64();
  var sha256 = require_sha256();
  var WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;

  class ExtendableError extends Error {
    constructor(message) {
      super(message);
      Object.setPrototypeOf(this, ExtendableError.prototype);
      this.name = "ExtendableError";
      this.stack = new Error(message).stack;
    }
  }

  class WebhookVerificationError extends ExtendableError {
    constructor(message) {
      super(message);
      Object.setPrototypeOf(this, WebhookVerificationError.prototype);
      this.name = "WebhookVerificationError";
    }
  }
  exports.WebhookVerificationError = WebhookVerificationError;

  class Webhook {
    constructor(secret, options) {
      if (!secret) {
        throw new Error("Secret can't be empty.");
      }
      if ((options === null || options === undefined ? undefined : options.format) === "raw") {
        if (secret instanceof Uint8Array) {
          this.key = secret;
        } else {
          this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
        }
      } else {
        if (typeof secret !== "string") {
          throw new Error("Expected secret to be of type string");
        }
        if (secret.startsWith(Webhook.prefix)) {
          secret = secret.substring(Webhook.prefix.length);
        }
        this.key = base64.decode(secret);
      }
    }
    verify(payload, headers_) {
      const headers = {};
      for (const key of Object.keys(headers_)) {
        headers[key.toLowerCase()] = headers_[key];
      }
      const msgId = headers["webhook-id"];
      const msgSignature = headers["webhook-signature"];
      const msgTimestamp = headers["webhook-timestamp"];
      if (!msgSignature || !msgId || !msgTimestamp) {
        throw new WebhookVerificationError("Missing required headers");
      }
      const timestamp = this.verifyTimestamp(msgTimestamp);
      const computedSignature = this.sign(msgId, timestamp, payload);
      const expectedSignature = computedSignature.split(",")[1];
      const passedSignatures = msgSignature.split(" ");
      const encoder = new globalThis.TextEncoder;
      for (const versionedSignature of passedSignatures) {
        const [version, signature] = versionedSignature.split(",");
        if (version !== "v1") {
          continue;
        }
        if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
          return JSON.parse(payload.toString());
        }
      }
      throw new WebhookVerificationError("No matching signature found");
    }
    sign(msgId, timestamp, payload) {
      if (typeof payload === "string") {} else if (payload.constructor.name === "Buffer") {
        payload = payload.toString();
      } else {
        throw new Error("Expected payload to be of type string or Buffer.");
      }
      const encoder = new TextEncoder;
      const timestampNumber = Math.floor(timestamp.getTime() / 1000);
      const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
      const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
      return `v1,${expectedSignature}`;
    }
    verifyTimestamp(timestampHeader) {
      const now = Math.floor(Date.now() / 1000);
      const timestamp = parseInt(timestampHeader, 10);
      if (isNaN(timestamp)) {
        throw new WebhookVerificationError("Invalid Signature Headers");
      }
      if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
        throw new WebhookVerificationError("Message timestamp too old");
      }
      if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
        throw new WebhookVerificationError("Message timestamp too new");
      }
      return new Date(timestamp * 1000);
    }
  }
  exports.Webhook = Webhook;
  Webhook.prefix = "whsec_";
});

// node_modules/svix/dist/webhook.js
var require_webhook = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Webhook = exports.WebhookVerificationError = undefined;
  var standardwebhooks_1 = require_dist2();
  var standardwebhooks_2 = require_dist2();
  Object.defineProperty(exports, "WebhookVerificationError", { enumerable: true, get: function() {
    return standardwebhooks_2.WebhookVerificationError;
  } });

  class Webhook {
    constructor(secret, options) {
      this.inner = new standardwebhooks_1.Webhook(secret, options);
    }
    verify(payload, headers_) {
      var _a, _b, _c, _d, _e, _f;
      const headers = {};
      for (const key of Object.keys(headers_)) {
        headers[key.toLowerCase()] = headers_[key];
      }
      headers["webhook-id"] = (_b = (_a = headers["svix-id"]) !== null && _a !== undefined ? _a : headers["webhook-id"]) !== null && _b !== undefined ? _b : "";
      headers["webhook-signature"] = (_d = (_c = headers["svix-signature"]) !== null && _c !== undefined ? _c : headers["webhook-signature"]) !== null && _d !== undefined ? _d : "";
      headers["webhook-timestamp"] = (_f = (_e = headers["svix-timestamp"]) !== null && _e !== undefined ? _e : headers["webhook-timestamp"]) !== null && _f !== undefined ? _f : "";
      return this.inner.verify(payload, headers);
    }
    sign(msgId, timestamp, payload) {
      return this.inner.sign(msgId, timestamp, payload);
    }
  }
  exports.Webhook = Webhook;
});

// node_modules/svix/dist/models/endpointDisabledTrigger.js
var require_endpointDisabledTrigger = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EndpointDisabledTriggerSerializer = exports.EndpointDisabledTrigger = undefined;
  var EndpointDisabledTrigger;
  (function(EndpointDisabledTrigger2) {
    EndpointDisabledTrigger2["Manual"] = "manual";
    EndpointDisabledTrigger2["Automatic"] = "automatic";
  })(EndpointDisabledTrigger = exports.EndpointDisabledTrigger || (exports.EndpointDisabledTrigger = {}));
  exports.EndpointDisabledTriggerSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/ordering.js
var require_ordering = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OrderingSerializer = exports.Ordering = undefined;
  var Ordering;
  (function(Ordering2) {
    Ordering2["Ascending"] = "ascending";
    Ordering2["Descending"] = "descending";
  })(Ordering = exports.Ordering || (exports.Ordering = {}));
  exports.OrderingSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/statusCodeClass.js
var require_statusCodeClass = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StatusCodeClassSerializer = exports.StatusCodeClass = undefined;
  var StatusCodeClass;
  (function(StatusCodeClass2) {
    StatusCodeClass2[StatusCodeClass2["CodeNone"] = 0] = "CodeNone";
    StatusCodeClass2[StatusCodeClass2["Code1xx"] = 100] = "Code1xx";
    StatusCodeClass2[StatusCodeClass2["Code2xx"] = 200] = "Code2xx";
    StatusCodeClass2[StatusCodeClass2["Code3xx"] = 300] = "Code3xx";
    StatusCodeClass2[StatusCodeClass2["Code4xx"] = 400] = "Code4xx";
    StatusCodeClass2[StatusCodeClass2["Code5xx"] = 500] = "Code5xx";
  })(StatusCodeClass = exports.StatusCodeClass || (exports.StatusCodeClass = {}));
  exports.StatusCodeClassSerializer = {
    _fromJsonObject(object) {
      return object;
    },
    _toJsonObject(self) {
      return self;
    }
  };
});

// node_modules/svix/dist/models/index.js
var require_models = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StatusCodeClass = exports.SinkStatusIn = exports.SinkStatus = exports.Ordering = exports.MessageStatusText = exports.MessageStatus = exports.MessageAttemptTriggerType = exports.EndpointDisabledTrigger = exports.ConnectorProduct = exports.ConnectorKind = exports.BackgroundTaskType = exports.BackgroundTaskStatus = exports.AppPortalCapability = undefined;
  var appPortalCapability_1 = require_appPortalCapability();
  Object.defineProperty(exports, "AppPortalCapability", { enumerable: true, get: function() {
    return appPortalCapability_1.AppPortalCapability;
  } });
  var backgroundTaskStatus_1 = require_backgroundTaskStatus();
  Object.defineProperty(exports, "BackgroundTaskStatus", { enumerable: true, get: function() {
    return backgroundTaskStatus_1.BackgroundTaskStatus;
  } });
  var backgroundTaskType_1 = require_backgroundTaskType();
  Object.defineProperty(exports, "BackgroundTaskType", { enumerable: true, get: function() {
    return backgroundTaskType_1.BackgroundTaskType;
  } });
  var connectorKind_1 = require_connectorKind();
  Object.defineProperty(exports, "ConnectorKind", { enumerable: true, get: function() {
    return connectorKind_1.ConnectorKind;
  } });
  var connectorProduct_1 = require_connectorProduct();
  Object.defineProperty(exports, "ConnectorProduct", { enumerable: true, get: function() {
    return connectorProduct_1.ConnectorProduct;
  } });
  var endpointDisabledTrigger_1 = require_endpointDisabledTrigger();
  Object.defineProperty(exports, "EndpointDisabledTrigger", { enumerable: true, get: function() {
    return endpointDisabledTrigger_1.EndpointDisabledTrigger;
  } });
  var messageAttemptTriggerType_1 = require_messageAttemptTriggerType();
  Object.defineProperty(exports, "MessageAttemptTriggerType", { enumerable: true, get: function() {
    return messageAttemptTriggerType_1.MessageAttemptTriggerType;
  } });
  var messageStatus_1 = require_messageStatus();
  Object.defineProperty(exports, "MessageStatus", { enumerable: true, get: function() {
    return messageStatus_1.MessageStatus;
  } });
  var messageStatusText_1 = require_messageStatusText();
  Object.defineProperty(exports, "MessageStatusText", { enumerable: true, get: function() {
    return messageStatusText_1.MessageStatusText;
  } });
  var ordering_1 = require_ordering();
  Object.defineProperty(exports, "Ordering", { enumerable: true, get: function() {
    return ordering_1.Ordering;
  } });
  var sinkStatus_1 = require_sinkStatus();
  Object.defineProperty(exports, "SinkStatus", { enumerable: true, get: function() {
    return sinkStatus_1.SinkStatus;
  } });
  var sinkStatusIn_1 = require_sinkStatusIn();
  Object.defineProperty(exports, "SinkStatusIn", { enumerable: true, get: function() {
    return sinkStatusIn_1.SinkStatusIn;
  } });
  var statusCodeClass_1 = require_statusCodeClass();
  Object.defineProperty(exports, "StatusCodeClass", { enumerable: true, get: function() {
    return statusCodeClass_1.StatusCodeClass;
  } });
});

// node_modules/svix/dist/index.js
var require_dist3 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Svix = exports.messageInRaw = exports.ValidationError = exports.HttpErrorOut = exports.HTTPValidationError = exports.ApiException = undefined;
  var application_1 = require_application();
  var authentication_1 = require_authentication();
  var backgroundTask_1 = require_backgroundTask();
  var connector_1 = require_connector();
  var endpoint_1 = require_endpoint();
  var environment_1 = require_environment();
  var eventType_1 = require_eventType();
  var health_1 = require_health();
  var ingest_1 = require_ingest();
  var integration_1 = require_integration();
  var message_1 = require_message();
  var messageAttempt_1 = require_messageAttempt();
  var operationalWebhook_1 = require_operationalWebhook();
  var statistics_1 = require_statistics();
  var streaming_1 = require_streaming();
  var operationalWebhookEndpoint_1 = require_operationalWebhookEndpoint();
  var util_1 = require_util();
  Object.defineProperty(exports, "ApiException", { enumerable: true, get: function() {
    return util_1.ApiException;
  } });
  var HttpErrors_1 = require_HttpErrors();
  Object.defineProperty(exports, "HTTPValidationError", { enumerable: true, get: function() {
    return HttpErrors_1.HTTPValidationError;
  } });
  Object.defineProperty(exports, "HttpErrorOut", { enumerable: true, get: function() {
    return HttpErrors_1.HttpErrorOut;
  } });
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return HttpErrors_1.ValidationError;
  } });
  __exportStar(require_webhook(), exports);
  __exportStar(require_models(), exports);
  var message_2 = require_message();
  Object.defineProperty(exports, "messageInRaw", { enumerable: true, get: function() {
    return message_2.messageInRaw;
  } });
  var REGIONS = [
    { region: "us", url: "https://api.us.svix.com" },
    { region: "eu", url: "https://api.eu.svix.com" },
    { region: "in", url: "https://api.in.svix.com" },
    { region: "ca", url: "https://api.ca.svix.com" },
    { region: "au", url: "https://api.au.svix.com" }
  ];

  class Svix {
    constructor(token, options = {}) {
      var _a, _b, _c;
      const regionalUrl = (_a = REGIONS.find((x) => x.region === token.split(".")[1])) === null || _a === undefined ? undefined : _a.url;
      const baseUrl = (_c = (_b = options.serverUrl) !== null && _b !== undefined ? _b : regionalUrl) !== null && _c !== undefined ? _c : "https://api.svix.com";
      if (options.retryScheduleInMs) {
        this.requestCtx = {
          baseUrl,
          token,
          timeout: options.requestTimeout,
          retryScheduleInMs: options.retryScheduleInMs,
          fetch: options.fetch
        };
        return;
      }
      if (options.numRetries) {
        this.requestCtx = {
          baseUrl,
          token,
          timeout: options.requestTimeout,
          numRetries: options.numRetries,
          fetch: options.fetch
        };
        return;
      }
      this.requestCtx = {
        baseUrl,
        token,
        timeout: options.requestTimeout,
        fetch: options.fetch
      };
    }
    get application() {
      return new application_1.Application(this.requestCtx);
    }
    get authentication() {
      return new authentication_1.Authentication(this.requestCtx);
    }
    get backgroundTask() {
      return new backgroundTask_1.BackgroundTask(this.requestCtx);
    }
    get connector() {
      return new connector_1.Connector(this.requestCtx);
    }
    get endpoint() {
      return new endpoint_1.Endpoint(this.requestCtx);
    }
    get environment() {
      return new environment_1.Environment(this.requestCtx);
    }
    get eventType() {
      return new eventType_1.EventType(this.requestCtx);
    }
    get health() {
      return new health_1.Health(this.requestCtx);
    }
    get ingest() {
      return new ingest_1.Ingest(this.requestCtx);
    }
    get integration() {
      return new integration_1.Integration(this.requestCtx);
    }
    get message() {
      return new message_1.Message(this.requestCtx);
    }
    get messageAttempt() {
      return new messageAttempt_1.MessageAttempt(this.requestCtx);
    }
    get operationalWebhook() {
      return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
    }
    get statistics() {
      return new statistics_1.Statistics(this.requestCtx);
    }
    get streaming() {
      return new streaming_1.Streaming(this.requestCtx);
    }
    get operationalWebhookEndpoint() {
      return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
  }
  exports.Svix = Svix;
});

// node_modules/resend/dist/index.mjs
var exports_dist = {};
__export(exports_dist, {
  Resend: () => Resend
});
function buildPaginationQuery(options) {
  const searchParams = new URLSearchParams;
  if (options.limit !== undefined)
    searchParams.set("limit", options.limit.toString());
  if ("after" in options && options.after !== undefined)
    searchParams.set("after", options.after);
  if ("before" in options && options.before !== undefined)
    searchParams.set("before", options.before);
  return searchParams.toString();
}
function parseAttachments(attachments) {
  return attachments?.map((attachment) => ({
    content: attachment.content,
    filename: attachment.filename,
    path: attachment.path,
    content_type: attachment.contentType,
    content_id: attachment.contentId
  }));
}
function parseEmailToApiOptions(email) {
  return {
    attachments: parseAttachments(email.attachments),
    bcc: email.bcc,
    cc: email.cc,
    from: email.from,
    headers: email.headers,
    html: email.html,
    reply_to: email.replyTo,
    scheduled_at: email.scheduledAt,
    subject: email.subject,
    tags: email.tags,
    text: email.text,
    to: email.to,
    template: email.template ? {
      id: email.template.id,
      variables: email.template.variables
    } : undefined,
    topic_id: email.topicId
  };
}
async function render(node) {
  let render2;
  try {
    ({ render: render2 } = await import("@react-email/render"));
  } catch {
    throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
  }
  return render2(node);
}
function parseContactPropertyFromApi(contactProperty) {
  return {
    id: contactProperty.id,
    key: contactProperty.key,
    createdAt: contactProperty.created_at,
    type: contactProperty.type,
    fallbackValue: contactProperty.fallback_value
  };
}
function parseContactPropertyToApiOptions(contactProperty) {
  if ("key" in contactProperty)
    return {
      key: contactProperty.key,
      type: contactProperty.type,
      fallback_value: contactProperty.fallbackValue
    };
  return { fallback_value: contactProperty.fallbackValue };
}
function parseDomainToApiOptions(domain) {
  return {
    name: domain.name,
    region: domain.region,
    custom_return_path: domain.customReturnPath,
    capabilities: domain.capabilities,
    open_tracking: domain.openTracking,
    click_tracking: domain.clickTracking,
    tls: domain.tls
  };
}
function getPaginationQueryProperties(options = {}) {
  const query = new URLSearchParams;
  if (options.before)
    query.set("before", options.before);
  if (options.after)
    query.set("after", options.after);
  if (options.limit)
    query.set("limit", options.limit.toString());
  return query.size > 0 ? `?${query.toString()}` : "";
}
function parseVariables(variables) {
  return variables?.map((variable) => ({
    key: variable.key,
    type: variable.type,
    fallback_value: variable.fallbackValue
  }));
}
function parseTemplateToApiOptions(template) {
  return {
    name: "name" in template ? template.name : undefined,
    subject: template.subject,
    html: template.html,
    text: template.text,
    alias: template.alias,
    from: template.from,
    reply_to: template.replyTo,
    variables: parseVariables(template.variables)
  };
}
var import_svix, version = "6.9.2", ApiKeys = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/api-keys", payload, options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
    return await this.resend.get(url);
  }
  async remove(id) {
    return await this.resend.delete(`/api-keys/${id}`);
  }
}, Batch = class {
  constructor(resend) {
    this.resend = resend;
  }
  async send(payload, options) {
    return this.create(payload, options);
  }
  async create(payload, options) {
    const emails = [];
    for (const email of payload) {
      if (email.react) {
        email.html = await render(email.react);
        email.react = undefined;
      }
      emails.push(parseEmailToApiOptions(email));
    }
    return await this.resend.post("/emails/batch", emails, {
      ...options,
      headers: {
        "x-batch-validation": options?.batchValidation ?? "strict",
        ...options?.headers
      }
    });
  }
}, Broadcasts = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    if (payload.react)
      payload.html = await render(payload.react);
    return await this.resend.post("/broadcasts", {
      name: payload.name,
      segment_id: payload.segmentId,
      audience_id: payload.audienceId,
      preview_text: payload.previewText,
      from: payload.from,
      html: payload.html,
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      topic_id: payload.topicId,
      send: payload.send,
      scheduled_at: payload.scheduledAt
    }, options);
  }
  async send(id, payload) {
    return await this.resend.post(`/broadcasts/${id}/send`, { scheduled_at: payload?.scheduledAt });
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/broadcasts/${id}`);
  }
  async remove(id) {
    return await this.resend.delete(`/broadcasts/${id}`);
  }
  async update(id, payload) {
    if (payload.react)
      payload.html = await render(payload.react);
    return await this.resend.patch(`/broadcasts/${id}`, {
      name: payload.name,
      segment_id: payload.segmentId,
      audience_id: payload.audienceId,
      from: payload.from,
      html: payload.html,
      text: payload.text,
      subject: payload.subject,
      reply_to: payload.replyTo,
      preview_text: payload.previewText,
      topic_id: payload.topicId
    });
  }
}, ContactProperties = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(options) {
    const apiOptions = parseContactPropertyToApiOptions(options);
    return await this.resend.post("/contact-properties", apiOptions);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
    const response = await this.resend.get(url);
    if (response.data)
      return {
        data: {
          ...response.data,
          data: response.data.data.map((apiContactProperty) => parseContactPropertyFromApi(apiContactProperty))
        },
        headers: response.headers,
        error: null
      };
    return response;
  }
  async get(id) {
    if (!id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const response = await this.resend.get(`/contact-properties/${id}`);
    if (response.data)
      return {
        data: {
          object: "contact_property",
          ...parseContactPropertyFromApi(response.data)
        },
        headers: response.headers,
        error: null
      };
    return response;
  }
  async update(payload) {
    if (!payload.id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const apiOptions = parseContactPropertyToApiOptions(payload);
    return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
  }
  async remove(id) {
    if (!id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    return await this.resend.delete(`/contact-properties/${id}`);
  }
}, ContactSegments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async list(options) {
    if (!options.contactId && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const identifier = options.email ? options.email : options.contactId;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
    return await this.resend.get(url);
  }
  async add(options) {
    if (!options.contactId && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
  }
  async remove(options) {
    if (!options.contactId && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
  }
}, ContactTopics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async update(payload) {
    if (!payload.id && !payload.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const identifier = payload.email ? payload.email : payload.id;
    return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
  }
  async list(options) {
    if (!options.id && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    const identifier = options.email ? options.email : options.id;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
    return this.resend.get(url);
  }
}, Contacts = class {
  constructor(resend) {
    this.resend = resend;
    this.topics = new ContactTopics(this.resend);
    this.segments = new ContactSegments(this.resend);
  }
  async create(payload, options = {}) {
    if ("audienceId" in payload) {
      if ("segments" in payload || "topics" in payload)
        return {
          data: null,
          headers: null,
          error: {
            message: "`audienceId` is deprecated, and cannot be used together with `segments` or `topics`. Use `segments` instead to add one or more segments to the new contact.",
            statusCode: null,
            name: "invalid_parameter"
          }
        };
      return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
        unsubscribed: payload.unsubscribed,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        properties: payload.properties
      }, options);
    }
    return await this.resend.post("/contacts", {
      unsubscribed: payload.unsubscribed,
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      properties: payload.properties,
      segments: payload.segments,
      topics: payload.topics
    }, options);
  }
  async list(options = {}) {
    const segmentId = options.segmentId ?? options.audienceId;
    if (!segmentId) {
      const queryString2 = buildPaginationQuery(options);
      const url2 = queryString2 ? `/contacts?${queryString2}` : "/contacts";
      return await this.resend.get(url2);
    }
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
    return await this.resend.get(url);
  }
  async get(options) {
    if (typeof options === "string")
      return this.resend.get(`/contacts/${options}`);
    if (!options.id && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    if (!options.audienceId)
      return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
    return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
  }
  async update(options) {
    if (!options.id && !options.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    if (!options.audienceId)
      return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
        unsubscribed: options.unsubscribed,
        first_name: options.firstName,
        last_name: options.lastName,
        properties: options.properties
      });
    return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
      unsubscribed: options.unsubscribed,
      first_name: options.firstName,
      last_name: options.lastName,
      properties: options.properties
    });
  }
  async remove(payload) {
    if (typeof payload === "string")
      return this.resend.delete(`/contacts/${payload}`);
    if (!payload.id && !payload.email)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    if (!payload.audienceId)
      return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
    return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
  }
}, Domains = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/domains?${queryString}` : "/domains";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/domains/${id}`);
  }
  async update(payload) {
    return await this.resend.patch(`/domains/${payload.id}`, {
      click_tracking: payload.clickTracking,
      open_tracking: payload.openTracking,
      tls: payload.tls,
      capabilities: payload.capabilities
    });
  }
  async remove(id) {
    return await this.resend.delete(`/domains/${id}`);
  }
  async verify(id) {
    return await this.resend.post(`/domains/${id}/verify`);
  }
}, Attachments$1 = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
    return await this.resend.get(url);
  }
}, Attachments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
    return await this.resend.get(url);
  }
}, Receiving = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments(resend);
  }
  async get(id) {
    return await this.resend.get(`/emails/receiving/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
    return await this.resend.get(url);
  }
  async forward(options) {
    const { emailId, to, from } = options;
    const passthrough = options.passthrough !== false;
    const emailResponse = await this.get(emailId);
    if (emailResponse.error)
      return {
        data: null,
        error: emailResponse.error,
        headers: emailResponse.headers
      };
    const email = emailResponse.data;
    const originalSubject = email.subject || "(no subject)";
    if (passthrough)
      return this.forwardPassthrough(email, {
        to,
        from,
        subject: originalSubject
      });
    const forwardSubject = originalSubject.startsWith("Fwd:") ? originalSubject : `Fwd: ${originalSubject}`;
    return this.forwardWrapped(email, {
      to,
      from,
      subject: forwardSubject,
      text: "text" in options ? options.text : undefined,
      html: "html" in options ? options.html : undefined
    });
  }
  async forwardPassthrough(email, options) {
    const { to, from, subject } = options;
    if (!email.raw?.download_url)
      return {
        data: null,
        error: {
          name: "validation_error",
          message: "Raw email content is not available for this email",
          statusCode: 400
        },
        headers: null
      };
    const rawResponse = await fetch(email.raw.download_url);
    if (!rawResponse.ok)
      return {
        data: null,
        error: {
          name: "application_error",
          message: "Failed to download raw email content",
          statusCode: rawResponse.status
        },
        headers: null
      };
    const rawEmailContent = await rawResponse.text();
    const parsed = await PostalMime.parse(rawEmailContent, { attachmentEncoding: "base64" });
    const attachments = parsed.attachments.map((attachment) => {
      const contentId = attachment.contentId ? attachment.contentId.replace(/^<|>$/g, "") : undefined;
      return {
        filename: attachment.filename,
        content: attachment.content.toString(),
        content_type: attachment.mimeType,
        content_id: contentId || undefined
      };
    });
    return await this.resend.post("/emails", {
      from,
      to,
      subject,
      text: parsed.text || undefined,
      html: parsed.html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    });
  }
  async forwardWrapped(email, options) {
    const { to, from, subject, text, html } = options;
    if (!email.raw?.download_url)
      return {
        data: null,
        error: {
          name: "validation_error",
          message: "Raw email content is not available for this email",
          statusCode: 400
        },
        headers: null
      };
    const rawResponse = await fetch(email.raw.download_url);
    if (!rawResponse.ok)
      return {
        data: null,
        error: {
          name: "application_error",
          message: "Failed to download raw email content",
          statusCode: rawResponse.status
        },
        headers: null
      };
    const rawEmailContent = await rawResponse.text();
    return await this.resend.post("/emails", {
      from,
      to,
      subject,
      text,
      html,
      attachments: [{
        filename: "forwarded_message.eml",
        content: Buffer.from(rawEmailContent).toString("base64"),
        content_type: "message/rfc822"
      }]
    });
  }
}, Emails = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments$1(resend);
    this.receiving = new Receiving(resend);
  }
  async send(payload, options = {}) {
    return this.create(payload, options);
  }
  async create(payload, options = {}) {
    if (payload.react)
      payload.html = await render(payload.react);
    return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
  }
  async get(id) {
    return await this.resend.get(`/emails/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails?${queryString}` : "/emails";
    return await this.resend.get(url);
  }
  async update(payload) {
    return await this.resend.patch(`/emails/${payload.id}`, { scheduled_at: payload.scheduledAt });
  }
  async cancel(id) {
    return await this.resend.post(`/emails/${id}/cancel`);
  }
}, Segments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/segments", payload, options);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments?${queryString}` : "/segments";
    return await this.resend.get(url);
  }
  async get(id) {
    return await this.resend.get(`/segments/${id}`);
  }
  async remove(id) {
    return await this.resend.delete(`/segments/${id}`);
  }
}, ChainableTemplateResult = class {
  constructor(promise, publishFn) {
    this.promise = promise;
    this.publishFn = publishFn;
  }
  then(onfulfilled, onrejected) {
    return this.promise.then(onfulfilled, onrejected);
  }
  async publish() {
    const { data, error } = await this.promise;
    if (error)
      return {
        data: null,
        headers: null,
        error
      };
    return this.publishFn(data.id);
  }
}, Templates = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(payload) {
    return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
  }
  async performCreate(payload) {
    if (payload.react) {
      if (!this.renderAsync)
        try {
          const { renderAsync } = await import("@react-email/render");
          this.renderAsync = renderAsync;
        } catch {
          throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
        }
      payload.html = await this.renderAsync(payload.react);
    }
    return this.resend.post("/templates", parseTemplateToApiOptions(payload));
  }
  async remove(identifier) {
    return await this.resend.delete(`/templates/${identifier}`);
  }
  async get(identifier) {
    return await this.resend.get(`/templates/${identifier}`);
  }
  async list(options = {}) {
    return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
  }
  duplicate(identifier) {
    return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
  }
  async publish(identifier) {
    return await this.resend.post(`/templates/${identifier}/publish`);
  }
  async update(identifier, payload) {
    return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
  }
}, Topics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload) {
    const { defaultSubscription, ...body } = payload;
    return await this.resend.post("/topics", {
      ...body,
      default_subscription: defaultSubscription
    });
  }
  async list() {
    return await this.resend.get("/topics");
  }
  async get(id) {
    if (!id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    return await this.resend.get(`/topics/${id}`);
  }
  async update(payload) {
    if (!payload.id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    return await this.resend.patch(`/topics/${payload.id}`, payload);
  }
  async remove(id) {
    if (!id)
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    return await this.resend.delete(`/topics/${id}`);
  }
}, Webhooks = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    return await this.resend.post("/webhooks", payload, options);
  }
  async get(id) {
    return await this.resend.get(`/webhooks/${id}`);
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
    return await this.resend.get(url);
  }
  async update(id, payload) {
    return await this.resend.patch(`/webhooks/${id}`, payload);
  }
  async remove(id) {
    return await this.resend.delete(`/webhooks/${id}`);
  }
  verify(payload) {
    return new import_svix.Webhook(payload.webhookSecret).verify(payload.payload, {
      "svix-id": payload.headers.id,
      "svix-timestamp": payload.headers.timestamp,
      "svix-signature": payload.headers.signature
    });
  }
}, defaultBaseUrl = "https://api.resend.com", defaultUserAgent, baseUrl, userAgent, Resend = class {
  constructor(key) {
    this.key = key;
    this.apiKeys = new ApiKeys(this);
    this.segments = new Segments(this);
    this.audiences = this.segments;
    this.batch = new Batch(this);
    this.broadcasts = new Broadcasts(this);
    this.contacts = new Contacts(this);
    this.contactProperties = new ContactProperties(this);
    this.domains = new Domains(this);
    this.emails = new Emails(this);
    this.webhooks = new Webhooks(this);
    this.templates = new Templates(this);
    this.topics = new Topics(this);
    if (!key) {
      if (typeof process !== "undefined" && process.env)
        this.key = process.env.RESEND_API_KEY;
      if (!this.key)
        throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');
    }
    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json"
    });
  }
  async fetchRequest(path, options = {}) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      if (!response.ok)
        try {
          const rawError = await response.text();
          return {
            data: null,
            error: JSON.parse(rawError),
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (err) {
          if (err instanceof SyntaxError)
            return {
              data: null,
              error: {
                name: "application_error",
                statusCode: response.status,
                message: "Internal server error. We are unable to process your request right now, please try again later."
              },
              headers: Object.fromEntries(response.headers.entries())
            };
          const error = {
            message: response.statusText,
            statusCode: response.status,
            name: "application_error"
          };
          if (err instanceof Error)
            return {
              data: null,
              error: {
                ...error,
                message: err.message
              },
              headers: Object.fromEntries(response.headers.entries())
            };
          return {
            data: null,
            error,
            headers: Object.fromEntries(response.headers.entries())
          };
        }
      return {
        data: await response.json(),
        error: null,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch {
      return {
        data: null,
        error: {
          name: "application_error",
          statusCode: null,
          message: "Unable to fetch data. The request could not be resolved."
        },
        headers: null
      };
    }
  }
  async post(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers)
      for (const [key, value] of new Headers(options.headers).entries())
        headers.set(key, value);
    if (options.idempotencyKey)
      headers.set("Idempotency-Key", options.idempotencyKey);
    const requestOptions = {
      method: "POST",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async get(path, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers)
      for (const [key, value] of new Headers(options.headers).entries())
        headers.set(key, value);
    const requestOptions = {
      method: "GET",
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async put(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers)
      for (const [key, value] of new Headers(options.headers).entries())
        headers.set(key, value);
    const requestOptions = {
      method: "PUT",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async patch(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers)
      for (const [key, value] of new Headers(options.headers).entries())
        headers.set(key, value);
    const requestOptions = {
      method: "PATCH",
      body: JSON.stringify(entity),
      ...options,
      headers
    };
    return this.fetchRequest(path, requestOptions);
  }
  async delete(path, query) {
    const requestOptions = {
      method: "DELETE",
      body: JSON.stringify(query),
      headers: this.headers
    };
    return this.fetchRequest(path, requestOptions);
  }
};
var init_dist = __esm(() => {
  init_postal_mime();
  import_svix = __toESM(require_dist3(), 1);
  defaultUserAgent = `resend-node:${version}`;
  baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
  userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
});

// src/notifications/noop.ts
class NoopNotificationProvider {
  async sendEmail(_params) {
    return { success: true, messageId: crypto.randomUUID() };
  }
  async sendEmailBatch(params) {
    return params.map(() => ({
      success: true,
      messageId: crypto.randomUUID()
    }));
  }
  async healthCheck() {
    return { healthy: true, message: "noop" };
  }
  async close() {}
}

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

// src/notifications/resend.ts
class ResendNotificationProvider {
  config;
  circuitBreaker;
  client = null;
  constructor(config) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "resend-notifications"
    });
  }
  async sendEmail(params) {
    try {
      const client = await this.#requireClient();
      const to = Array.isArray(params.to) ? params.to : [params.to];
      const payload = {
        from: params.from ?? this.config.defaultFrom,
        to,
        subject: params.subject,
        ...params.html ? { html: params.body } : { text: params.body },
        ...params.replyTo && { replyTo: params.replyTo },
        ...params.cc && { cc: params.cc },
        ...params.bcc && { bcc: params.bcc }
      };
      const result = await this.circuitBreaker.execute(async () => client.emails.send(payload));
      log("info", "notifications", "email sent", {
        messageId: result.data?.id,
        to
      });
      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log("error", "notifications", "email send failed", {
        error: message
      });
      return { success: false, error: message };
    }
  }
  async sendEmailBatch(params) {
    try {
      const client = await this.#requireClient();
      const payloads = params.map((p) => {
        const to = Array.isArray(p.to) ? p.to : [p.to];
        return {
          from: p.from ?? this.config.defaultFrom,
          to,
          subject: p.subject,
          ...p.html ? { html: p.body } : { text: p.body },
          ...p.replyTo && { replyTo: p.replyTo },
          ...p.cc && { cc: p.cc },
          ...p.bcc && { bcc: p.bcc }
        };
      });
      const result = await this.circuitBreaker.execute(async () => client.batch.send(payloads));
      log("info", "notifications", "email batch sent", {
        count: params.length
      });
      return (result.data ?? []).map((item) => ({
        success: true,
        messageId: item.id
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log("error", "notifications", "email batch send failed", {
        error: message
      });
      return params.map(() => ({ success: false, error: message }));
    }
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
    this.client = null;
    log("info", "notifications", "Resend client closed");
  }
  async#requireClient() {
    if (this.client)
      return this.client;
    const { Resend: Resend2 } = await Promise.resolve().then(() => (init_dist(), exports_dist));
    this.client = new Resend2(this.config.apiKey);
    log("info", "notifications", "Resend client initialized");
    return this.client;
  }
}

// src/notifications/index.ts
var createNotificationProvider = (config) => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopNotificationProvider;
  }
  if (config.provider === "resend") {
    if (!config.apiKey) {
      throw new Error("ResendNotificationProvider requires apiKey in config");
    }
    if (!config.defaultFrom) {
      throw new Error("ResendNotificationProvider requires defaultFrom in config");
    }
    return new ResendNotificationProvider({
      ...config,
      apiKey: config.apiKey,
      defaultFrom: config.defaultFrom
    });
  }
  const _exhaustive = config;
  throw new Error(`Unknown notification provider: ${_exhaustive}`);
};
export {
  createNotificationProvider,
  ResendNotificationProvider,
  NoopNotificationProvider
};
