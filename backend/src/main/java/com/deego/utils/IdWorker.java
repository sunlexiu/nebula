package com.deego.utils;

/**
 * 极简雪花算法（Snowflake ID）- 零依赖
 * 64 位：1 位符号 + 41 位时间戳 + 10 位机器ID + 12 位序列号
 * 每毫秒支持 4096 个 ID，足够数据库管理软件使用
 */
public class IdWorker {
	private final long workerId;
	private final long datacenterId;
	private long sequence = 0L;

	private final long twepoch = 1288834974657L; // 起始时间戳

	private final long workerIdBits = 5L;
	private final long datacenterIdBits = 5L;
	private final long maxWorkerId = ~(-1L << workerIdBits);
	private final long maxDatacenterId = ~(-1L << datacenterIdBits);
	private final long sequenceBits = 12L;

	private final long workerIdShift = sequenceBits;
	private final long datacenterIdShift = sequenceBits + workerIdBits;
	private final long timestampLeftShift = sequenceBits + workerIdBits + datacenterIdBits;
	private final long sequenceMask = ~(-1L << sequenceBits);

	private long lastTimestamp = -1L;

	public IdWorker(long workerId, long datacenterId) {
		if (workerId > maxWorkerId || workerId < 0) {
			throw new IllegalArgumentException("worker Id can't be greater than " + maxWorkerId + " or less than 0");
		}
		if (datacenterId > maxDatacenterId || datacenterId < 0) {
			throw new IllegalArgumentException("datacenter Id can't be greater than " + maxDatacenterId + " or less than 0");
		}
		this.workerId = workerId;
		this.datacenterId = datacenterId;
	}

	public synchronized long nextId() {
		long timestamp = timeGen();

		if (timestamp < lastTimestamp) {
			throw new RuntimeException("Clock moved backwards.");
		}

		if (lastTimestamp == timestamp) {
			sequence = (sequence + 1) & sequenceMask;
			if (sequence == 0) {
				timestamp = tilNextMillis(lastTimestamp);
			}
		} else {
			sequence = 0L;
		}

		lastTimestamp = timestamp;

		return ((timestamp - twepoch) << timestampLeftShift) |
				(datacenterId << datacenterIdShift) |
				(workerId << workerIdShift) |
				sequence;
	}

	private long tilNextMillis(long lastTimestamp) {
		long timestamp = timeGen();
		while (timestamp <= lastTimestamp) {
			timestamp = timeGen();
		}
		return timestamp;
	}

	private long timeGen() {
		return System.currentTimeMillis();
	}

	// 静态实例（单机使用，workerId=1, datacenterId=1）
	private static final IdWorker INSTANCE = new IdWorker(1, 1);

	public static long getId() {
		return INSTANCE.nextId();
	}

	public static String getIdStr() {
		return String.valueOf(INSTANCE.nextId());
	}
}