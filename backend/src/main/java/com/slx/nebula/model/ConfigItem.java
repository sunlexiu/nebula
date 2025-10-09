package com.slx.nebula.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 抽象节点基类 —— Folder 或 Connection 都继承自它。
 */
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = Folder.class, name = "folder"),
        @JsonSubTypes.Type(value = ConnectionConfig.class, name = "connection")
})
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public abstract class ConfigItem {
    protected String id;
    protected String name;
    protected String parentId;
}
