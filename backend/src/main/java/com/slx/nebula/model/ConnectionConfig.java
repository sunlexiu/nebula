package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonTypeName;
import lombok.Getter;
import lombok.Setter;

/**
 * 连接节点（叶子节点），继承自 ConfigItem
 */
@Setter
@Getter
@JsonTypeName("connection")
public class ConnectionConfig extends ConfigItem {
    // DB 相关字段
    private String dbType;
    private String host;
    private Integer port;
    private String database;
    private String username;
    private String password;
}
