/* eslint-disable no-param-reassign */

import isArray from 'lodash-es/isArray';
import isObject from 'lodash-es/isObject';
import isString from 'lodash-es/isString';
import map from 'lodash-es/map';
import fromPairs from 'lodash-es/fromPairs';
import startsWith from 'lodash-es/startsWith';

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
PandaBridge.RESOLVE_SHORT_TAGS = 'resolveShortTags';
PandaBridge.RESOLVE_DEEP_SHORT_TAGS = 'resolveDeepShortTags';

PandaBridge.STUDIO = '__ps_studio';
PandaBridge.LANGUAGE = '__ps_language';
PandaBridge.UNIQUE_ID = '__ps_id';
PandaBridge.BINDABLE = '__ps_bindable';
PandaBridge.SCREENS = '__ps_screens';
PandaBridge.APP_STATE = '__ps_appState';

PandaBridge.GET_SNAPSHOT_DATA = '__ps_getSnapshotData';
PandaBridge.SET_SNAPSHOT_DATA = '__ps_setSnapshotData';
PandaBridge.SNAPSHOT_DATA_RESULT = '__ps_snapshotDataResult';
PandaBridge.OPEN_URL = '__ps_openUrl';

PandaBridge.GET_SCREENSHOT = '__ps_getScreenshot';
PandaBridge.SCREENSHOT_RESULT = '__ps_screenshotResult';

PandaBridge.PANDASUITE_HOST_WITH_SCHEME = '__ps_pandasuiteHostWithScheme';
PandaBridge.PANDASUITE_DATA_HOST_WITH_SCHEME =
  '__ps_pandasuiteDataHostWithScheme';

/* Correlated responses: a minted event name, passed as the last argument of a
 * message, under which the answer comes back. */
PandaBridge.RESPONSE_EVENT_PREFIX = '__ps_response_';

/* Keys awaiting an answer. Not `eventReceive`, which `unlisten()` clears; and
 * null-prototype, since incoming event names are looked up here. */
const pendingResponses = Object.create(null);

let responseCounter = 0;

function responseKey() {
  const { crypto } = window;

  /* `randomUUID` needs a secure context, which an iframe is not always */
  const unique =
    crypto && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${(responseCounter += 1)}`;

  return PandaBridge.RESPONSE_EVENT_PREFIX + unique;
}

/* The last argument, when it is a string under the reserved prefix */
function responseKeyOf(args) {
  const last = isArray(args) ? args[args.length - 1] : undefined;

  return isString(last) && startsWith(last, PandaBridge.RESPONSE_EVENT_PREFIX)
    ? last
    : undefined;
}

/* Total: a failure reaches `failed` whatever it carries */
function errorMessage(error) {
  try {
    if (error && typeof error.message === 'string') {
      return error.message;
    }
    return String(error);
  } catch (conversionError) {
    return 'failed';
  }
}

function isThenable(value) {
  return value != null && typeof value.then === 'function';
}

function okOutcome(value) {
  return value === undefined ? { status: 'ok' } : { status: 'ok', value };
}

function failedOutcome(error) {
  return { status: 'failed', error: errorMessage(error) };
}

function isIOS() {
  return (
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
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
          PandaBridge.listen(PandaBridge.STUDIO, (args) => {
            PandaBridge.isStudio = args || true;
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
  const caller = pendingResponses[event];

  /* A settlement is protocol traffic, not a component event; a key nobody waits
   * for falls through, so no event name is reserved. */
  if (caller) {
    delete pendingResponses[event];
    caller(isArray(args) ? args[0] : args);
    return;
  }

  const key = responseKeyOf(args);
  /* The key is transport, never an author's parameter */
  const visible = (key ? args.slice(0, -1) : args) || [];

  PandaBridge.globalReceive.forEach((callback) => {
    callback(event, visible);
  });

  const listeners = PandaBridge.eventReceive[event];

  if (!key) {
    if (listeners) {
      listeners.forEach((callback) => {
        callback(visible);
      });
    }
    return;
  }

  /* One responder, the first listener of the event; the others and the globals
   * observe. No listener answers absent rather than leaving the caller waiting. */
  if (!listeners || listeners.length === 0) {
    respond(key, okOutcome());
    return;
  }
  listeners.forEach((callback, index) => {
    if (index === 0) {
      settleFrom(key, callback, visible);
    } else {
      callback(visible);
    }
  });
}

function sendOutcome(key, outcome) {
  try {
    dispatch(stringifyMessage(key, [outcome]));
    return null;
  } catch (e) {
    console.error('PandaBridge: unable to send response', key, e);
    return e;
  }
}

/* One outcome per key: a value the wire cannot carry becomes a failure rather
 * than a message that never leaves. */
function respond(key, outcome) {
  const error = sendOutcome(key, outcome);

  if (error) {
    sendOutcome(key, failedOutcome(error));
  }
}

/* The listener's return value settles the answer. Adopted through
 * `Promise.resolve`, never by calling `then` directly: that is what settles it
 * once, keeps a throwing `then` from escaping, and resolves a nested thenable. */
function settleFrom(key, listener, args) {
  let returned;

  try {
    returned = listener(args);

    if (returned === undefined) {
      respond(key, okOutcome());
      return;
    }
    if (!isThenable(returned)) {
      respond(key, okOutcome(returned));
      return;
    }
  } catch (e) {
    respond(key, failedOutcome(e));
    return;
  }
  Promise.resolve(returned).then(
    (value) => respond(key, okOutcome(value)),
    (error) => respond(key, failedOutcome(error)),
  );
}

connectWebViewJavascriptBridge((bridge) => {
  /* This is only for the new IOS bridge */
  if (
    window.WebViewJavascriptBridge &&
    bridge === window.WebViewJavascriptBridge &&
    window.WebViewJavascriptBridge.send === undefined
  ) {
    bridge = {
      init: (function initClosure(internalBridge) {
        return function init(receiveCallBack) {
          internalBridge.registerHandler('message', (data) => {
            receiveCallBack(data);
          });
        };
      })(bridge),
      send: (function sendClosure(internalBridge) {
        return function send(message) {
          internalBridge.callHandler('message', message);
        };
      })(bridge),
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
    } catch (e) {
      console.error('PandaBridge: unable to handle bridge message', e);
    }
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

function stringifyMessage(event, args) {
  return JSON.stringify({ event, args });
}

function dispatch(stringified) {
  if (PandaBridge.bridge) {
    PandaBridge.bridge.send.call(PandaBridge.bridge, stringified);
  } else {
    PandaBridge.waitingSend.push(stringified);
  }
}

/* The key goes last, and alone when there is no payload, so it never becomes
 * one; a payload that is not an array stays at `args[0]`. */
function withResponseKey(args, key) {
  if (isArray(args)) {
    return args.length > 0 ? [...args, key] : [key];
  }
  return args == null ? [key] : [args, key];
}

/* With a callback, the message carries a response key and the callback receives
 * the outcome answered under it; without one, nothing changes. `event` is a
 * project event, not one of this library's own, whose receivers read their
 * arguments by position. There is no timeout: see the type declarations. */
PandaBridge.send = function send(event, args, callback) {
  /* `send(event, callback)` is the same call without a payload; unnormalized it
   * would serialize the callback away and send an unanswerable message. */
  let payload = args;
  let answer = callback;

  if (typeof payload === 'function' && answer === undefined) {
    answer = payload;
    payload = undefined;
  }

  if (typeof answer !== 'function') {
    try {
      dispatch(stringifyMessage(event, payload));
    } catch (e) {
      console.error('PandaBridge: unable to send event', event, e);
    }
    return;
  }

  const key = responseKey();

  try {
    const stringified = stringifyMessage(event, withResponseKey(payload, key));

    pendingResponses[key] = answer;
    dispatch(stringified);
  } catch (e) {
    console.error('PandaBridge: unable to send event', event, e);
    /* No key left waiting: a callback never waits for a message that never left */
    delete pendingResponses[key];
    Promise.resolve().then(() => answer(failedOutcome(e)));
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
    const localizedResource = resources.find(
      (r) => r.language === PandaBridge.currentLanguage,
    );

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

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
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

// Convert a URL (local path or blob URL) to a data URL
const urlToDataURL = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return blobToDataURL(blob);
  } catch (e) {
    return null;
  }
};

// Replace all blob: URLs and localhost URLs found inside a string with data URLs
const replaceUrlsInStringWithDataUrls = async (input) => {
  const hasBlobUrls = input.includes('blob:');
  const hasLocalhostUrls = input.includes('localhost');

  if (!hasBlobUrls && !hasLocalhostUrls) {
    return input;
  }

  // Match both blob: URLs and localhost URLs
  const urlRegex = /(blob:[^\s"'\)]+|http:\/\/localhost:\d+[^\s"'\)]*)/g;
  const matches = input.match(urlRegex);
  if (!matches) {
    return input;
  }
  const uniqueUrls = Array.from(new Set(matches));

  const urlToReplacementPairs = await Promise.all(
    uniqueUrls.map(async (url) => {
      const dataUrl = await urlToDataURL(url);
      return [url, dataUrl || url];
    }),
  );

  const replacements = {};
  urlToReplacementPairs.forEach(([k, v]) => {
    replacements[k] = v;
  });

  return input.replace(urlRegex, (m) => replacements[m] || m);
};

PandaBridge.resolveTypes = async function resolveTypes(value) {
  if (isArray(value)) {
    return Promise.all(map(value, (v) => this.resolveTypes(v)));
  }
  if (typeof value === 'string') {
    return replaceUrlsInStringWithDataUrls(value);
  }
  if (isObject(value)) {
    const { type, value: resourceValue } = value;

    if (type === 'Image' || type === 'Audio' || type === 'Video') {
      // convert local resources to data urls
      if (!startsWith(resourceValue, 'http')) {
        const dataUrl = await urlToDataURL(resourceValue);
        return {
          type,
          value: dataUrl,
        };
      }
      return value;
    }
    return fromPairs(
      await Promise.all(
        map(value, async (v, k) => [k, await this.resolveTypes(v)]),
      ),
    );
  }
  return value;
};

/* Generic async bridge method creator */
const createAsyncBridgeMethod = (eventName) => {
  return (...args) => {
    return new Promise((resolve) => {
      // Create a unique response event name
      const responseEvent = `${eventName}_response_${Date.now()}_${Math.random()}`;

      // Listen for the response
      const responseHandler = (responseArgs) => {
        // Clean up the listener
        PandaBridge.unlisten(responseEvent, responseHandler);
        // Resolve with the result
        resolve(responseArgs);
      };

      PandaBridge.listen(responseEvent, responseHandler);

      // Send the request with the response event name
      PandaBridge.send(eventName, [...args, responseEvent]);
    });
  };
};

/* Binder class */
const Binder = {};

Binder.resolveShortTags = createAsyncBridgeMethod(
  PandaBridge.RESOLVE_SHORT_TAGS,
);

Binder.resolveDeepShortTags = createAsyncBridgeMethod(
  PandaBridge.RESOLVE_DEEP_SHORT_TAGS,
);

// Attach Binder to PandaBridge for easy access
PandaBridge.Binder = Binder;

// Export both PandaBridge as default and Binder as named export (for ES modules)
export { Binder };
export default PandaBridge;
