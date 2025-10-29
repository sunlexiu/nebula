package com.deego.model;

import com.deego.utils.IdWorker;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "connections")
@Data
@NoArgsConstructor
public class Connection {
	@Id
	@Column(length = 32)
	private String id = IdWorker.getIdStr(); // 雪花 ID

	private String name;
	private String dbType;
	private String host;
	private Integer port;
	private String database;
	private String username;
	private String password;

	@Column(name = "parent_id")
	private String parentId;

	private Boolean connected = false;
}