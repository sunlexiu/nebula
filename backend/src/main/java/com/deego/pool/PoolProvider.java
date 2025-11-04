package com.deego.pool;

import com.deego.model.Connection;

public interface PoolProvider<T> {
    T create(Connection conn, String dbName);
    String cacheKey(Connection conn, String dbName);
    void close(T handle);
}