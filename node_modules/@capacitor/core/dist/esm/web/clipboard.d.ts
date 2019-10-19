import { WebPlugin } from './index';
import { ClipboardPlugin, ClipboardWrite, ClipboardRead, ClipboardReadResult } from '../core-plugin-definitions';
export declare class ClipboardPluginWeb extends WebPlugin implements ClipboardPlugin {
    constructor();
    write(options: ClipboardWrite): Promise<void>;
    read(_options: ClipboardRead): Promise<ClipboardReadResult>;
}
declare const Clipboard: ClipboardPluginWeb;
export { Clipboard };
