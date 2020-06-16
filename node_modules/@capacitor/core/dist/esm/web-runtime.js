var CapacitorWeb = /** @class */ (function () {
    function CapacitorWeb() {
        var _this = this;
        this.platform = 'web';
        this.isNative = false;
        // Need to assign here to avoid having to define every plugin but still
        // get the typed benefits of the provided plugins in PluginRegistry
        this.Plugins = {};
        // Gracefully degrade in non-Proxy supporting engines, e.g. IE11. This
        // effectively means that trying to access an unavailable plugin will
        // locally throw, but this is still better than throwing a syntax error.
        if (typeof Proxy !== 'undefined') {
            // Build a proxy for the Plugins object that returns the "Noop Plugin"
            // if a plugin isn't available
            this.Plugins = new Proxy(this.Plugins, {
                get: function (target, prop) {
                    if (typeof target[prop] === 'undefined') {
                        var thisRef_1 = _this;
                        return new Proxy({}, {
                            get: function (_target, _prop) {
                                if (typeof _target[_prop] === 'undefined') {
                                    return thisRef_1.pluginMethodNoop.bind(thisRef_1, _target, _prop, prop);
                                }
                                else {
                                    return _target[_prop];
                                }
                            }
                        });
                    }
                    else {
                        return target[prop];
                    }
                }
            });
        }
    }
    CapacitorWeb.prototype.pluginMethodNoop = function (_target, _prop, pluginName) {
        return Promise.reject(pluginName + " does not have web implementation.");
    };
    CapacitorWeb.prototype.getPlatform = function () {
        return this.platform;
    };
    CapacitorWeb.prototype.isPluginAvailable = function (name) {
        return this.Plugins.hasOwnProperty(name);
    };
    CapacitorWeb.prototype.convertFileSrc = function (filePath) {
        return filePath;
    };
    CapacitorWeb.prototype.handleError = function (e) {
        console.error(e);
    };
    return CapacitorWeb;
}());
export { CapacitorWeb };
//# sourceMappingURL=web-runtime.js.map