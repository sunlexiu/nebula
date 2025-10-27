package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type", visible = true)
@JsonSubTypes({@JsonSubTypes.Type(value = Folder.class, name = "folder"), @JsonSubTypes.Type(value = ConnectionConfig.class, name = "connection")})
@Setter
@Getter
public abstract class ConfigItem {
	public String id;
	public String name;
	public String parentId;

	public abstract String getType();

	@JsonProperty("type")
	public void setType(String ignored) { }
}