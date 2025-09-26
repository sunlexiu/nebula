package com.slx.nebula.model;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ConnectionConfig {
    private String id;
    private String name;
    private String type;
    private String host;
    private Integer port;
    private String database;
    private String username;
    private String password;
    private String folderId;
}
