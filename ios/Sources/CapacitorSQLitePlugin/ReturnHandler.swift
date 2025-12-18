//
//  ReturnHandler.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import Capacitor

class ReturnHandler {
    // MARK: - rResult

    func rResult(call: CAPPluginCall, ret: Bool? = nil,
                 message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            if let res = ret {
                call.resolve(["result": res])
                return

            } else {
                call.resolve()
                return
            }
        }
    }

    // MARK: - rChanges

    func rChanges(call: CAPPluginCall, ret: [String: Any],
                  message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["changes": ret])
            return
        }
    }

    // MARK: - rValues

    func rValues(call: CAPPluginCall, ret: [Any],
                 message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["values": ret])
            return
        }
    }

    // MARK: - rVersion

    func rVersion(call: CAPPluginCall, ret: NSNumber? = nil,
                  message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["version": ret as Any])
            return
        }
    }

    // MARK: - rJsonSQLite

    func rJsonSQLite(call: CAPPluginCall, ret: [String: Any],
                     message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["export": ret])
            return
        }
    }

    // MARK: - rSyncDate

    func rSyncDate(call: CAPPluginCall, ret: Int64,
                   message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["syncDate": ret])
            return
        }
    }

    // MARK: - rPath

    func rPath(call: CAPPluginCall, ret: String,
               message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["path": ret])
            return
        }
    }
    // MARK: - rUrl

    func rUrl(call: CAPPluginCall, ret: String,
              message: String? = nil) {
        if let intMessage = message {
            call.reject(intMessage)
            return
        } else {
            call.resolve(["url": ret])
            return
        }
    }
}
