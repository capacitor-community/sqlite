import { WebPlugin } from './index';
import { SharePlugin, ShareOptions } from '../core-plugin-definitions';
export declare class SharePluginWeb extends WebPlugin implements SharePlugin {
    constructor();
    share(options?: ShareOptions): Promise<void>;
}
declare const Share: SharePluginWeb;
export { Share };
