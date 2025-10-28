package com.deego.repository;

import com.deego.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
	List<Connection> findByParentId(Long parentId);
	List<Connection> findByParentIdIsNull(); // 根连接
}