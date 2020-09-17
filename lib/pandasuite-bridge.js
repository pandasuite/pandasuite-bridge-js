(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("PandaBridge", ["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.PandaBridge = mod.exports.default;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;

  /* eslint-disable no-param-reassign */
  var PandaBridge = function PandaBridge() {};

  PandaBridge.initCallBack = null;
  PandaBridge.loadCallBack = null;
  PandaBridge.updateCallBack = null;
  PandaBridge.globalReceive = [];
  PandaBridge.eventReceive = {};
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
  PandaBridge.GET_SNAPSHOT_DATA = '__ps_getSnapshotData';
  PandaBridge.SET_SNAPSHOT_DATA = '__ps_setSnapshotData';
  PandaBridge.SNAPSHOT_DATA_RESULT = '__ps_snapshotDataResult';
  PandaBridge.GET_SCREENSHOT = '__ps_getScreenshot';
  PandaBridge.SCREENSHOT_RESULT = '__ps_screenshotResult';

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  function connectWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) {
      callback(window.WebViewJavascriptBridge);
      /* Android */
    } else if (window.WebViewAndroidBridge) {
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
        executeHook(parsed.event, parsed.args); // eslint-disable-next-line no-empty
      } catch (e) {}
    });
  });

  PandaBridge.init = function init(callBack) {
    PandaBridge.initCallBack = callBack;

    if (PandaBridge.bridge) {
      PandaBridge.initCallBack();
    }
  };

  PandaBridge.send = function send(event, args) {
    if (PandaBridge.bridge) {
      try {
        var stringify = JSON.stringify({
          event: event,
          args: args
        });
        PandaBridge.bridge.send.call(PandaBridge.bridge, stringify); // eslint-disable-next-line no-empty
      } catch (e) {}
    }
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

  PandaBridge.resolvePath = function resolvePath(id, def) {
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

    if (resource) {
      return resource.path;
    }

    return def;
  };

  var _default = PandaBridge;
  _exports["default"] = _default;

  if (!Array.prototype.find) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'find', {
      value: function value(predicate) {
        if (this == null) {
          throw TypeError('"this" is null or not defined');
        }

        var o = Object(this); // eslint-disable-next-line no-bitwise

        var len = o.length >>> 0;

        if (typeof predicate !== 'function') {
          throw TypeError('predicate must be a function');
        } // eslint-disable-next-line prefer-rest-params


        var thisArg = arguments[1];
        var k = 0;

        while (k < len) {
          var kValue = o[k];

          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          } // eslint-disable-next-line no-plusplus


          k++;
        }

        return undefined;
      },
      configurable: true,
      writable: true
    });
  }
});

