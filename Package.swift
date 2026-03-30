// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorCommunitySqlite",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorCommunitySqlite",
            targets: ["CapacitorSQLitePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "8.0.0"),
        .package(url: "https://github.com/sqlcipher/SQLCipher.swift.git", from: "4.14.0"),
        .package(url: "https://github.com/weichsel/ZIPFoundation.git", from: "0.9.0")
    ],
    targets: [
        .target(
            name: "CapacitorSQLitePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "SQLCipher", package: "SQLCipher.swift"),
                .product(name: "ZIPFoundation", package: "ZIPFoundation")
            ],
            path: "ios/Plugin"),
        .testTarget(
            name: "CapacitorSQLitePluginTests",
            dependencies: ["CapacitorSQLitePlugin"],
            path: "ios/PluginTests")
    ]
)
