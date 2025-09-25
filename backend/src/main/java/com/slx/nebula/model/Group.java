package com.slx.nebula.model;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * @author sunlexiu
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Group {
    private long id;
    private String name;
    private String description;
    private List<Connection> connections;
    private List<Group> subGroups;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Connection {
        private long id;
        private String name;
        private String host;
        private int port;
        private String username;
        private String password;
        private String database;
    }
}