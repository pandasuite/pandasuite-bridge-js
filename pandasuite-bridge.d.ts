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

    // Methods
    init(callBack: () => void): void;
    send(event: string, args: any): void;
    listen(callback: (event: string, args: any[]) => void): void;
    listen(event: string, callback: (args: any[]) => void): void;
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
