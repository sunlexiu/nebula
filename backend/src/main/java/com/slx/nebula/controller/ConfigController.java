package com.slx.nebula.controller;

import com.slx.nebula.model.Group;
import com.slx.nebula.service.ConfigService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author sunlexiu
 */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public List<Group> getConfig() {
        return configService.loadConfig();
    }

    @PostMapping("/group")
    public void addGroup(@RequestBody Group group, @RequestParam(required = false) String parentGroupId) {
        configService.addGroup(group, parentGroupId);
    }

    @PutMapping("/group")
    public void updateGroup(@RequestBody Group group) {
        configService.updateGroup(group);
    }

    @DeleteMapping("/group/{groupId}")
    public void deleteGroup(@PathVariable String groupId) {
        configService.deleteGroup(groupId);
    }
}