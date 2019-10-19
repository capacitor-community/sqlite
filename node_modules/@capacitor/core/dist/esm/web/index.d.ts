import { PluginListenerHandle, PermissionsRequestResult } from '../definitions';
export declare class WebPluginRegistry {
    plugins: {
        [name: string]: WebPlugin;
    };
    loadedPlugins: {
        [name: string]: WebPlugin;
    };
    constructor();
    addPlugin(plugin: WebPlugin): void;
    getPlugin(name: string): WebPlugin;
    loadPlugin(name: string): void;
    getPlugins(): WebPlugin[];
}
declare let WebPlugins: WebPluginRegistry;
export { WebPlugins };
export declare type ListenerCallback = (err: any, ...args: any[]) => void;
export interface WindowListenerHandle {
    registered: boolean;
    windowEventName: string;
    pluginEventName: string;
    handler: (event: any) => void;
}
export interface WebPluginConfig {
    /**
     * The name of the plugin
     */
    name: string;
    /**
     * The platforms this web plugin should run on. Leave null
     * for this plugin to always run.
     */
    platforms?: string[];
}
export declare class WebPlugin {
    config: WebPluginConfig;
    loaded: boolean;
    listeners: {
        [eventName: string]: ListenerCallback[];
    };
    windowListeners: {
        [eventName: string]: WindowListenerHandle;
    };
    constructor(config: WebPluginConfig, pluginRegistry?: WebPluginRegistry);
    private addWindowListener;
    private removeWindowListener;
    addListener(eventName: string, listenerFunc: ListenerCallback): PluginListenerHandle;
    private removeListener;
    notifyListeners(eventName: string, data: any): void;
    hasListeners(eventName: string): boolean;
    registerWindowListener(windowEventName: string, pluginEventName: string): void;
    requestPermissions(): Promise<PermissionsRequestResult>;
    load(): void;
}
/**
 * For all our known web plugins, merge them into the global plugins
 * registry if they aren't already existing. If they don't exist, that
 * means there's no existing native implementation for it.
 * @param knownPlugins the Capacitor.Plugins global registry.
 */
export declare const mergeWebPlugins: (knownPlugins: any) => void;
export declare const mergeWebPlugin: (knownPlugins: any, plugin: WebPlugin) => void;
