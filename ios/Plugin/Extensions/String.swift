//
//  String.swift
//  Capacitor
//
//  Created by  Quéau Jean Pierre on 20/04/2021.
//

import Foundation

extension String {
    public func indicesOf(string: String, fromIdx: Int? = 0) -> [Int] {
        var indices = [Int]()
        var searchStartIndex = self.startIndex
        if let fIdx = fromIdx {
            if fIdx != 0 {
                searchStartIndex = self.index(self.startIndex, offsetBy: fIdx)
            }
        }

        while searchStartIndex < self.endIndex,
              let range = self.range(of: string, options: .caseInsensitive, range: searchStartIndex..<self.endIndex),
              !range.isEmpty {
            let index = distance(from: self.startIndex, to: range.lowerBound)
            indices.append(index)
            searchStartIndex = range.upperBound
        }

        return indices
    }
    public func stringRange(fromIdx: Int, toIdx: Int) -> Substring {
        let startIndex = self.index(self.startIndex, offsetBy: fromIdx)
        let stopIndex = self.index(self.startIndex, offsetBy: toIdx)
        return self[startIndex..<stopIndex]
    }
    public func deletingPrefix(_ prefix: String) -> String {
        guard self.hasPrefix(prefix) else { return self }
        return String(self.dropFirst(prefix.count))
    }
    public func trimmingLeadingAndTrailingSpaces(using characterSet: CharacterSet = .whitespacesAndNewlines) -> String {
        return trimmingCharacters(in: characterSet)
    }
    /// Returns the string as an SQL string literal: in single quotes, with each single quote doubled.
    public func quotedAsSQLStringLiteral() -> String {
        // A literal search also finds a quote that is followed by a combining character.
        return "'\(replacingOccurrences(of: "'", with: "''", options: .literal))'"
    }

}
