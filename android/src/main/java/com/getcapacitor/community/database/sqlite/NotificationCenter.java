package com.getcapacitor.community.database.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class NotificationCenter {

    //static reference for singleton
    private static NotificationCenter _instance;

    private HashMap<String, ArrayList<MyRunnable>> registredObjects;

    //default c'tor for singleton
    private NotificationCenter() {
        registredObjects = new HashMap<String, ArrayList<MyRunnable>>();
    }

    //returning the reference
    public static synchronized NotificationCenter defaultCenter() {
        if (_instance == null) _instance = new NotificationCenter();
        return _instance;
    }

    public synchronized void addMethodForNotification(String notificationName, MyRunnable r) {
        ArrayList<MyRunnable> list = registredObjects.get(notificationName);
        if (list == null) {
            list = new ArrayList<MyRunnable>();
            registredObjects.put(notificationName, list);
        }
        list.add(r);
    }

    public synchronized void removeMethodForNotification(String notificationName, MyRunnable r) {
        ArrayList<MyRunnable> list = registredObjects.get(notificationName);
        if (list != null) {
            list.remove(r);
        }
    }

    public synchronized void removeAllNotifications() {
        for (Iterator<Map.Entry<String, ArrayList<MyRunnable>>> entry = registredObjects.entrySet().iterator(); entry.hasNext();) {
            Map.Entry<String, ArrayList<MyRunnable>> e = entry.next();
            String key = e.getKey();
            ArrayList<MyRunnable> value = e.getValue();
            removeMethodForNotification(key, value.get(0));
            entry.remove();
        }
    }

    public synchronized void postNotification(String notificationName, Map<String, Object> _info) {
        ArrayList<MyRunnable> list = registredObjects.get(notificationName);
        if (list != null) {
            for (MyRunnable r : new ArrayList<>(list)) {
                r.setInfo(_info);
                r.run();
            }
        }
    }
}
