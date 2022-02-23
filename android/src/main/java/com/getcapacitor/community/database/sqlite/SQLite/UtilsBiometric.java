package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.concurrent.Executor;

public class UtilsBiometric {

    private BiometricManager biometricManager;
    private Context context;
    private Executor executor;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private BiometricListener listener;

    public UtilsBiometric(Context context, BiometricManager biometricManager, BiometricListener listener) {
        this.context = context;
        this.biometricManager = biometricManager;
        this.listener = listener;
    }

    /**
     * This method checks if the device can support biometric authentication APIs
     */
    public boolean checkBiometricIsAvailable() {
        String input;
        Boolean ret = false;
        biometricManager = BiometricManager.from(this.context);
        switch (
            biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
        ) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                input = "App can authenticate using biometrics.";
                Log.d("MY_APP_TAG", input);
                Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                ret = true;
                break;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                input = "No biometric features available on this device.";
                Log.e("MY_APP_TAG", input);
                Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                break;
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                input = "App can authenticate using biometrics.";
                Log.e("MY_APP_TAG", "Biometric features are currently unavailable.");
                Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                break;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                input = "The user hasn't associated any biometric credentials with their account..";
                Log.e("MY_APP_TAG", input);
                Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                break;
        }
        return ret;
    }

    public void showBiometricDialog(String biometricTitle, String biometricSubTitle) throws Exception {
        // Initialize everything needed for authentication
        setupBiometricPrompt(biometricTitle, biometricSubTitle);
        try {
            biometricPrompt.authenticate(promptInfo);
            return;
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception(e);
        }
    }

    /**
     * This method setups the biometric authentication dialog
     */
    private void setupBiometricPrompt(String biometricTitle, String biometricSubTitle) {
        executor = ContextCompat.getMainExecutor(context);
        biometricPrompt =
            new BiometricPrompt(
                (FragmentActivity) context,
                executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        Toast.makeText(context, "Authentication error: " + errString, Toast.LENGTH_SHORT).show();
                        listener.onFailed();
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        listener.onSuccess(result);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                        Toast.makeText(context, "Authentication failed", Toast.LENGTH_SHORT).show();
                        listener.onFailed();
                    }
                }
            );

        // Create prompt dialog
        promptInfo =
            new BiometricPrompt.PromptInfo.Builder()
                .setTitle(biometricTitle)
                .setSubtitle(biometricSubTitle)
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL
                )
                .build();
    }
}
