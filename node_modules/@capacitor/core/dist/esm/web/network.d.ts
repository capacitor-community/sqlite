import { WebPlugin } from './index';
import { NetworkPlugin, NetworkStatus } from '../core-plugin-definitions';
export interface PluginListenerHandle {
    remove: () => void;
}
export declare class NetworkPluginWeb extends WebPlugin implements NetworkPlugin {
    listenerFunction: any;
    constructor();
    getStatus(): Promise<NetworkStatus>;
    addListener(eventName: 'networkStatusChange', listenerFunc: (status: NetworkStatus) => void): PluginListenerHandle;
}
declare const Network: NetworkPluginWeb;
export { Network };
