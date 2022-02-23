package com.getcapacitor.community.database.sqlite.SQLite;

public class SqliteConfig {

    private boolean biometricAuth = false;
    private String biometricTitle = "Biometric login for capacitor sqlite";
    private String biometricSubTitle = "Log in using your biometric";

    public boolean getBiometricAuth() {
        return biometricAuth;
    }

    public void setBiometricAuth(boolean biometricAuth) {
        this.biometricAuth = biometricAuth;
    }

    public String getBiometricTitle() {
        return biometricTitle;
    }

    public void setBiometricTitle(String biometricTitle) {
        this.biometricTitle = biometricTitle;
    }

    public String getBiometricSubTitle() {
        return biometricSubTitle;
    }

    public void setBiometricSubTitle(String biometricSubTitle) {
        this.biometricSubTitle = biometricSubTitle;
    }
}
