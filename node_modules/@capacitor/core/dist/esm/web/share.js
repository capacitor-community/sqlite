import { __extends } from "tslib";
import { WebPlugin } from './index';
var SharePluginWeb = /** @class */ (function (_super) {
    __extends(SharePluginWeb, _super);
    function SharePluginWeb() {
        return _super.call(this, {
            name: 'Share',
            platforms: ['web']
        }) || this;
    }
    SharePluginWeb.prototype.share = function (options) {
        if (!navigator.share) {
            return Promise.reject('Web Share API not available');
        }
        return navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
        });
    };
    return SharePluginWeb;
}(WebPlugin));
export { SharePluginWeb };
var Share = new SharePluginWeb();
export { Share };
//# sourceMappingURL=share.js.map