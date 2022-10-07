package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.content.res.AssetManager;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class UtilsDownloadFromHTTP {

    private static final String TAG = UtilsDownloadFromHTTP.class.getName();
    private static final int BUFFER_SIZE = 4096;
    private final UtilsFile _uFile = new UtilsFile();

    public void download(Context context, String fileUrl) throws Exception {
        AssetManager assetManager = context.getAssets();
        String fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        String dbName = fileName;
        Boolean isZip = false;
        if (!fileName.contains("SQLite.db")) {
            if (_uFile.getFileExtension((fileName)).equals("db")) {
                dbName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
            }
            if (_uFile.isLast(fileName, ".zip")) {
                isZip = true;
            }
        }
        File cacheDir = context.getCacheDir();
        String cachePath = cacheDir.getAbsolutePath();
        String tmpFilePath = cachePath + File.separator + dbName;
        String databasePath = _uFile.getDatabaseDirectoryPath(context);
        File databaseDir = new File(databasePath);
        try {
            // delete file if exists in cache
            Boolean isExists = _uFile.isPathExists(tmpFilePath);
            if (isExists) {
                _uFile.deleteFile(cachePath, dbName);
            }
            downloadFileToCache(fileUrl, cachePath);
            if (isZip) {
                _uFile.unzipCopyDatabase(cachePath, null, tmpFilePath, true);
                // delete zip file from cache
                _uFile.deleteFile(cachePath, dbName);
            }
            // move files to database folder
            _uFile.moveAllDBs(cacheDir, databaseDir);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public static void downloadFileToCache(String fileURL, String cacheDir) throws Exception {
        HttpURLConnection httpConn = null;
        try {
            URL url = new URL(fileURL);
            httpConn = (HttpURLConnection) url.openConnection();
            int responseCode = httpConn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                String fileName = "";
                String disposition = httpConn.getHeaderField("Content-Disposition");
                //                String contentType = httpConn.getContentType();
                int contentLength = httpConn.getContentLength();

                if (disposition != null) {
                    // extracts file name from header field
                    int index = disposition.indexOf("filename=");
                    if (index > 0) {
                        fileName = disposition.substring(index + 10, disposition.length() - 1);
                    }
                } else {
                    // extracts file name from URL
                    fileName = fileURL.substring(fileURL.lastIndexOf("/") + 1);
                }
                String dbName = fileName;
                if (!fileName.contains("SQLite.db")) {
                    if (fileName.substring(fileName.length() - 3).equals(".db")) {
                        dbName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
                    }
                }

                //                System.out.println("Content-Type = " + contentType);
                //                System.out.println("Content-Disposition = " + disposition);
                //                System.out.println("Content-Length = " + contentLength);
                //                System.out.println("fileName = " + fileName);
                // opens input stream from the HTTP connection
                InputStream inputStream = httpConn.getInputStream();
                // create temporary file path
                String tmpFilePath = cacheDir + File.separator + dbName;
                // opens an output stream to save into file
                FileOutputStream outputStream = new FileOutputStream(tmpFilePath);
                int bytesRead = -1;
                byte[] buffer = new byte[BUFFER_SIZE];
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }

                outputStream.close();
                inputStream.close();

                System.out.println("File " + fileName + " downloaded (" + contentLength + ")");
            } else {
                String msg = "No file to download. Server replied HTTP code: " + responseCode;
                throw new IOException(msg);
            }
        } catch (IOException e) {
            throw new Exception(e);
        } finally {
            if (httpConn != null) {
                httpConn.disconnect();
            }
        }
    }
}
