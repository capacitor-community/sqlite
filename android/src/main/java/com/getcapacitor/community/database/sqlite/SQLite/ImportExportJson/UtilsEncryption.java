package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSecret;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;

public class UtilsEncryption {

    private static final int ITERATION_COUNT = 65536;
    private static final String PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA1";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";

    private static final String SALT = "jeep_capacitor_sqlite";

    public static String encryptJSONObject(Context context, JSONObject jsonObject) throws Exception {
        String jsonString = jsonObject.toString();

        if (!UtilsSecret.isPassphrase()) {
            throw new Exception("encryptJSONObject: No Passphrase stored");
        }
        String passphrase = UtilsSecret.getPassphrase();

        try {
            //     byte[] saltBytes = generateSalt();
            byte[] saltBytes = SALT.getBytes("UTF-8");
            // Derive a secure key from the passphrase using PBKDF2
            SecretKeyFactory factory = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM);
            PBEKeySpec keySpec = new PBEKeySpec(passphrase.toCharArray(), saltBytes, ITERATION_COUNT, 256);
            SecretKey secretKey = new SecretKeySpec(factory.generateSecret(keySpec).getEncoded(), "AES");

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            // Extract the IV from the saltBytes (first 12 bytes for GCM)
            GCMParameterSpec spec = new GCMParameterSpec(128, saltBytes, 0, 12);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] encryptedBytes = cipher.doFinal(jsonString.getBytes());

            // Concatenate salt and encrypted data for storage
            byte[] combined = new byte[saltBytes.length + encryptedBytes.length];
            System.arraycopy(saltBytes, 0, combined, 0, saltBytes.length);
            System.arraycopy(encryptedBytes, 0, combined, saltBytes.length, encryptedBytes.length);

            return Base64.encodeToString(combined, Base64.DEFAULT);
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("encryptJSONObject: " + e.getMessage());
        }
    }

    // Decrypts the JSONObject from the Base64 string
    public static JSObject decryptJSONObject(Context context, String encryptedBase64) throws Exception {
        if (!UtilsSecret.isPassphrase()) {
            throw new Exception("decryptJSONObject: No Passphrase stored");
        }
        String passphrase = UtilsSecret.getPassphrase();

        try {
            byte[] combined = Base64.decode(encryptedBase64, Base64.DEFAULT);

            //      byte[] saltBytes =  generateSalt();
            byte[] saltBytes = SALT.getBytes("UTF-8");

            byte[] encryptedBytes = new byte[combined.length - saltBytes.length];
            System.arraycopy(combined, 0, saltBytes, 0, saltBytes.length);
            System.arraycopy(combined, saltBytes.length, encryptedBytes, 0, encryptedBytes.length);

            // Derive a secure key from the passphrase using PBKDF2
            SecretKeyFactory factory = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM);
            PBEKeySpec keySpec = new PBEKeySpec(passphrase.toCharArray(), saltBytes, ITERATION_COUNT, 256);
            SecretKey secretKey = new SecretKeySpec(factory.generateSecret(keySpec).getEncoded(), "AES");

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);

            // Extract the IV from the saltBytes (first 12 bytes for GCM)
            GCMParameterSpec spec = new GCMParameterSpec(128, saltBytes, 0, 12);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new JSObject(new String(decryptedBytes, "UTF-8"));
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("decryptJSONObject: " + e.getMessage());
        }
    }

    // Other methods...

    private static byte[] generateSalt() {
        try {
            SecureRandom secureRandom = SecureRandom.getInstance("SHA1PRNG");
            byte[] salt = new byte[16]; // 16 bytes is recommended for AES
            secureRandom.nextBytes(salt);
            return salt;
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return null;
    }
}
