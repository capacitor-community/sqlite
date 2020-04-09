import { WebPlugin } from './index';
import { ClipboardPlugin, ClipboardWrite, ClipboardReadResult } from '../core-plugin-definitions';
export declare class ClipboardPluginWeb extends WebPlugin implements ClipboardPlugin {
    constructor();
    write(options: ClipboardWrite): Promise<void>;
    read(): Promise<ClipboardReadResult>;
    private readText;
    private _getBlobData;
}
declare const Clipboard: ClipboardPluginWeb;
export { Clipboard };
