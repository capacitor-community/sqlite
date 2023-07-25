import type { JsonSQLite } from '../../../../src/definitions';
import { UtilsSecret } from '../utilsSecret';

export class UtilsJsonEncryption {
  public Crypto: any;
  public CryptoJS: any;
  private fileSecret: UtilsSecret = new UtilsSecret();
  private SALT = 'jeep_capacitor_sqlite';

  constructor() {
    this.Crypto = require('crypto');
    this.CryptoJS = require('crypto-js');
  }

  /**
   * deriveKeyFromPassphrase
   * Function to derive a symmetric key from passphrase and salt using PBKDF2
   * @param passphrase
   * @param salt
   * @returns
   */
  public deriveKeyFromPassphrase(passphrase: string, salt: string): string {
    const iterations = 10000; // Recommended number of iterations for PBKDF2
    const keyLength = 32;
    const key = this.Crypto.pbkdf2Sync(
      passphrase,
      salt,
      iterations,
      keyLength,
      'sha256',
    );
    const keyHex = Buffer.from(key).toString('hex');
    return keyHex;
  }

  /**
   * encryptJSONObject
   * Function to encrypt JSON object with AES and return as Base64
   * @param jsonObj
   * @returns
   */
  public encryptJSONObject(jsonObj: JsonSQLite): string {
    const jsonString = JSON.stringify(jsonObj);
    // get the passphrase
    const passphrase = this.fileSecret.getPassphrase();
    // derived a combined key from passphrase and salt
    const key = this.deriveKeyFromPassphrase(passphrase, this.SALT);
    const encrypted = this.CryptoJS.AES.encrypt(jsonString, key).toString();
    const encryptedBase64 = Buffer.from(encrypted).toString('base64');
    return encryptedBase64;
  }

  /**
   * decryptJSONObject
   * Function to decrypt AES encrypted JSON object from Base64
   * @param encryptedBase64
   * @returns
   */
  public decryptJSONObject(encryptedBase64: string): JsonSQLite {
    const encryptedData = Buffer.from(encryptedBase64, 'base64').toString();
    // get the passphrase
    const passphrase = this.fileSecret.getPassphrase();
    // derived a combined key from passphrase and salt
    const key = this.deriveKeyFromPassphrase(passphrase, this.SALT);
    const bytes = this.CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = bytes.toString(this.CryptoJS.enc.Utf8);
    const decryptedObj: JsonSQLite = JSON.parse(decryptedString);
    return decryptedObj;
  }
}
