package com.deego.service;

import com.deego.model.Folder;
import com.deego.repository.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class FolderService {
	@Autowired
	private FolderRepository folderRepository;

	public List<Folder> getAllFolders() {
		return folderRepository.findAll();
	}

	public Folder createOrUpdateFolder(Folder folder) {
		// 如果有 id，则更新；否则新建
		return folderRepository.save(folder);
	}

	public Optional<Folder> getFolder(Long id) {
		return folderRepository.findById(id);
	}

	public void deleteFolder(Long id) {
		folderRepository.deleteById(id);
	}

	public List<Folder> getRootFolders() {
		return folderRepository.findByParentIdIsNull();
	}

	public List<Folder> getChildFolders(Long parentId) {
		return folderRepository.findByParentId(parentId);
	}
}