package com.deego.repository;

import com.deego.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, String> {
	List<Folder> findByParentId(String parentId);
	List<Folder> findByParentIdIsNull();
}