package com.slx.nebula.controller;

import com.slx.nebula.connection.Session;
import com.slx.nebula.connection.SessionManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.*;

@RestController
@RequestMapping("/session")
public class SessionController {
    private final SessionManager sessionManager;

    public SessionController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createSession(@RequestBody Map<String, String> body) {
        String editorId = body.get("editorId");
        String connectionId = body.get("connectionId");
        if (editorId == null || connectionId == null) return ResponseEntity.badRequest().body(Map.of("msg","editorId and connectionId required"));
        Session s = sessionManager.createSession(editorId, connectionId);
        return ResponseEntity.ok(Map.of("ok", true, "editorId", s.getEditorId()));
    }

    @PostMapping("/{editorId}/query")
    public ResponseEntity<?> query(@PathVariable String editorId, @RequestBody Map<String, String> body) throws Exception {
        Session s = sessionManager.getSession(editorId);
        if (s == null) return ResponseEntity.badRequest().body(Map.of("msg","no session"));
        String sql = body.getOrDefault("sql", "SELECT 1");
        try (var conn = s.getConnection();
             var stmt = conn.createStatement()) {
            boolean rsFlag = stmt.execute(sql);
            if (rsFlag) {
                try (ResultSet rs = stmt.getResultSet()) {
                    ResultSetMetaData md = rs.getMetaData();
                    int cols = md.getColumnCount();
                    List<Map<String,Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        Map<String,Object> row = new LinkedHashMap<>();
                        for (int i=1;i<=cols;i++) {
                            row.put(md.getColumnLabel(i), rs.getObject(i));
                        }
                        rows.add(row);
                    }
                    return ResponseEntity.ok(Map.of("ok", true, "rows", rows));
                }
            } else {
                int count = stmt.getUpdateCount();
                return ResponseEntity.ok(Map.of("ok", true, "updateCount", count));
            }
        }
    }

    @PostMapping("/{editorId}/close")
    public ResponseEntity<?> close(@PathVariable String editorId) {
        sessionManager.closeSession(editorId);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
