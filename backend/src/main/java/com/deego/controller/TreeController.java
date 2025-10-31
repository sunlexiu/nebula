package com.deego.controller;

import com.deego.common.ApiResponse;
import com.deego.service.TreeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tree")
public class TreeController {

    @Autowired
    private TreeService treeService;

    @PostMapping("/children")
    public ApiResponse<List<Map<String, Object>>> children(@RequestBody Map<String, Object> body) {
        String connId = String.valueOf(body.get("connectionId"));
        String nodeKey = body.get("nodeKey") == null ? null : String.valueOf(body.get("nodeKey"));
        List<Map<String, Object>> rs = treeService.loadChildren(connId, nodeKey);
        return ApiResponse.ok(rs);
    }
}
