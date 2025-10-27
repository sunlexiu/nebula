package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.slx.nebula.enums.DbTypeEnum;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ConnectionConfig extends ConfigItem {
	public DbTypeEnum dbType;
	public String host;
	public int port;
	public String database;
	public String username;
	public String password;

	@Override
	@JsonProperty("type")
	public String getType() {
		return "connection";
	}
}