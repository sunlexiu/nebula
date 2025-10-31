package com.deego.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.LinkedHashMap;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DbConfig {
    @JsonProperty("defaultIcon")    private String defaultIcon;
    @JsonProperty("defaultActions") private Actions defaultActions;
    @JsonProperty("nodes")          private LinkedHashMap<String, NodeDef> nodes;
}
