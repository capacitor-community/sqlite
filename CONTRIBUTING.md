# Contributing

This guide provides instructions for contributing to this Capacitor plugin.

## Developing

### Local Setup

1. Fork and clone the repo.
2. Install the dependencies.

   ```shell
   npm install
   ```

3. Install SwiftLint if you're on macOS.

   ```shell
   brew install swiftlint
   ```

4. On macOS, the iOS side is a Swift package. Open `Package.swift` in Xcode to work on it. There is no CocoaPods workspace to generate first.

   ```shell
   xed .
   ```

### Scripts

#### `npm run build`

Build the plugin web assets and generate plugin API documentation using [`@capacitor/docgen`](https://github.com/ionic-team/capacitor-docgen).

It will compile the TypeScript code from `src/` into ESM JavaScript in `dist/esm/`. These files are used in apps with bundlers when your plugin is imported.

Then, Rollup will bundle the code into a single file at `dist/plugin.js`. This file is used in apps without bundlers by including it as a script in `index.html`.

#### `npm run verify`

Build and validate the web and native projects.

This is useful to run in CI to verify that the plugin builds for all platforms.

On iOS this is two gates, both of which also run in CI:

- `npm run verify:ios` builds the Swift package, library and test target, for an iOS Simulator destination. This is the maintained iOS path.
- `npm run verify:ios:pod` runs `pod lib lint` against `CapacitorCommunitySqlite.podspec`, which is the CocoaPods compatibility path kept for existing consumers. See the iOS section of the README for why that path is frozen.

The iOS unit tests are built by `verify:ios` but not run by it, because running them needs a named simulator rather than a generic destination. To run them locally, pick one that exists on your machine:

```shell
xcodebuild test -scheme CapacitorCommunitySqlite -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

#### `npm run lint` / `npm run fmt`

Check formatting and code quality, autoformat/autofix if possible.

This template is integrated with ESLint, Prettier, and SwiftLint. Using these tools is completely optional, but the [Capacitor Community](https://github.com/capacitor-community/) strives to have consistent code style and structure for easier cooperation.

## Publishing

There is a `prepublishOnly` hook in `package.json` which prepares the plugin before publishing, so all you need to do is run:

```shell
npm publish
```

> **Note**: The [`files`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files) array in `package.json` specifies which files get published. If you rename files/directories or add files elsewhere, you may need to update it.
