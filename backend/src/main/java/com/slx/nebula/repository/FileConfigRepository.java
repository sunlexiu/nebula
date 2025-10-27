package com.slx.nebula.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slx.nebula.exception.BizException;
import com.slx.nebula.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;

@Component
@Slf4j
public class FileConfigRepository implements ConfigRepository {

	private final ObjectMapper mapper = new ObjectMapper();
	private final File file;
	private final ConfigData data;
	private final AtomicLong idgen = new AtomicLong(System.currentTimeMillis());

	public FileConfigRepository() {
		File home = new File(System.getProperty("user.dir"), ".nebula");
		if (!home.exists()) {
			home.mkdirs();
		}
		this.file = new File(home, "config.json");
		if (file.exists()) {
			this.data = loadWithCompatibility(this.file);
		} else {
			this.data = new ConfigData();
			persist();
		}
	}

	private ConfigData loadWithCompatibility(File f) {
		try {
			return mapper.readValue(f, ConfigData.class);
		} catch (IOException e) {
			log.error("load config error", e);
			throw new BizException(e);
		}
	}

	private void persist() {
		try {
			mapper.writerWithDefaultPrettyPrinter().writeValue(file, data);
		} catch (IOException e) {
			throw new BizException(e);
		}
	}

	private String nextId() {
		return Long.toString(idgen.incrementAndGet());
	}

	@Override
	public List<ConfigItem> getTree() {
		return data.roots;
	}

	@Override
	public Folder saveFolder(Folder folder) {
		if (folder.id == null) {
			folder.id = nextId();
		}
		deleteById(folder.id);
		data.roots.add(folder);
		persist();
		return folder;
	}

	@Override
	public void deleteFolder(String id) {
		deleteById(id);
		persist();
	}

	private void deleteById(String id) {
		data.roots.removeIf(it -> Objects.equals(it.id, id));
		for (ConfigItem root : data.roots) {
			if (root instanceof Folder f) {
				f.children.removeIf(it -> Objects.equals(it.id, id));
			}
		}
	}

	@Override
	public ConnectionConfig saveConnection(ConnectionConfig c) {
		if (c.id == null) {
			c.id = nextId();
		}
		removeConnection(c.id);
		data.roots.add(c);
		persist();
		return c;
	}

	private void removeConnection(String id) {
		data.roots.removeIf(it -> it instanceof ConnectionConfig cc && Objects.equals(cc.id, id));
		for (ConfigItem root : data.roots) {
			if (root instanceof Folder f) {
				f.children.removeIf(it -> it instanceof ConnectionConfig cc && Objects.equals(cc.id, id));
			}
		}
	}

	@Override
	public List<ConnectionConfig> listConnections() {
		List<ConnectionConfig> list = new ArrayList<>();
		for (ConfigItem it : data.roots) {
			if (it instanceof ConnectionConfig cc) {
				list.add(cc);
			}
			if (it instanceof Folder f) {
				for (ConfigItem ch : f.children) {
					if (ch instanceof ConnectionConfig cc) {
						list.add(cc);
					}
				}
			}
		}
		return list;
	}

	@Override
	public ConnectionConfig getConnection(String id) {
		for (ConfigItem it : data.roots) {
			if (Objects.equals(it.id, id) && it instanceof ConnectionConfig cc) {
				return cc;
			}
			if (it instanceof Folder f) {
				for (ConfigItem ch : f.children) {
					if (Objects.equals(ch.id, id) && ch instanceof ConnectionConfig cc) {
						return cc;
					}
				}
			}
		}
		return null;
	}

	@Override
	public void deleteConnection(String id) {
		removeConnection(id);
		persist();
	}

	@Override
	public void move(MoveNodeReq req) {
		if (req == null || req.sourceId == null) {
			return;
		}
		ConfigItem src = null;

		// find and remove
		Iterator<ConfigItem> it = data.roots.iterator();
		while (it.hasNext()) {
			ConfigItem n = it.next();
			if (Objects.equals(n.id, req.sourceId)) {
				src = n;
				it.remove();
				break;
			} else if (n instanceof Folder f) {
				Iterator<ConfigItem> it2 = f.children.iterator();
				while (it2.hasNext()) {
					ConfigItem n2 = it2.next();
					if (Objects.equals(n2.id, req.sourceId)) {
						src = n2;
						it2.remove();
						break;
					}
				}
			}
			if (src != null) {
				break;
			}
		}
		if (src == null) {
			return;
		}

		// find target
		if (req.targetParentId == null) {
			data.roots.add(src);
		} else {
			Folder target = findFolder(req.targetParentId);
			if (target != null) {
				target.children.add(src);
			} else {
				data.roots.add(src);
			}
		}
		persist();
	}

	private Folder findFolder(String id) {
		for (ConfigItem it : data.roots) {
			if (it instanceof Folder f && Objects.equals(f.id, id)) {
				return f;
			}
			if (it instanceof Folder f2) {
				for (ConfigItem ch : f2.children) {
					if (ch instanceof Folder f && Objects.equals(f.id, id)) {
						return f;
					}
				}
			}
		}
		return null;
	}
}
