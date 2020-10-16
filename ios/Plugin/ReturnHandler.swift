//
//  ReturnHandler.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 28/07/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation
import Capacitor

class ReturnHandler {
    // MARK: - rResult

    func rResult(call: CAPPluginCall, ret: Bool,
                 message: String? = nil) {
        if let intMessage = message {
            call.success([
                "result": ret,
                "message": intMessage
            ])
        } else {
            call.success([
                "result": ret
            ])
        }
    }

    // MARK: - rChanges

    func rChanges(call: CAPPluginCall, ret: [String: Int],
                  message: String? = nil) {
        if let intMessage = message {
            call.success([
                "changes": ret,
                "message": intMessage
            ])
        } else {
            call.success([
                "changes": ret
            ])
        }
    }

    // MARK: - rValues

    func rValues(call: CAPPluginCall, ret: [[String: Any]],
                 message: String? = nil) {
        if let intMessage = message {
            call.success([
                "values": ret,
                "message": intMessage
            ])
        } else {
            call.success([
                "values": ret
            ])
        }
    }

    // MARK: - rJsonSQLite

    func rJsonSQLite(call: CAPPluginCall, ret: [String: Any],
                     message: String? = nil) {
        if let intMessage = message {
            call.success([
                "export": ret,
                "message": intMessage
            ])
        } else {
            call.success([
                "export": ret
            ])
        }
    }
}
