import { __extends } from "tslib";
import { WebPlugin } from './index';
var StoragePluginWeb = /** @class */ (function (_super) {
    __extends(StoragePluginWeb, _super);
    function StoragePluginWeb() {
        var _this = _super.call(this, {
            name: 'Storage',
            platforms: ['web']
        }) || this;
        _this.KEY_PREFIX = '_cap_';
        return _this;
    }
    StoragePluginWeb.prototype.get = function (options) {
        var _this = this;
        return new Promise(function (resolve, _reject) {
            resolve({
                value: window.localStorage.getItem(_this.makeKey(options.key))
            });
        });
    };
    StoragePluginWeb.prototype.set = function (options) {
        var _this = this;
        return new Promise(function (resolve, _reject) {
            window.localStorage.setItem(_this.makeKey(options.key), options.value);
            resolve();
        });
    };
    StoragePluginWeb.prototype.remove = function (options) {
        var _this = this;
        return new Promise(function (resolve, _reject) {
            window.localStorage.removeItem(_this.makeKey(options.key));
            resolve();
        });
    };
    StoragePluginWeb.prototype.keys = function () {
        var _this = this;
        return new Promise(function (resolve, _reject) {
            resolve({
                keys: Object.keys(localStorage).filter(function (k) { return _this.isKey(k); }).map(function (k) { return _this.getKey(k); })
            });
        });
    };
    StoragePluginWeb.prototype.clear = function () {
        var _this = this;
        return new Promise(function (resolve, _reject) {
            Object.keys(localStorage)
                .filter(function (k) { return _this.isKey(k); })
                .forEach(function (k) { return window.localStorage.removeItem(k); });
            resolve();
        });
    };
    StoragePluginWeb.prototype.makeKey = function (key) {
        return this.KEY_PREFIX + key;
    };
    StoragePluginWeb.prototype.isKey = function (key) {
        return key.indexOf(this.KEY_PREFIX) === 0;
    };
    StoragePluginWeb.prototype.getKey = function (key) {
        return key.substr(this.KEY_PREFIX.length);
    };
    return StoragePluginWeb;
}(WebPlugin));
export { StoragePluginWeb };
var Storage = new StoragePluginWeb();
export { Storage };
//# sourceMappingURL=storage.js.map