function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("PandaBridge", ["exports", "lodash/isArray", "lodash/isObject", "lodash/map", "lodash/fromPairs", "lodash/startsWith"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("lodash/isArray"), require("lodash/isObject"), require("lodash/map"), require("lodash/fromPairs"), require("lodash/startsWith"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.isArray, global.isObject, global.map, global.fromPairs, global.startsWith);
    global.PandaBridge = mod.exports.default;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _isArray, _isObject, _map, _fromPairs, _startsWith) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;
  _isArray = _interopRequireDefault(_isArray);
  _isObject = _interopRequireDefault(_isObject);
  _map = _interopRequireDefault(_map);
  _fromPairs = _interopRequireDefault(_fromPairs);
  _startsWith = _interopRequireDefault(_startsWith);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
  function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
  var PandaBridge = function PandaBridge() {};
  PandaBridge.initCallBack = null;
  PandaBridge.loadCallBack = null;
  PandaBridge.updateCallBack = null;
  PandaBridge.globalReceive = [];
  PandaBridge.eventReceive = {};
  PandaBridge.waitingSend = [];
  PandaBridge.bridge = null;
  PandaBridge.isStudio = false;
  PandaBridge.resources = [];
  PandaBridge.properties = {};
  PandaBridge.markers = [];
  PandaBridge.isCoreInitialized = false;
  PandaBridge.INITIALIZE = '__ps_initialize';
  PandaBridge.UPDATE = '__ps_update';
  PandaBridge.SYNCHRONIZE = 'synchronize';
  PandaBridge.TRIGGER_MARKER = 'triggerMarker';
  PandaBridge.INITIALIZED = '__ps_initialized';
  PandaBridge.UPDATED = '__ps_updated';
  PandaBridge.STUDIO = '__ps_studio';
  PandaBridge.LANGUAGE = '__ps_language';
  PandaBridge.UNIQUE_ID = '__ps_id';
  PandaBridge.BINDABLE = '__ps_bindable';
  PandaBridge.SCREENS = '__ps_screens';
  PandaBridge.GET_SNAPSHOT_DATA = '__ps_getSnapshotData';
  PandaBridge.SET_SNAPSHOT_DATA = '__ps_setSnapshotData';
  PandaBridge.SNAPSHOT_DATA_RESULT = '__ps_snapshotDataResult';
  PandaBridge.OPEN_URL = '__ps_openUrl';
  PandaBridge.GET_SCREENSHOT = '__ps_getScreenshot';
  PandaBridge.SCREENSHOT_RESULT = '__ps_screenshotResult';
  PandaBridge.PANDASUITE_HOST_WITH_SCHEME = '__ps_pandasuiteHostWithScheme';
  PandaBridge.PANDASUITE_DATA_HOST_WITH_SCHEME = '__ps_pandasuiteDataHostWithScheme';
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }
  function connectWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) {
      callback(window.WebViewJavascriptBridge);

      /* Android */
    } else if (window.WebViewAndroidBridge && window === window.top) {
      callback({
        init: function init(receiveCallBack) {
          window.sendMessage = function sendMessage(message) {
            receiveCallBack(message);
          };
        },
        send: function send(message) {
          window.WebViewAndroidBridge.send(message);
        }
      });
    } else {
      /* In case we are on iOS */
      document.addEventListener('WebViewJavascriptBridgeReady', function () {
        callback(window.WebViewJavascriptBridge);
      }, false);
      if (isIOS()) {
        if (window.WVJBCallbacks) {
          return window.WVJBCallbacks.push(callback);
        }
        window.WVJBCallbacks = [callback];
        var WVJBIframe = document.createElement('iframe');
        WVJBIframe.style.display = 'none';
        WVJBIframe.src = 'https://__bridge_loaded__';
        document.documentElement.appendChild(WVJBIframe);
        setTimeout(function () {
          document.documentElement.removeChild(WVJBIframe);
        }, 0);
      }

      /* Javascript */
      window.addEventListener('message', function (event) {
        if (event.data === 'PandaJavascriptBridgeReady') {
          PandaBridge.listen(PandaBridge.STUDIO, function () {
            PandaBridge.isStudio = true;
          });
          PandaBridge.listen(PandaBridge.LANGUAGE, function (args) {
            PandaBridge.currentLanguage = args && args.language;
          });
          callback({
            init: function init(receiveCallBack) {
              window.addEventListener('message', function (messageEvent) {
                if (messageEvent.data !== 'PandaJavascriptBridgeReady') {
                  receiveCallBack(messageEvent.data);
                }
              }, false);
            },
            send: function send(message) {
              if (window !== window.parent) {
                // Protect to an endless looping in local dev
                window.parent.postMessage(message, '*');
              }
            }
          });
        }
      }, false);
    }
    return null;
  }
  function executeHook(event, args) {
    PandaBridge.globalReceive.forEach(function (callback) {
      callback(event, args || []);
    });
    if (PandaBridge.eventReceive[event]) {
      PandaBridge.eventReceive[event].forEach(function (callback) {
        callback(args || []);
      });
    }
  }
  connectWebViewJavascriptBridge(function (bridge) {
    /* This is only for the new IOS bridge */
    if (window.WebViewJavascriptBridge && bridge === window.WebViewJavascriptBridge && window.WebViewJavascriptBridge.send === undefined) {
      bridge = {
        init: function initClosure(internalBridge) {
          return function init(receiveCallBack) {
            internalBridge.registerHandler('message', function (data) {
              receiveCallBack(data);
            });
          };
        }(bridge),
        send: function sendClosure(internalBridge) {
          return function send(message) {
            internalBridge.callHandler('message', message);
          };
        }(bridge)
      };
    }
    PandaBridge.bridge = bridge;
    if (PandaBridge.initCallBack) {
      PandaBridge.initCallBack();
    }
    bridge.init(function (message) {
      try {
        var parsed = JSON.parse(message);
        executeHook(parsed.event, parsed.args);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    });
    PandaBridge.waitingSend.forEach(function (stringify) {
      PandaBridge.bridge.send.call(PandaBridge.bridge, stringify);
    });
    PandaBridge.waitingSend = [];
  });
  PandaBridge.init = function init(callBack) {
    PandaBridge.initCallBack = callBack;
    if (PandaBridge.bridge) {
      PandaBridge.initCallBack();
    }
  };
  PandaBridge.send = function send(event, args) {
    try {
      var stringify = JSON.stringify({
        event: event,
        args: args
      });
      if (PandaBridge.bridge) {
        PandaBridge.bridge.send.call(PandaBridge.bridge, stringify);
      } else {
        PandaBridge.waitingSend.push(stringify);
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  };

  /* General events handling */

  PandaBridge.listen = function listen(arg1, arg2) {
    if (typeof arg1 === 'function') {
      PandaBridge.globalReceive.push(arg1);
    } else {
      if (PandaBridge.eventReceive[arg1] === undefined) {
        PandaBridge.eventReceive[arg1] = [];
      }
      PandaBridge.eventReceive[arg1].push(arg2);
    }
  };
  PandaBridge.unlisten = function unlisten(arg1, arg2) {
    if (arg1 === undefined && arg2 === undefined) {
      PandaBridge.globalReceive = [];
      PandaBridge.eventReceive = {};
    } else if (typeof arg1 === 'function') {
      var index = PandaBridge.globalReceive.indexOf(arg1);
      if (index !== -1) {
        PandaBridge.globalReceive.splice(index, 1);
      }
    } else if (arg2 === undefined) {
      PandaBridge.eventReceive[arg1] = [];
    } else {
      var _index = PandaBridge.eventReceive[arg1].indexOf(arg2);
      if (_index !== -1) {
        PandaBridge.eventReceive[arg1].splice(_index, 1);
      }
    }
  };

  /* Shortcut */

  PandaBridge.listen(PandaBridge.INITIALIZE, function (args) {
    PandaBridge.isCoreInitialized = true;
    args = args || [];
    PandaBridge.resources = args[2] || [];
    PandaBridge.properties = args[0] || {};
    PandaBridge.markers = args[1] || [];
    if (PandaBridge.loadCallBack) {
      PandaBridge.loadCallBack({
        properties: PandaBridge.properties,
        markers: PandaBridge.markers,
        resources: PandaBridge.resources
      });
      PandaBridge.loadCallBack = null;
    }
  });
  PandaBridge.onLoad = function onLoad(callBack) {
    PandaBridge.loadCallBack = callBack;
    if (PandaBridge.loadCallBack && PandaBridge.isCoreInitialized) {
      PandaBridge.loadCallBack({
        properties: PandaBridge.properties,
        markers: PandaBridge.markers,
        resources: PandaBridge.resources
      });
      PandaBridge.loadCallBack = null;
    }
  };
  PandaBridge.listen(PandaBridge.UPDATE, function (args) {
    args = args || [];
    PandaBridge.resources = args[2] || [];
    PandaBridge.properties = args[0] || {};
    PandaBridge.markers = args[1] || [];
    if (PandaBridge.updateCallBack) {
      PandaBridge.updateCallBack({
        properties: PandaBridge.properties,
        markers: PandaBridge.markers,
        resources: PandaBridge.resources
      });
    }
  });
  PandaBridge.onUpdate = function onUpdate(callBack) {
    PandaBridge.updateCallBack = callBack;
  };
  PandaBridge.getSnapshotData = function getSnapshotData(callBack) {
    PandaBridge.listen(PandaBridge.GET_SNAPSHOT_DATA, function (args) {
      PandaBridge.send(PandaBridge.SNAPSHOT_DATA_RESULT, [callBack(args)]);
    });
  };
  PandaBridge.setSnapshotData = function setSnapshotData(callBack) {
    PandaBridge.listen(PandaBridge.SET_SNAPSHOT_DATA, function (args) {
      args = args || [];
      callBack({
        data: args[0] || {},
        params: args[1] || {}
      });
    });
  };
  PandaBridge.getScreenshot = function getScreenshot(callBack) {
    PandaBridge.listen(PandaBridge.GET_SCREENSHOT, function (args) {
      var resultCallback = function resultCallback(result) {
        PandaBridge.send(PandaBridge.SCREENSHOT_RESULT, [result]);
      };
      callBack(resultCallback, args);
    });
  };
  PandaBridge.takeScreenshot = function takeScreenshot() {
    executeHook(PandaBridge.GET_SCREENSHOT, null);
  };
  PandaBridge.openUrl = function openUrl(url) {
    PandaBridge.send(PandaBridge.OPEN_URL, [url]);
  };
  PandaBridge.synchronize = function synchronize(arg1, arg2) {
    if (typeof arg1 === 'function') {
      PandaBridge.listen(PandaBridge.SYNCHRONIZE, function (args) {
        arg1(args[0]);
      });
    } else if (typeof arg2 === 'function') {
      PandaBridge.listen(PandaBridge.SYNCHRONIZE, function (args) {
        if ((args || [])[1] === arg1) {
          arg2(args[0]);
        }
      });
    }
  };
  PandaBridge.resolveResource = function resolveResource(id) {
    var resources = PandaBridge.resources.filter(function (resource) {
      return resource.id === id && resource.path;
    });
    var resource = resources && resources[0];
    if (resource && PandaBridge.currentLanguage) {
      var localizedResource = resources.find(function (r) {
        return r.language === PandaBridge.currentLanguage;
      });
      if (localizedResource) {
        resource = localizedResource;
      }
    }
    return resource;
  };
  PandaBridge.resolvePath = function resolvePath(id, def) {
    var resource = PandaBridge.resolveResource(id);
    if (resource) {
      return resource.path;
    }
    return def;
  };
  PandaBridge.resolveImagePath = function resolveImagePath(id, size, def) {
    var resource = PandaBridge.resolveResource(id);
    if (resource) {
      if (resource.srcsets && resource.srcsets[size]) {
        return resource.srcsets[size];
      }
      return resource.path;
    }
    return def;
  };
  var blobToDataURL = function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function () {
        if (reader.error) {
          reject(reader.error);
        } else {
          resolve(reader.result);
        }
      };
      reader.readAsDataURL(blob);
    });
  };
  PandaBridge.resolveTypes = /*#__PURE__*/function () {
    var _resolveTypes = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(value) {
      var _this = this;
      var type, resourceValue, blob;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(0, _isArray["default"])(value)) {
                _context2.next = 2;
                break;
              }
              return _context2.abrupt("return", Promise.all((0, _map["default"])(value, function (v) {
                return _this.resolveTypes(v);
              })));
            case 2:
              if (!(0, _isObject["default"])(value)) {
                _context2.next = 26;
                break;
              }
              type = value.type, resourceValue = value.value;
              if (!(type === 'Image' || type === 'Audio' || type === 'Video')) {
                _context2.next = 21;
                break;
              }
              if ((0, _startsWith["default"])(resourceValue, 'http')) {
                _context2.next = 20;
                break;
              }
              _context2.prev = 6;
              _context2.next = 9;
              return fetch(resourceValue).then(function (r) {
                if (r.ok) {
                  return r.blob();
                }
                throw new Error();
              });
            case 9:
              blob = _context2.sent;
              _context2.t0 = type;
              _context2.next = 13;
              return blobToDataURL(blob);
            case 13:
              _context2.t1 = _context2.sent;
              return _context2.abrupt("return", {
                type: _context2.t0,
                value: _context2.t1
              });
            case 17:
              _context2.prev = 17;
              _context2.t2 = _context2["catch"](6);
              return _context2.abrupt("return", {
                type: type,
                value: null
              });
            case 20:
              return _context2.abrupt("return", value);
            case 21:
              _context2.t3 = _fromPairs["default"];
              _context2.next = 24;
              return Promise.all((0, _map["default"])(value, /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(v, k) {
                  return _regeneratorRuntime().wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.t0 = k;
                          _context.next = 3;
                          return _this.resolveTypes(v);
                        case 3:
                          _context.t1 = _context.sent;
                          return _context.abrupt("return", [_context.t0, _context.t1]);
                        case 5:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));
                return function (_x2, _x3) {
                  return _ref.apply(this, arguments);
                };
              }()));
            case 24:
              _context2.t4 = _context2.sent;
              return _context2.abrupt("return", (0, _context2.t3)(_context2.t4));
            case 26:
              return _context2.abrupt("return", value);
            case 27:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[6, 17]]);
    }));
    function resolveTypes(_x) {
      return _resolveTypes.apply(this, arguments);
    }
    return resolveTypes;
  }();
  var _default = PandaBridge;
  _exports["default"] = _default;
  if (!Array.prototype.find) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'find', {
      value: function value(predicate) {
        if (this == null) {
          throw TypeError('"this" is null or not defined');
        }
        var o = Object(this);

        // eslint-disable-next-line no-bitwise
        var len = o.length >>> 0;
        if (typeof predicate !== 'function') {
          throw TypeError('predicate must be a function');
        }

        // eslint-disable-next-line prefer-rest-params
        var thisArg = arguments[1];
        var k = 0;
        while (k < len) {
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          }
          // eslint-disable-next-line no-plusplus
          k++;
        }
        return undefined;
      },
      configurable: true,
      writable: true
    });
  }
});

