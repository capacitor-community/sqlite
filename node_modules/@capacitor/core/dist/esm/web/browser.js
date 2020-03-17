import { __awaiter, __extends, __generator } from "tslib";
import { WebPlugin } from './index';
var BrowserPluginWeb = /** @class */ (function (_super) {
    __extends(BrowserPluginWeb, _super);
    function BrowserPluginWeb() {
        return _super.call(this, {
            name: 'Browser',
            platforms: ['web']
        }) || this;
    }
    BrowserPluginWeb.prototype.open = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._lastWindow = window.open(options.url, options.windowName || '_blank');
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    BrowserPluginWeb.prototype.prefetch = function (_options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Does nothing
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    BrowserPluginWeb.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._lastWindow && this._lastWindow.close();
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    return BrowserPluginWeb;
}(WebPlugin));
export { BrowserPluginWeb };
var Browser = new BrowserPluginWeb();
export { Browser };
//# sourceMappingURL=browser.js.map