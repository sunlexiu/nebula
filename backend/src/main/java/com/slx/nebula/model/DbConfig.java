package com.slx.nebula.model;

import com.slx.nebula.enums.DbTypeEnum;
import lombok.Builder;
import lombok.Data;

/**
 * 数据库配置类
 */
@Data
@Builder
public class DbConfig {
    private DbTypeEnum dbType;      // 数据库类型
    private String displayName;     // 显示名称
    private String driverClass;     // JDBC 驱动类
    private int port;               // 端口
    private String jdbcUrlTemplate; // JDBC URL 模板
    private String jdbcJarPath;     // JDBC jar 文件路径（可自定义上传）

    /**
     * 构建 JDBC URL
     */
    public String buildJdbcUrl(String host, int port, String database) {
        int usePort = (port <= 0) ? this.port : port;
        return String.format(this.jdbcUrlTemplate, host, usePort, database);
    }
}
