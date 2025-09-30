package com.slx.nebula.controller;

import com.slx.nebula.model.ConfigData;
import com.slx.nebula.model.ConfigItem;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;
import com.slx.nebula.repository.ConfigRepository;
import com.slx.nebula.connection.DatabaseProviderRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<Folder> createFolder(@RequestBody Folder folder) {
        repo.saveFolder(folder);
        return ResponseEntity.ok(folder);
    }

    @GetMapping("/folders")
    public ResponseEntity<List<Folder>> listFolders() {
        return ResponseEntity.ok(repo.findAllFolders());
    }


    @GetMapping("/tree")
    public ResponseEntity<List<ConfigItem>> loadAll() {
        return ResponseEntity.ok(repo.loadAll().getRoots());
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<?> deleteFolder(@PathVariable String id) {
        repo.deleteFolder(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/connections")
    public ResponseEntity<ConnectionConfig> createConnection(@RequestBody ConnectionConfig cfg) {
        repo.saveConnection(cfg);
        return ResponseEntity.ok(cfg);
    }

    @GetMapping("/connections")
    public ResponseEntity<List<ConnectionConfig>> listConnections() {
        return ResponseEntity.ok(repo.findAllConnections());
    }

    @GetMapping("/connections/{id}")
    public ResponseEntity<ConnectionConfig> getConnection(@PathVariable String id) {
        return repo.findConnectionById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/connections/{id}")
    public ResponseEntity<?> deleteConnection(@PathVariable String id) {
        repo.deleteConnection(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/connections/{id}/test")
    public ResponseEntity<?> testConnection(@PathVariable String id) {
        var opt = repo.findConnectionById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ConnectionConfig cfg = opt.get();
        var provider = registry.getProvider(cfg.getDbType());
        if (provider == null) return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "no provider: " + cfg.getDbType()));
        boolean ok = provider.testConnection(cfg);
        return ResponseEntity.ok(Map.of("ok", ok));
    }
}
