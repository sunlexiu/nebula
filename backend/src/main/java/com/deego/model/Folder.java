package com.deego.model;

import com.deego.utils.IdWorker;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "folders")
@Data
@NoArgsConstructor
public class Folder {
	@Id
	@Column(length = 32)
	private String id = IdWorker.getIdStr(); // 雪花 ID

	private String name;

	@Column(name = "parent_id")
	private String parentId;

	public Folder(String name, String parentId) {
		this.id = IdWorker.getIdStr();
		this.name = name;
		this.parentId = parentId;
	}
}