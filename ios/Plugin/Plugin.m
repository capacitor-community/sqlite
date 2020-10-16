#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(CapacitorSQLite, "CapacitorSQLite",
            CAP_PLUGIN_METHOD(echo, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(open, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(close, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(execute, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(executeSet, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(run, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(query, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(isDBExists, CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(deleteDatabase,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(importFromJson,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(isJsonValid,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(exportToJson,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(createSyncTable,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(setSyncDate,CAPPluginReturnPromise);
            CAP_PLUGIN_METHOD(addUpgradeStatement,
                                            CAPPluginReturnPromise);
)
