//
//  Array.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 10/06/2023.
//
import Foundation

extension Array where Element == UInt8 {
    var data: Data {
        return Data(self)
    }
}
