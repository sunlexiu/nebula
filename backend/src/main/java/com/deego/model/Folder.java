package com.deego.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "folders")
@Data
@NoArgsConstructor
public class Folder {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	@Column(name = "parent_id")
	private Long parentId;  // 支持嵌套文件夹

	public Folder(String name, Long parentId) {
		this.name = name;
		this.parentId = parentId;
	}
}