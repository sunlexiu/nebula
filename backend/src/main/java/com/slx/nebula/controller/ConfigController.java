package com.slx.nebula.controller;

import com.slx.nebula.common.ApiResponse;
import com.slx.nebula.common.ErrorCode;
import com.slx.nebula.connection.DatabaseProviderRegistry;
import com.slx.nebula.exception.BizException;
import com.slx.nebula.model.ConfigItem;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;
import com.slx.nebula.model.MoveNodeReq;
import com.slx.nebula.repository.ConfigRepository;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/config")
public class ConfigController {

    private final ConfigRepository repo;
    private final DatabaseProviderRegistry registry;

    public ConfigController(ConfigRepository repo, DatabaseProviderRegistry registry) {
        this.repo = repo;
        this.registry = registry;
    }

    @PostMapping("/folders")
    public ApiResponse<Folder> upsertFolders(@RequestBody Folder folder) {
        repo.saveFolder(folder);
        return ApiResponse.success(folder);
    }

    @GetMapping("/folders")
    public ApiResponse<List<Folder>> listFolders() {
        return ApiResponse.success(repo.findAllFolders());
    }


    @GetMapping("/tree")
    public ApiResponse<List<ConfigItem>> loadAll() {
        return ApiResponse.success(repo.loadAll().getRoots());
    }

    @PostMapping("/move-node")
    public ApiResponse<Boolean> getFolder(@RequestBody MoveNodeReq req) {
        repo.move(req);
        return ApiResponse.success(Boolean.TRUE);
    }



    @DeleteMapping("/folders/{id}")
    public ApiResponse<Boolean> deleteFolder(@PathVariable String id) {
        repo.deleteFolder(id);
        return ApiResponse.success(true);
    }

    @PostMapping("/connections")
    public ApiResponse<ConnectionConfig> createConnection(@RequestBody ConnectionConfig cfg) {
        repo.saveConnection(cfg);
        return ApiResponse.success(cfg);
    }

    @GetMapping("/connections")
    public ApiResponse<List<ConnectionConfig>> listConnections() {
        return ApiResponse.success(repo.findAllConnections());
    }

    @GetMapping("/connections/{id}")
    public ApiResponse<ConnectionConfig> getConnection(@PathVariable String id) {
        return ApiResponse.success(repo.findConnectionById(id).orElse(null));
    }

    @DeleteMapping("/connections/{id}")
    public ApiResponse<Boolean> deleteConnection(@PathVariable String id) {
        repo.deleteConnection(id);
        return ApiResponse.success(true);
    }

    @GetMapping("/connections/{id}/test")
    public ApiResponse<Boolean> testConnection(@PathVariable String id) {
        var opt = repo.findConnectionById(id);
        if (opt.isEmpty()) {
            throw new BizException(ErrorCode.BUSINESS_ERROR, "connection not found");
        }
        ConnectionConfig cfg = opt.get();
        var provider = registry.getProvider(cfg.getDbType());
        if (provider == null) {
            throw new BizException(ErrorCode.BUSINESS_ERROR, "no provider: " + cfg.getDbType());
        }
        return ApiResponse.success(provider.testConnection(cfg));
    }

    @PostMapping("/connections/test")
    public ApiResponse<Boolean> testConnection(@RequestBody ConnectionConfig cfg) {
        var provider = registry.getProvider(cfg.getDbType());
        if (provider == null) {
            throw new BizException(ErrorCode.BUSINESS_ERROR, "no provider: " + cfg.getDbType());
        }
        if (!StringUtils.hasText(cfg.getPassword()) && StringUtils.hasText(cfg.getId())) {
            var opt = repo.findConnectionById(cfg.getId());
			opt.ifPresent(connectionConfig -> cfg.setPassword(connectionConfig.getPassword()));
        }

        return ApiResponse.success(provider.testConnection(cfg));
    }
}
