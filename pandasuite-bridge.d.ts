declare module 'pandasuite-bridge' {
  export interface Resource {
    id: string;
    path?: string;
    srcsets?: { [size: string]: string };
    language?: string;
    local?: boolean;
    data?: any;
  }

  export interface PandaData {
    properties: { [key: string]: any };
    markers: any[];
    resources: Resource[];
  }

  export interface SnapshotData {
    data: any;
    params: any;
  }

  /**
   * The answer to a correlated call: a value, a value-less acknowledgement, or a
   * failure whose `error` is always a readable string.
   */
  export type ActionOutcome =
    { status: 'ok'; value?: any } | { status: 'failed'; error: string };

  /** The Studio's colour theme. */
  export type StudioTheme = 'light' | 'dark';

  export interface PandaBridgeType {
    // Properties
    initCallBack: (() => void) | null;
    loadCallBack: ((data: PandaData) => void) | null;
    updateCallBack: ((data: PandaData) => void) | null;
    globalReceive: Array<(event: string, args: any[]) => void>;
    eventReceive: { [key: string]: Array<(args: any[]) => void> };
    waitingSend: string[];
    bridge: any;
    isStudio: boolean;
    resources: Resource[];
    properties: { [key: string]: any };
    markers: any[];
    isCoreInitialized: boolean;
    currentLanguage?: string;
    /**
     * The theme of the Studio, sent to the editor of a system component:
     * `undefined` until the Studio sends one, then `'light'` or `'dark'`. The
     * Studio sends it when the editor loads and on every change; any other value
     * is ignored. Nothing is inferred from the OS preference and nothing is
     * stored. It stays `undefined` outside the Studio, in a published app, and on
     * the native iOS and Android bridges.
     */
    theme?: StudioTheme;

    // Constants
    INITIALIZE: string;
    UPDATE: string;
    SYNCHRONIZE: string;
    TRIGGER_MARKER: string;
    INITIALIZED: string;
    UPDATED: string;
    RESOLVE_SHORT_TAGS: string;
    RESOLVE_DEEP_SHORT_TAGS: string;
    STUDIO: string;
    LANGUAGE: string;
    /** The event the Studio sends its theme with: `{ theme: StudioTheme }`. */
    THEME: string;
    UNIQUE_ID: string;
    BINDABLE: string;
    SCREENS: string;
    GET_SNAPSHOT_DATA: string;
    SET_SNAPSHOT_DATA: string;
    SNAPSHOT_DATA_RESULT: string;
    OPEN_URL: string;
    GET_SCREENSHOT: string;
    SCREENSHOT_RESULT: string;
    PANDASUITE_HOST_WITH_SCHEME: string;
    PANDASUITE_DATA_HOST_WITH_SCHEME: string;
    APP_STATE: string;
    RESPONSE_EVENT_PREFIX: string;

    // Methods
    init(callBack: () => void): void;
    /**
     * Call an event of the project and wait for its answer, with no payload —
     * the same as `send(event, undefined, callback)`.
     */
    send(event: string, callback: (outcome: ActionOutcome) => void): void;
    send(event: string, args: any): void;
    /**
     * Call an event of the project, by its own name, and wait for its answer.
     * The library mints a response key, passes it as the last argument of the
     * message, and hands the outcome to `callback`.
     *
     * `event` is a project event — not one of this library's own protocol events
     * (`TRIGGER_MARKER`, `SYNCHRONIZE`, `UPDATED`, `RESOLVE_SHORT_TAGS`…), whose
     * receivers read their arguments by position.
     *
     * No capability flag and no timeout: a callback that never fires means a
     * runtime older than the protocol, an editing canvas that does not implement
     * it, or an event name the project does not carry.
     */
    send(
      event: string,
      args: any,
      callback: (outcome: ActionOutcome) => void,
    ): void;
    listen(callback: (event: string, args: any[]) => void): void;
    /**
     * Listen to an event. When the runtime calls an action whose result it
     * needs, the value the FIRST listener of that event returns — a value or a
     * promise — is sent back as the action's result; returning nothing
     * acknowledges without a value, and throwing or rejecting fails it. Later
     * listeners of the same event, and global listeners, only observe.
     */
    listen(event: string, callback: (args: any[]) => any): void;
    /**
     * With no argument, removes every listener, the bridge's own included:
     * those of `__ps_initialize` and `__ps_update`, which feed `onLoad` and
     * `onUpdate`, of `__ps_studio`, `__ps_language` and `__ps_theme`, and those
     * of pending `Binder` calls.
     */
    unlisten(): void;
    unlisten(callback: (event: string, args: any[]) => void): void;
    unlisten(event: string): void;
    unlisten(event: string, callback: (args: any[]) => void): void;
    onLoad(callback: (data: PandaData) => void): void;
    onUpdate(callback: (data: PandaData) => void): void;
    /**
     * Follow the theme of the Studio, for what the document cannot do alone (a
     * JS widget such as a JSON viewer or a map). `callback` is called at once if
     * a theme is already known, then each time the value changes, never twice
     * with the same one. Returns a function that unsubscribes.
     *
     * It does not touch the document: see `followStudioTheme()` for that.
     */
    onThemeChange(callback: (theme: StudioTheme) => void): () => void;
    /**
     * The opt-in of a component whose editor supports dark. From this call on,
     * each theme of the Studio is applied to `<html>`: the `dark` class is
     * toggled and `style.colorScheme` is set to the theme. Before any theme, and
     * outside the Studio, it does nothing; calling it twice is harmless. A
     * component that never calls it keeps its document untouched.
     *
     * A Tailwind 2 editor also lists the bridge's theme plugin after the forms
     * plugin, which turns its light markup dark under `html.dark` and leaves
     * light rendering as it was:
     * `plugins: [require('@tailwindcss/forms')({strategy: 'class'}), require('pandasuite-bridge/studio-theme')]`.
     * Tailwind 2 only for now. Forms must use `strategy: 'class'`: under its
     * default `base` strategy a bare `select` loses its caret, in light too.
     * The light values are Tailwind's default shades, not the config's: a
     * config that replaces a themed family (gray, red, yellow, green, blue,
     * indigo, purple) gets Tailwind's defaults in light, and a themed shade it
     * extends keeps its own value in dark.
     *
     * An editor following the Studio theme must not call `takeScreenshot()`:
     * system units have no project rendering, and a themed capture would be saved
     * as a thumbnail.
     */
    followStudioTheme(): void;
    getSnapshotData(callback: (args: any[]) => any): void;
    setSnapshotData(callback: (data: SnapshotData) => void): void;
    getScreenshot(
      callback: (resultCallback: (result: any) => void, args: any) => void,
    ): void;
    takeScreenshot(): void;
    openUrl(url: string): void;
    synchronize(callback: (args: any) => void): void;
    synchronize(name: string, callback: (args: any) => void): void;
    resolveResource(id: string): Resource | undefined;
    resolvePath(id: string, def?: any): any;
    resolveImagePath(id: string, size: string, def?: any): any;
    resolveTypes(value: any): Promise<any>;
  }

  export interface BinderType {
    resolveShortTags(
      expression: any,
      strictMode: boolean,
      context: any,
    ): Promise<any>;
    resolveDeepShortTags(
      value: any,
      strictMode: boolean,
      context: any,
    ): Promise<any>;
  }

  const PandaBridge: PandaBridgeType;
  export const Binder: BinderType;
  export default PandaBridge;
}
