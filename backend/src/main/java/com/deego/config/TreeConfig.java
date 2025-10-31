package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TreeConfig {
    @JsonProperty("treeConfigs") private Map<String, DbConfig> treeConfigs;
}
