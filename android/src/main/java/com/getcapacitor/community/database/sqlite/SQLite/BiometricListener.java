package com.getcapacitor.community.database.sqlite.SQLite;

import androidx.biometric.BiometricPrompt;

public interface BiometricListener {
    void onSuccess(BiometricPrompt.AuthenticationResult result);
    void onFailed();
}
