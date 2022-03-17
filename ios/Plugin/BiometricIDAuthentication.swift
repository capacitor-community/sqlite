//
//  BiometricIDAuthentication.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 21/02/2022.
//

import Foundation
import LocalAuthentication

enum BiometricIDAuthenticationError: Error {
    case biometricType(message: String)
}

enum BiometricType {
    case none
    case touchID
    case faceID
}

class BiometricIDAuthentication {
    var mBiometricTitle: String = ""

    var biometricTitle: String {
        get {
            return mBiometricTitle
        }
        set(newValue) {
            self.mBiometricTitle = newValue
        }
    }
    func biometricType() throws -> BiometricType {
        let context = LAContext()
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        switch context.biometryType {
        case .none:
            return .none
        case .touchID:
            return .touchID
        case .faceID:
            return .faceID
        @unknown default:
            let msg = "Biometric type not implemented"
            throw BiometricIDAuthenticationError.biometricType(message: msg)
        }
    }
    // swiftlint:disable no_space_in_method_call
    func authenticateUser(completion: @escaping (String?) -> Void) {
        let context = LAContext()
        context.touchIDAuthenticationAllowableReuseDuration = 10
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                               localizedReason: biometricTitle) {(success, evaluateError) in if success {
            DispatchQueue.main.async {
                // User authenticated successfully
                completion(nil)
            }
        } else {
            let message: String

            switch evaluateError {
            case LAError.authenticationFailed?:
                message = "There was a problem verifying your identity."
            case LAError.userCancel?:
                message = "You pressed cancel."
            case LAError.userFallback?:
                message = "You pressed password."
            case LAError.biometryNotAvailable?:
                message = "Face ID/Touch ID is not available."
            case LAError.biometryNotEnrolled?:
                message = "Face ID/Touch ID is not set up."
            case LAError.biometryLockout?:
                message = "Face ID/Touch ID is locked."
            default:
                message = "Face ID/Touch ID may not be configured"
            }
            completion(message)
        }
        }
    }
    // swiftlint:enable no_space_in_method_call

}
