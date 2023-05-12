/* eslint-disable no-param-reassign */

import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import map from 'lodash/map';
import fromPairs from 'lodash/fromPairs';
import startsWith from 'lodash/startsWith';

const PandaBridge = function PandaBridge() {};

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

PandaBridge.GET_SNAPSHOT_DATA = '__ps_getSnapshotData';
PandaBridge.SET_SNAPSHOT_DATA = '__ps_setSnapshotData';
PandaBridge.SNAPSHOT_DATA_RESULT = '__ps_snapshotDataResult';
PandaBridge.OPEN_URL = '__ps_openUrl';

PandaBridge.GET_SCREENSHOT = '__ps_getScreenshot';
PandaBridge.SCREENSHOT_RESULT = '__ps_screenshotResult';

PandaBridge.PANDASUITE_HOST_WITH_SCHEME = '__ps_pandasuiteHostWithScheme';
PandaBridge.PANDASUITE_DATA_HOST_WITH_SCHEME = '__ps_pandasuiteDataHostWithScheme';

function isIOS() {
  return (
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function connectWebViewJavascriptBridge(callback) {
  if (window.WebViewJavascriptBridge) {
    callback(window.WebViewJavascriptBridge);

    /* Android */
  } else if (window.WebViewAndroidBridge && window === window.top) {
    callback({
      init(receiveCallBack) {
        window.sendMessage = function sendMessage(message) {
          receiveCallBack(message);
        };
      },
      send(message) {
        window.WebViewAndroidBridge.send(message);
      },
    });
  } else {
    /* In case we are on iOS */
    document.addEventListener(
      'WebViewJavascriptBridgeReady',
      () => {
        callback(window.WebViewJavascriptBridge);
      },
      false,
    );

    if (isIOS()) {
      if (window.WVJBCallbacks) {
        return window.WVJBCallbacks.push(callback);
      }
      window.WVJBCallbacks = [callback];
      const WVJBIframe = document.createElement('iframe');
      WVJBIframe.style.display = 'none';
      WVJBIframe.src = 'https://__bridge_loaded__';
      document.documentElement.appendChild(WVJBIframe);
      setTimeout(() => {
        document.documentElement.removeChild(WVJBIframe);
      }, 0);
    }

    /* Javascript */
    window.addEventListener(
      'message',
      (event) => {
        if (event.data === 'PandaJavascriptBridgeReady') {
          PandaBridge.listen(PandaBridge.STUDIO, () => {
            PandaBridge.isStudio = true;
          });
          PandaBridge.listen(PandaBridge.LANGUAGE, (args) => {
            PandaBridge.currentLanguage = args && args.language;
          });
          callback({
            init(receiveCallBack) {
              window.addEventListener(
                'message',
                (messageEvent) => {
                  if (messageEvent.data !== 'PandaJavascriptBridgeReady') {
                    receiveCallBack(messageEvent.data);
                  }
                },
                false,
              );
            },
            send(message) {
              if (window !== window.parent) {
                // Protect to an endless looping in local dev
                window.parent.postMessage(message, '*');
              }
            },
          });
        }
      },
      false,
    );
  }
  return null;
}

function executeHook(event, args) {
  PandaBridge.globalReceive.forEach((callback) => {
    callback(event, args || []);
  });

  if (PandaBridge.eventReceive[event]) {
    PandaBridge.eventReceive[event].forEach((callback) => {
      callback(args || []);
    });
  }
}

connectWebViewJavascriptBridge((bridge) => {
  /* This is only for the new IOS bridge */
  if (
    window.WebViewJavascriptBridge
    && bridge === window.WebViewJavascriptBridge
    && window.WebViewJavascriptBridge.send === undefined
  ) {
    bridge = {
      init: (function initClosure(internalBridge) {
        return function init(receiveCallBack) {
          internalBridge.registerHandler('message', (data) => {
            receiveCallBack(data);
          });
        };
      }(bridge)),
      send: (function sendClosure(internalBridge) {
        return function send(message) {
          internalBridge.callHandler('message', message);
        };
      }(bridge)),
    };
  }

  PandaBridge.bridge = bridge;

  if (PandaBridge.initCallBack) {
    PandaBridge.initCallBack();
  }

  bridge.init((message) => {
    try {
      const parsed = JSON.parse(message);
      executeHook(parsed.event, parsed.args);
    // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  PandaBridge.waitingSend.forEach((stringify) => {
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
    const stringify = JSON.stringify({ event, args });
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
    const index = PandaBridge.globalReceive.indexOf(arg1);
    if (index !== -1) {
      PandaBridge.globalReceive.splice(index, 1);
    }
  } else if (arg2 === undefined) {
    PandaBridge.eventReceive[arg1] = [];
  } else {
    const index = PandaBridge.eventReceive[arg1].indexOf(arg2);
    if (index !== -1) {
      PandaBridge.eventReceive[arg1].splice(index, 1);
    }
  }
};

/* Shortcut */

PandaBridge.listen(PandaBridge.INITIALIZE, (args) => {
  PandaBridge.isCoreInitialized = true;

  args = args || [];

  PandaBridge.resources = args[2] || [];
  PandaBridge.properties = args[0] || {};
  PandaBridge.markers = args[1] || [];

  if (PandaBridge.loadCallBack) {
    PandaBridge.loadCallBack({
      properties: PandaBridge.properties,
      markers: PandaBridge.markers,
      resources: PandaBridge.resources,
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
      resources: PandaBridge.resources,
    });
    PandaBridge.loadCallBack = null;
  }
};

PandaBridge.listen(PandaBridge.UPDATE, (args) => {
  args = args || [];

  PandaBridge.resources = args[2] || [];
  PandaBridge.properties = args[0] || {};
  PandaBridge.markers = args[1] || [];

  if (PandaBridge.updateCallBack) {
    PandaBridge.updateCallBack({
      properties: PandaBridge.properties,
      markers: PandaBridge.markers,
      resources: PandaBridge.resources,
    });
  }
});

PandaBridge.onUpdate = function onUpdate(callBack) {
  PandaBridge.updateCallBack = callBack;
};

PandaBridge.getSnapshotData = function getSnapshotData(callBack) {
  PandaBridge.listen(PandaBridge.GET_SNAPSHOT_DATA, (args) => {
    PandaBridge.send(PandaBridge.SNAPSHOT_DATA_RESULT, [callBack(args)]);
  });
};

PandaBridge.setSnapshotData = function setSnapshotData(callBack) {
  PandaBridge.listen(PandaBridge.SET_SNAPSHOT_DATA, (args) => {
    args = args || [];
    callBack({
      data: args[0] || {},
      params: args[1] || {},
    });
  });
};

PandaBridge.getScreenshot = function getScreenshot(callBack) {
  PandaBridge.listen(PandaBridge.GET_SCREENSHOT, (args) => {
    const resultCallback = (result) => {
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
    PandaBridge.listen(PandaBridge.SYNCHRONIZE, (args) => {
      arg1(args[0]);
    });
  } else if (typeof arg2 === 'function') {
    PandaBridge.listen(PandaBridge.SYNCHRONIZE, (args) => {
      if ((args || [])[1] === arg1) {
        arg2(args[0]);
      }
    });
  }
};

PandaBridge.resolveResource = function resolveResource(id) {
  const resources = PandaBridge.resources.filter(
    (resource) => resource.id === id && resource.path,
  );
  let resource = resources && resources[0];

  if (resource && PandaBridge.currentLanguage) {
    const localizedResource = resources.find((r) => r.language === PandaBridge.currentLanguage);

    if (localizedResource) {
      resource = localizedResource;
    }
  }

  return resource;
};

PandaBridge.resolvePath = function resolvePath(id, def) {
  const resource = PandaBridge.resolveResource(id);

  if (resource) {
    return resource.path;
  }
  return def;
};

PandaBridge.resolveImagePath = function resolveImagePath(id, size, def) {
  const resource = PandaBridge.resolveResource(id);

  if (resource) {
    if (resource.srcsets && resource.srcsets[size]) {
      return resource.srcsets[size];
    }
    return resource.path;
  }
  return def;
};

const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onloadend = () => {
    if (reader.error) {
      reject(reader.error);
    } else {
      resolve(reader.result);
    }
  };
  reader.readAsDataURL(blob);
});

PandaBridge.resolveTypes = async function resolveTypes(value) {
  if (isArray(value)) {
    return Promise.all(map(value, (v) => this.resolveTypes(v)));
  }
  if (isObject(value)) {
    const { type, value: resourceValue } = value;

    if (type === 'Image' || type === 'Audio' || type === 'Video') {
      // convert local resources to data urls
      if (!startsWith(resourceValue, 'http')) {
        try {
          const blob = await fetch(resourceValue).then((r) => {
            if (r.ok) {
              return r.blob();
            }
            throw new Error();
          });
          return {
            type,
            value: await blobToDataURL(blob),
          };
        } catch (e) {
          return {
            type,
            value: null,
          };
        }
      }
      return value;
    }
    return fromPairs(
      await Promise.all(map(value, async (v, k) => [k, await this.resolveTypes(v)])),
    );
  }
  return value;
};

export default PandaBridge;

if (!Array.prototype.find) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'find', {
    value(predicate) {
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      const o = Object(this);

      // eslint-disable-next-line no-bitwise
      const len = o.length >>> 0;

      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // eslint-disable-next-line prefer-rest-params
      const thisArg = arguments[1];

      let k = 0;

      while (k < len) {
        const kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // eslint-disable-next-line no-plusplus
        k++;
      }
      return undefined;
    },
    configurable: true,
    writable: true,
  });
}
