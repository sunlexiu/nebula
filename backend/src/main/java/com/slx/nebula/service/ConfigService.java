package com.slx.nebula.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.yitter.idgen.YitIdHelper;
import com.slx.nebula.model.Group;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;


/**
 * @author sunlexiu
 */
@Service
public class ConfigService {
    private static final String CONFIG_FILE_PATH = System.getProperty("user.home") + "/.myapp/config.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Group> loadConfig() {
        try {
            File file = new File(CONFIG_FILE_PATH);
            if (file.exists()) {
                return objectMapper.readValue(file, objectMapper.getTypeFactory()
                        .constructCollectionType(List.class, Group.class));
            }
            return new ArrayList<>();
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public void saveConfig(List<Group> groups) {
        try {
            Files.createDirectories(Paths.get(System.getProperty("user.home") + "/.myapp"));
            objectMapper.writeValue(new File(CONFIG_FILE_PATH), groups);
        } catch (IOException e) {
            // Handle exception
        }
    }

    public void addGroup(Group group, String parentGroupId) {
        group.setId(YitIdHelper.nextId());
        List<Group> groups = loadConfig();
        if (parentGroupId == null || parentGroupId.isEmpty()) {
            groups.add(group);
        } else {
            addGroupToParent(groups, parentGroupId, group);
        }
        saveConfig(groups);
    }

    private void addGroupToParent(List<Group> groups, String parentId, Group group) {
        for (Group g : groups) {
            if (String.valueOf(g.getId()).equals(parentId)) {
                if (g.getSubGroups() == null) g.setSubGroups(new ArrayList<>());
                g.getSubGroups().add(group);
                return;
            }
            if (g.getSubGroups() != null) {
                addGroupToParent(g.getSubGroups(), parentId, group);
            }
        }
    }

    public void updateGroup(Group group) {
        List<Group> groups = loadConfig();
        updateGroupInList(groups, group);
        saveConfig(groups);
    }

    private void updateGroupInList(List<Group> groups, Group updatedGroup) {
        for (int i = 0; i < groups.size(); i++) {
            Group g = groups.get(i);
            if (g.getId() == updatedGroup.getId()) {
                groups.set(i, updatedGroup);
                return;
            }
            if (g.getSubGroups() != null) {
                updateGroupInList(g.getSubGroups(), updatedGroup);
            }
        }
    }

    public void deleteGroup(String groupId) {
        List<Group> groups = loadConfig();
        groups.removeIf(g -> String.valueOf(g.getId()).equals(groupId));
        removeGroupFromSubGroups(groups, groupId);
        saveConfig(groups);
    }

    private void removeGroupFromSubGroups(List<Group> groups, String groupId) {
        for (Group g : groups) {
            if (g.getSubGroups() != null) {
                g.getSubGroups().removeIf(sub -> String.valueOf(sub.getId()).equals(groupId));
                removeGroupFromSubGroups(g.getSubGroups(), groupId);
            }
        }
    }
}