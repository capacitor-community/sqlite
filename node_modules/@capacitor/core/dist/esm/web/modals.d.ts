import { WebPlugin } from './index';
import { ModalsPlugin, AlertOptions, PromptOptions, PromptResult, ConfirmOptions, ConfirmResult, ActionSheetOptions, ActionSheetResult } from '../core-plugin-definitions';
export declare class ModalsPluginWeb extends WebPlugin implements ModalsPlugin {
    constructor();
    alert(options: AlertOptions): Promise<void>;
    prompt(options: PromptOptions): Promise<PromptResult>;
    confirm(options: ConfirmOptions): Promise<ConfirmResult>;
    showActions(options: ActionSheetOptions): Promise<ActionSheetResult>;
}
declare const Modals: ModalsPluginWeb;
export { Modals };
