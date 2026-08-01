// SwiftLint configuration, read by node-swiftlint.
//
// This is @ionic/swiftlint-config plus one exclusion. Swift Package Manager checks its
// dependencies out into `.build`, and linting those reports violations from third-party
// sources that have nothing to do with this repository.
const ionicSwiftlintConfig = require('@ionic/swiftlint-config');

module.exports = {
  ...ionicSwiftlintConfig,
  excluded: [...ionicSwiftlintConfig.excluded, '${PWD}/.build'],
};
