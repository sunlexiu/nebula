package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
public class Folder extends ConfigItem {
	public List<ConfigItem> children = new ArrayList<>();

	@Override
	@JsonProperty("type")
	public String getType() {
		return "folder";
	}
}