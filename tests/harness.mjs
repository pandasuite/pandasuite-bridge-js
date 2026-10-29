/* The library is a singleton that connects at import time, so the harness stubs
 * the globals it reads and drives the real web connection path. Nothing inside
 * the library is mocked. */

const messageListeners = [];

/* Outgoing messages, parsed, in order */
export const sent = [];

/* Makes the bridge refuse the next message, the way a native one can throw where
 * `postMessage` does not. One-shot, and it keeps what it refused: that is the
 * only place a test can read the key minted for it. */
let refuseToSend = null;

export const refused = [];

export const refuseSending = (error) => {
  refuseToSend = error;
};

globalThis.window = {
  addEventListener(type, listener) {
    if (type === 'message') {
      messageListeners.push(listener);
    }
  },
  removeEventListener() {},
  top: {},
  parent: {
    postMessage(message) {
      if (refuseToSend) {
        const error = refuseToSend;

        refuseToSend = null;
        refused.push(JSON.parse(message));
        throw error;
      }
      sent.push(JSON.parse(message));
    },
  },
  /* The arm key minting takes in production; a test removes it for the other */
  crypto: globalThis.crypto,
  /* A dark OS, so a theme read from it instead of the Studio would show */
  matchMedia: (query) => ({
    media: query,
    matches: query === '(prefers-color-scheme: dark)',
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }),
};

/* `navigator` is a getter-only global on Node */
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node', platform: 'node', maxTouchPoints: 0 },
  configurable: true,
});

/* What a theme test reads back from `<html>`: its classes and inline style */
const rootClasses = new Set();

globalThis.document = {
  addEventListener() {},
  createElement: () => ({ style: {} }),
  documentElement: {
    appendChild() {},
    removeChild() {},
    classList: {
      toggle(name, force) {
        if (force === undefined ? !rootClasses.has(name) : force) {
          rootClasses.add(name);
        } else {
          rootClasses.delete(name);
        }
        return rootClasses.has(name);
      },
      contains: (name) => rootClasses.has(name),
    },
    style: { colorScheme: '' },
  },
};

const post = (data) => {
  messageListeners.slice().forEach((listener) => listener({ data }));
};

const module = await import('../src/index.js');

export const PandaBridge = module.default;

/* Connect once: the handshake is what hands the library its bridge */
post('PandaJavascriptBridgeReady');

/* The theme state once imported and connected, before any reset rewrites it */
export const themeAtImport = {
  theme: PandaBridge.theme,
  subscribers: PandaBridge.themeReceive.length,
  isFollowingStudioTheme: PandaBridge.isFollowingStudioTheme,
  rootClasses: [...rootClasses],
  colorScheme: document.documentElement.style.colorScheme,
};

/* Deliver an incoming message, the shape `bridge.init` parses */
export const receive = (event, args) => post(JSON.stringify({ event, args }));

/* The library registers listeners for itself and nothing re-registers them, so a
 * reset restores that bootstrap state instead of calling `unlisten()`. */
const copyListeners = (table) =>
  Object.fromEntries(
    Object.entries(table).map(([event, listeners]) => [
      event,
      listeners.slice(),
    ]),
  );

const bootstrap = {
  globalReceive: PandaBridge.globalReceive.slice(),
  eventReceive: copyListeners(PandaBridge.eventReceive),
};

/* Keys awaiting an answer live in a private registry no reset reaches, so give a
 * producer test a literal key, never one a caller could have minted. */
export const reset = () => {
  PandaBridge.globalReceive = bootstrap.globalReceive.slice();
  PandaBridge.eventReceive = copyListeners(bootstrap.eventReceive);
  sent.length = 0;
  refused.length = 0;
  refuseToSend = null;
  window.crypto = globalThis.crypto;
  PandaBridge.theme = undefined;
  PandaBridge.themeReceive = [];
  PandaBridge.isFollowingStudioTheme = false;
  rootClasses.clear();
  document.documentElement.style.colorScheme = '';
};

/* The outcome of the last message sent */
export const lastOutcome = () => sent[sent.length - 1].args[0];

/* Spelled out: the tests check the wire as the other end sees it */
export const PREFIX = '__ps_response_';

/* Messages sent under a response key */
export const responses = () =>
  sent.filter((message) => message.event.startsWith(PREFIX));

/* A thenable that is not a promise */
export const foreignThenable = (then) => ({ then });

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
