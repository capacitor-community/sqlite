package com.getcapacitor.community.database.sqlite;

import java.util.Map;

public class MyRunnable implements Runnable {

    private Map<String, Object> info;

    public Map<String, Object> getInfo() {
        return this.info;
    }

    public void setInfo(Map<String, Object> _info) {
        this.info = _info;
    }

    @Override
    public void run() {}

    public void run(Map<String, Object> info) {}
}
