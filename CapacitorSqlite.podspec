
  Pod::Spec.new do |s|
    s.name = 'CapacitorSqlite'
    s.version = '0.0.1-alpha.13'
    s.summary = 'Capacitor SQLite Plugin'
    s.license = 'MIT'
    s.homepage = 'https://github.com/jepiqueau/capacitor-sqlite'
    s.author = 'Jean Pierre Queau'
    s.source = { :git => 'https://github.com/jepiqueau/capacitor-sqlite', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
    s.dependency 'SQLite.swift'
  end