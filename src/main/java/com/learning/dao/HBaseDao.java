package com.learning.dao;

import com.learning.model.BehaviorType;
import com.learning.model.LearningBehavior;
import org.apache.hadoop.hbase.CompareOperator;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.filter.SingleColumnValueFilter;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.*;

@Repository
public class HBaseDao {

    @Autowired
    private Connection connection;

    @Value("${hbase.namespace:learning}")
    private String namespace;

    private static final String TABLE_NAME_STR = "learning_behavior";
    private static final String CF_INFO_STR = "info";
    private static final String CF_DETAIL_STR = "detail";

    private byte[] cfInfo() { return Bytes.toBytes(CF_INFO_STR); }
    private byte[] cfDetail() { return Bytes.toBytes(CF_DETAIL_STR); }

    public String getFullTableName() {
        return namespace + ":" + TABLE_NAME_STR;
    }

    public Table getTable() throws IOException {
        return connection.getTable(TableName.valueOf(namespace, TABLE_NAME_STR));
    }

    @PostConstruct
    public void initTable() throws IOException {
        Admin admin = connection.getAdmin();
        TableName tn = TableName.valueOf(namespace, TABLE_NAME_STR);

        try {
            admin.getNamespaceDescriptor(namespace);
        } catch (Exception e) {
            admin.createNamespace(
                org.apache.hadoop.hbase.NamespaceDescriptor.create(namespace).build());
        }

        if (!admin.tableExists(tn)) {
            TableDescriptorBuilder builder = TableDescriptorBuilder.newBuilder(tn);
            builder.setColumnFamily(ColumnFamilyDescriptorBuilder.of(cfInfo()));
            builder.setColumnFamily(ColumnFamilyDescriptorBuilder.of(cfDetail()));
            admin.createTable(builder.build());
        }
        admin.close();
    }

    // ======================== RowKey ========================

    public String generateRowKey(String studentId, long timestamp, BehaviorType behaviorType) {
        long reverseTs = Long.MAX_VALUE - timestamp;
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        return String.format("%s_%019d_%s_%s", studentId, reverseTs, behaviorType.name(), randomSuffix);
    }

    private byte[] scanStartRow(String studentId) {
        return Bytes.toBytes(studentId + "_");
    }

    private byte[] scanStopRow(String studentId) {
        return Bytes.toBytes(studentId + "`");
    }

    private byte[] timeStartRow(String studentId, long endTimestamp) {
        long reverseEnd = Long.MAX_VALUE - endTimestamp;
        return Bytes.toBytes(String.format("%s_%019d_", studentId, reverseEnd));
    }

    private byte[] timeStopRow(String studentId, long startTimestamp) {
        long reverseStart = Long.MAX_VALUE - startTimestamp;
        return Bytes.toBytes(String.format("%s_%019d`", studentId, reverseStart));
    }

    // ======================== 单条写入 ========================

    public void putBehavior(LearningBehavior b) throws IOException {
        try (Table table = getTable()) {
            table.put(buildPut(b));
        }
    }

    // ======================== 批量写入 ========================

    public void putBehaviors(List<LearningBehavior> behaviors) throws IOException {
        try (Table table = getTable()) {
            List<Put> puts = new ArrayList<>();
            for (LearningBehavior b : behaviors) {
                puts.add(buildPut(b));
            }
            table.put(puts);
        }
    }

    private Put buildPut(LearningBehavior b) {
        Put put = new Put(Bytes.toBytes(b.getRowKey()));
        put.addColumn(cfInfo(), Bytes.toBytes("student_id"), Bytes.toBytes(b.getStudentId()));
        put.addColumn(cfInfo(), Bytes.toBytes("course_id"), Bytes.toBytes(b.getCourseId()));
        put.addColumn(cfInfo(), Bytes.toBytes("behavior_type"), Bytes.toBytes(b.getBehaviorType()));
        put.addColumn(cfInfo(), Bytes.toBytes("timestamp"), Bytes.toBytes(String.valueOf(b.getTimestamp())));
        if (b.getResourceId() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("resource_id"), Bytes.toBytes(b.getResourceId()));
        if (b.getDevice() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("device"), Bytes.toBytes(b.getDevice()));
        if (b.getIpAddress() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("ip_address"), Bytes.toBytes(b.getIpAddress()));
        if (b.getScore() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("score"), Bytes.toBytes(String.valueOf(b.getScore())));
        if (b.getDuration() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("duration"), Bytes.toBytes(String.valueOf(b.getDuration())));
        if (b.getStatus() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("status"), Bytes.toBytes(b.getStatus()));
        if (b.getExtraInfo() != null)
            put.addColumn(cfDetail(), Bytes.toBytes("extra_info"), Bytes.toBytes(b.getExtraInfo()));
        return put;
    }

    // ======================== Get ========================

    public LearningBehavior getByRowKey(String rowKey) throws IOException {
        try (Table table = getTable()) {
            Get get = new Get(Bytes.toBytes(rowKey));
            Result result = table.get(get);
            if (result.isEmpty()) return null;
            return resultToBehavior(result);
        }
    }

    // ======================== Scan 查询 ========================

    public List<LearningBehavior> scanByStudent(String studentId) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            scan.withStartRow(scanStartRow(studentId));
            scan.withStopRow(scanStopRow(studentId));
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanByStudentAndTimeRange(
            String studentId, long startTs, long endTs) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            scan.withStartRow(timeStartRow(studentId, endTs));
            scan.withStopRow(timeStopRow(studentId, startTs));
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanByStudentAndCourse(String studentId, String courseId) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            scan.withStartRow(scanStartRow(studentId));
            scan.withStopRow(scanStopRow(studentId));
            SingleColumnValueFilter filter = new SingleColumnValueFilter(
                    cfInfo(), Bytes.toBytes("course_id"),
                    CompareOperator.EQUAL, Bytes.toBytes(courseId));
            filter.setFilterIfMissing(true);
            scan.setFilter(filter);
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanByCourse(String courseId) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            SingleColumnValueFilter filter = new SingleColumnValueFilter(
                    cfInfo(), Bytes.toBytes("course_id"),
                    CompareOperator.EQUAL, Bytes.toBytes(courseId));
            filter.setFilterIfMissing(true);
            scan.setFilter(filter);
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanByBehaviorType(String behaviorType) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            SingleColumnValueFilter filter = new SingleColumnValueFilter(
                    cfInfo(), Bytes.toBytes("behavior_type"),
                    CompareOperator.EQUAL, Bytes.toBytes(behaviorType));
            filter.setFilterIfMissing(true);
            scan.setFilter(filter);
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanByStudentCourseTimeRange(
            String studentId, String courseId, long startTs, long endTs) throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            scan.withStartRow(timeStartRow(studentId, endTs));
            scan.withStopRow(timeStopRow(studentId, startTs));
            SingleColumnValueFilter filter = new SingleColumnValueFilter(
                    cfInfo(), Bytes.toBytes("course_id"),
                    CompareOperator.EQUAL, Bytes.toBytes(courseId));
            filter.setFilterIfMissing(true);
            scan.setFilter(filter);
            return doScan(table, scan);
        }
    }

    public List<LearningBehavior> scanAll() throws IOException {
        try (Table table = getTable()) {
            Scan scan = new Scan();
            scan.setCaching(500);
            return doScan(table, scan);
        }
    }

    // ======================== 更新 ========================

    public void updateBehavior(String rowKey, Map<String, String> updates) throws IOException {
        try (Table table = getTable()) {
            Get get = new Get(Bytes.toBytes(rowKey));
            Result result = table.get(get);
            if (result.isEmpty()) throw new IOException("Row not found: " + rowKey);

            Put put = new Put(Bytes.toBytes(rowKey));
            for (Map.Entry<String, String> entry : updates.entrySet()) {
                byte[] qualifier = Bytes.toBytes(entry.getKey());
                byte[] value = Bytes.toBytes(entry.getValue());
                if (isInfoColumn(entry.getKey())) {
                    put.addColumn(cfInfo(), qualifier, value);
                } else {
                    put.addColumn(cfDetail(), qualifier, value);
                }
            }
            table.put(put);
        }
    }

    private boolean isInfoColumn(String col) {
        return "student_id".equals(col) || "course_id".equals(col) ||
               "behavior_type".equals(col) || "timestamp".equals(col);
    }

    // ======================== 删除 ========================

    public void deleteBehavior(String rowKey) throws IOException {
        try (Table table = getTable()) {
            table.delete(new Delete(Bytes.toBytes(rowKey)));
        }
    }

    // ======================== 辅助 ========================

    private List<LearningBehavior> doScan(Table table, Scan scan) throws IOException {
        List<LearningBehavior> list = new ArrayList<>();
        try (ResultScanner scanner = table.getScanner(scan)) {
            for (Result result : scanner) {
                LearningBehavior b = resultToBehavior(result);
                if (b != null) list.add(b);
            }
        }
        return list;
    }

    private LearningBehavior resultToBehavior(Result r) {
        if (r.isEmpty()) return null;
        LearningBehavior b = new LearningBehavior();
        b.setRowKey(Bytes.toString(r.getRow()));
        b.setStudentId(bs(r, cfInfo(), Bytes.toBytes("student_id")));
        b.setCourseId(bs(r, cfInfo(), Bytes.toBytes("course_id")));
        b.setBehaviorType(bs(r, cfInfo(), Bytes.toBytes("behavior_type")));
        String tsStr = bs(r, cfInfo(), Bytes.toBytes("timestamp"));
        if (tsStr != null) b.setTimestamp(Long.parseLong(tsStr));
        b.setResourceId(bs(r, cfDetail(), Bytes.toBytes("resource_id")));
        b.setDevice(bs(r, cfDetail(), Bytes.toBytes("device")));
        b.setIpAddress(bs(r, cfDetail(), Bytes.toBytes("ip_address")));
        b.setStatus(bs(r, cfDetail(), Bytes.toBytes("status")));
        b.setExtraInfo(bs(r, cfDetail(), Bytes.toBytes("extra_info")));
        String scoreStr = bs(r, cfDetail(), Bytes.toBytes("score"));
        if (scoreStr != null) b.setScore(Double.parseDouble(scoreStr));
        String durStr = bs(r, cfDetail(), Bytes.toBytes("duration"));
        if (durStr != null) b.setDuration(Long.parseLong(durStr));
        return b;
    }

    private String bs(Result r, byte[] cf, byte[] q) {
        byte[] val = r.getValue(cf, q);
        return val != null ? Bytes.toString(val) : null;
    }
}
