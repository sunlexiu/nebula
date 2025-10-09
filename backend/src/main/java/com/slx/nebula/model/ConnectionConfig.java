package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.slx.nebula.enums.DbTypeEnum;
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
    private DbTypeEnum dbType;
    private String host;
    private Integer port;
    private String database;
    private String username;
    private String password;
}
