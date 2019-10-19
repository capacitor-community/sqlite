import { WebPlugin } from './index';
import { BrowserPlugin, BrowserOpenOptions, BrowserPrefetchOptions } from '../core-plugin-definitions';
export declare class BrowserPluginWeb extends WebPlugin implements BrowserPlugin {
    _lastWindow: Window;
    constructor();
    open(options: BrowserOpenOptions): Promise<void>;
    prefetch(_options: BrowserPrefetchOptions): Promise<void>;
    close(): Promise<void>;
}
declare const Browser: BrowserPluginWeb;
export { Browser };
