package com.deego;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;

public class CodeFileCollectorWithExclude {

	// 支持的代码文件扩展名
	private static final String[] CODE_EXTENSIONS = {
			".java", ".xml", ".yml"
	};

	// 要排除的文件夹名称
	private static final Set<String> EXCLUDED_DIRS = new HashSet<>(Arrays.asList(
			"dist", "dist-electron", "node_modules"
	));
	private static final Set<String> EXCLUDED_FILES = new HashSet<>(Arrays.asList(
			"package-lock.json"
	));

	public static void main(String[] args) {
		String sourceFolder = "D:\\workspace\\nebula_db\\frontend";  // 要扫描的源代码文件夹
		String outputFile = "all_codes.txt";  // 输出文件


		try {
			collectCodeFiles(sourceFolder, outputFile);
			System.out.println("代码文件收集完成！输出文件: " + outputFile);
		} catch (IOException e) {
			System.err.println("处理过程中发生错误: " + e.getMessage());
			e.printStackTrace();
		}
	}

	public static void collectCodeFiles(String sourceFolder, String outputFile) throws IOException {
		List<Path> codeFiles = findCodeFiles(sourceFolder);

		try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(outputFile))) {
			for (Path file : codeFiles) {
				writeFileContent(writer, file, sourceFolder);
			}
		}
	}

	private static List<Path> findCodeFiles(String folderPath) throws IOException {
		List<Path> codeFiles = new ArrayList<>();
		Path startDir = Paths.get(folderPath);

		Files.walkFileTree(startDir, new SimpleFileVisitor<Path>() {
			@Override
			public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
				// 检查是否应该排除这个目录
				if (shouldExcludeDirectory(dir)) {
					System.out.println("跳过目录: " + dir);
					return FileVisitResult.SKIP_SUBTREE;
				}
				return FileVisitResult.CONTINUE;
			}

			@Override
			public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
				if (!shouldExcludeFile(file) && isCodeFile(file)) {
					codeFiles.add(file);
				}
				return FileVisitResult.CONTINUE;
			}

			@Override
			public FileVisitResult visitFileFailed(Path file, IOException exc) {
				System.err.println("无法访问文件: " + file + " - " + exc.getMessage());
				return FileVisitResult.CONTINUE;
			}
		});

		return codeFiles;
	}

	private static boolean shouldExcludeDirectory(Path dir) {
		String dirName = dir.getFileName().toString();
		return EXCLUDED_DIRS.contains(dirName);
	}

	private static boolean shouldExcludeFile(Path dir) {
		String dirName = dir.getFileName().toString();
		return EXCLUDED_FILES.contains(dirName);
	}

	private static boolean isCodeFile(Path file) {
		String fileName = file.getFileName().toString().toLowerCase();

		// 检查文件扩展名
		for (String ext : CODE_EXTENSIONS) {
			if (fileName.endsWith(ext)) {
				return true;
			}
		}

		return false;
	}

	private static void writeFileContent(BufferedWriter writer, Path file, String baseDir) throws IOException {
		// 写入文件路径标题
		String relativePath = getRelativePath(file, baseDir);
		writer.write(relativePath);
		writer.newLine();
		writer.newLine();

		// 写入文件内容
		try (BufferedReader reader = Files.newBufferedReader(file)) {
			String line;
			while ((line = reader.readLine()) != null) {
				writer.write(line);
				writer.newLine();
			}
		} catch (IOException e) {
			writer.write("// 无法读取文件内容: " + e.getMessage());
			writer.newLine();
		}

		// 文件之间添加分隔符
		writer.newLine();
		writer.write("// =========================================");
		writer.newLine();
		writer.newLine();
	}

	private static String getRelativePath(Path file, String baseDir) {
		Path basePath = Paths.get(baseDir);
		return basePath.relativize(file).toString().replace('\\', '/');
	}
}