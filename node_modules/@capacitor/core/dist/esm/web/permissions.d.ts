import { WebPlugin } from './index';
import { PermissionsPlugin, PermissionsOptions, PermissionResult } from '../core-plugin-definitions';
export declare class PermissionsPluginWeb extends WebPlugin implements PermissionsPlugin {
    constructor();
    query(options: PermissionsOptions): Promise<PermissionResult>;
}
declare const Permissions: PermissionsPluginWeb;
export { Permissions };
