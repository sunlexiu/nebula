package com.deego.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "connections")
@Data
@NoArgsConstructor
public class Connection {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;
	private String dbType; // e.g., POSTGRESQL
	private String host;
	private Integer port;
	private String database;
	private String username;
	private String password; // 加密存储，生产用 BCrypt

	@Column(name = "parent_id")
	private Long parentId; // 文件夹 ID

	private Boolean connected = false;
}