package com.deego.service;

import com.deego.model.Folder;
import com.deego.repository.FolderRepository;
import com.deego.utils.IdWorker;
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
		if (folder.getId() == null || folder.getId().isEmpty()) {
			folder.setId(IdWorker.getIdStr());
		}
		return folderRepository.save(folder);
	}

	public Optional<Folder> getFolder(String id) {
		return folderRepository.findById(id);
	}

	public void deleteFolder(String id) {
		folderRepository.deleteById(id);
	}

	public List<Folder> getRootFolders() {
		return folderRepository.findByParentIdIsNull();
	}

	public List<Folder> getChildFolders(String parentId) {
		return folderRepository.findByParentId(parentId);
	}
}