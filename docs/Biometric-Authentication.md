<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">BIOMETRIC AUTHENTICATION USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
<br>

## Only for Native Applications

This is the description on how to use the BIOMETRIC AUTHENTICATION to secure the secret of the @capacitor-community/sqlite.


```bash
npm i --save @capacitor-community/sqlite@latest
```

Modify the `capacitor-config.ts` file of your application

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'YOUR_APP_ID',
  appName: 'YOUR_APP_NAME',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    CapacitorSQLite: {
      iosKeychainPrefix: 'YOUR_APP_NAME',
      iosBiometric: {
        biometricAuth: true 
        biometricTitle : "Biometric login for capacitor sqlite",
      },
      androidBiometric: {
        biometricAuth : true,
        biometricTitle : "Biometric login for capacitor sqlite",
        biometricSubTitle : "Log in using your biometric"
      }
    }
  }
};

export default config;
```

