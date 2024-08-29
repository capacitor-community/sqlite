package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UtilsDownloadFromHTTP {

    private static final String TAG = UtilsDownloadFromHTTP.class.getName();
    private static final int BUFFER_SIZE = 4096;
    private final UtilsFile _uFile = new UtilsFile();

    public void download(Context context, String fileUrl) throws Exception {
        Boolean isZip = false;
        String fileName = "";
        try {
            String[] fileDetails = getFileDetails(fileUrl);
            fileName = fileDetails[0];
            String extension = fileDetails[1];
            if (!fileName.contains("SQLite.db")) {
                switch (extension) {
                    case "db":
                        fileName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
                        break;
                    case "zip":
                        isZip = true;
                        break;
                    default:
                        throw new Exception("Unknown file type. Filename: " + fileName);
                }
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }

        File cacheDir = context.getCacheDir();
        String cachePath = cacheDir.getAbsolutePath();
        String tmpFilePath = cachePath + File.separator + fileName;
        String databasePath = _uFile.getDatabaseDirectoryPath(context);
        File databaseDir = new File(databasePath);
        try {
            // delete file if exists in cache
            Boolean isExists = _uFile.isPathExists(tmpFilePath);
            if (isExists) {
                _uFile.deleteFile(cachePath, fileName);
            }
            downloadFileToCache(fileUrl, fileName, cachePath);
            if (isZip) {
                _uFile.unzipCopyDatabase(cachePath, null, tmpFilePath, true);
                // delete zip file from cache
                _uFile.deleteFile(cachePath, fileName);
            }
            // move files to database folder
            _uFile.moveAllDBs(cacheDir, databaseDir);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public static String[] getFileDetails(String url) throws Exception {
        try {
            URL javaUrl = new URL(url);
            String path = javaUrl.getPath();
            String decodedPath = URLDecoder.decode(path, StandardCharsets.UTF_8.toString()); // Decode URL-encoded path
            String filename = decodedPath.substring(decodedPath.lastIndexOf('/') + 1); // Extract filename from decoded path
            String extension = getFileExtension(filename);
            if (extension == null) {
                throw new Exception("extension db or zip not found");
            }
            return new String[] { filename, extension };
        } catch (MalformedURLException e) {
            e.printStackTrace();
            throw new Exception(e.getMessage());
        }
    }

    public static String getFileExtension(String filename) {
        Pattern pattern = Pattern.compile("\\.([a-zA-Z0-9]+)(?:[\\?#]|$)");
        Matcher matcher = pattern.matcher(filename);

        if (matcher.find()) {
            return matcher.group(1).toLowerCase(); // returns the matched extension in lowercase
        }

        return null; // no extension found
    }

    public static void downloadFileToCache(String fileURL, String fileName, String cacheDir) throws Exception {
        HttpURLConnection httpConn = null;
        try {
            URL url = new URL(fileURL);
            httpConn = (HttpURLConnection) url.openConnection();
            httpConn.setRequestMethod("GET");
            int responseCode = httpConn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                int contentLength = httpConn.getContentLength();
                String dbName = fileName;
                if (!fileName.contains("SQLite.db")) {
                    if (fileName.substring(fileName.length() - 3).equals(".db")) {
                        dbName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
                    }
                }

                // create temporary file path
                String tmpFilePath = cacheDir + File.separator + dbName;
                // opens input stream from the HTTP connection
                try (
                    InputStream inputStream = httpConn.getInputStream();
                    FileOutputStream outputStream = new FileOutputStream(tmpFilePath)
                ) {
                    byte[] buffer = new byte[1024];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.close();
                    inputStream.close();

                    System.out.println("File " + fileName + " downloaded (" + contentLength + ")");
                }
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
