//
//  Blob.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 24/01/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

public struct Blob {

    public let bytes: [UInt8]

    public init(bytes: [UInt8]) {
        self.bytes = bytes
    }

    public init(bytes: UnsafeRawPointer, length: Int) {
        let i8bufptr = UnsafeBufferPointer(start: bytes.assumingMemoryBound(to: UInt8.self), count: length)
        self.init(bytes: [UInt8](i8bufptr))
    }

    public func toHex() -> String {
        return bytes.map {
            ($0 < 16 ? "0" : "") + String($0, radix: 16, uppercase: false)
        }.joined(separator: "")
    }

}

extension Blob : CustomStringConvertible {

    public var description: String {
        return "x'\(toHex())'"
    }

}

public func ==(lhs: Blob, rhs: Blob) -> Bool {
    return lhs.bytes == rhs.bytes
}
