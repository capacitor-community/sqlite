//
//  Notification.Name.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 23/04/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//
import Foundation
extension NSNotification.Name {
    static var importJsonProgress: Notification.Name {
        return .init(rawValue: "importJsonProgress")}
    static var exportJsonProgress: Notification.Name {
        return .init(rawValue: "exportJsonProgress")}
    static var biometricEvent: Notification.Name {
        return .init(rawValue: "biometricEvent")}
}
