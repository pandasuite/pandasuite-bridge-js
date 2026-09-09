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
    unlisten(): void;
    unlisten(callback: (event: string, args: any[]) => void): void;
    unlisten(event: string): void;
    unlisten(event: string, callback: (args: any[]) => void): void;
    onLoad(callback: (data: PandaData) => void): void;
    onUpdate(callback: (data: PandaData) => void): void;
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
