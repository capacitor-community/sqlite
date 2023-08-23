<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Minified builds on Android</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>

You may want to enable minification for your Android production builds. This is possible by default in Capacitor, but requires some modifications to work with SQLite.

In general, you can enable minification for your release build type by modifying your gradle file.

```gradle
android {
  // …
  buildTypes {
    release {
      minifyEnabled true // <- enable it here
      shrinkResources true // <- optional
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 
      'proguard-rules.pro' // <- configuration file
    }
  }
}
```

Now you need to modify the proguard configuration file. You will find your proguard file here: `android/app/proguard-rules.pro`. This will configure how Gradle compiles your application. Proguard files act like a CLI append, you just put flags in there.

```pro
-keep class net.sqlcipher.** { *; }
-keepclassmembers class net.sqlcipher.** { *; }
```

This will exclude minification of all SQLCipher classes and class-members so Capacitor Community SQLite does not error on minified function names.

Read more about that topic here:

- https://github.com/ionic-team/capacitor/issues/739
- https://capacitorjs.com/docs/android/troubleshooting#using-proguard
- https://medium.com/@jonfinerty/beginner-to-proguard-b3327ff3a831