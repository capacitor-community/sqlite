
  Pod::Spec.new do |s|
    s.name = 'CapacitorSqlite'
    s.version = '2.0.1-2'
    s.summary = 'Capacitor SQLite Plugin'
    s.license = 'MIT'
    s.homepage = 'https://github.com/jepiqueau/capacitor-sqlite.git'
    s.author = 'Jean Pierre Queau'
    s.source = { :git => 'https://github.com/jepiqueau/capacitor-sqlite.git', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
    s.dependency 'SQLCipher'
  end