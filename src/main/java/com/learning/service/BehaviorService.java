package com.learning.service;

import com.learning.dao.HBaseDao;
import com.learning.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class BehaviorService {

    @Autowired
    private HBaseDao hbaseDao;

    /** 记录一条学习行为 */
    public String recordBehavior(LearningBehavior behavior) throws IOException {
        if (behavior.getRowKey() == null || behavior.getRowKey().isEmpty()) {
            BehaviorType bt = BehaviorType.fromString(behavior.getBehaviorType());
            if (bt == null) bt = BehaviorType.LOGIN;
            String rowKey = hbaseDao.generateRowKey(
                    behavior.getStudentId(), behavior.getTimestamp(), bt);
            behavior.setRowKey(rowKey);
        }
        hbaseDao.putBehavior(behavior);
        return behavior.getRowKey();
    }

    /** 批量写入 */
    public void recordBehaviors(List<LearningBehavior> behaviors) throws IOException {
        for (LearningBehavior b : behaviors) {
            if (b.getRowKey() == null || b.getRowKey().isEmpty()) {
                BehaviorType bt = BehaviorType.fromString(b.getBehaviorType());
                if (bt == null) bt = BehaviorType.LOGIN;
                b.setRowKey(hbaseDao.generateRowKey(b.getStudentId(), b.getTimestamp(), bt));
            }
        }
        hbaseDao.putBehaviors(behaviors);
    }

    /** Get 精确查询 */
    public LearningBehavior getByRowKey(String rowKey) throws IOException {
        return hbaseDao.getByRowKey(rowKey);
    }

    /** 查询指定学生的全部行为 */
    public List<LearningBehavior> getByStudent(String studentId) throws IOException {
        return hbaseDao.scanByStudent(studentId);
    }

    /** 查询指定学生在时间范围内的行为 */
    public List<LearningBehavior> getByStudentAndTimeRange(
            String studentId, long startTs, long endTs) throws IOException {
        return hbaseDao.scanByStudentAndTimeRange(studentId, startTs, endTs);
    }

    /** 查询指定学生在某门课程中的行为 */
    public List<LearningBehavior> getByStudentAndCourse(
            String studentId, String courseId) throws IOException {
        return hbaseDao.scanByStudentAndCourse(studentId, courseId);
    }

    /** 查询某门课程的行为 */
    public List<LearningBehavior> getByCourse(String courseId) throws IOException {
        return hbaseDao.scanByCourse(courseId);
    }

    /** 按行为类型查询 */
    public List<LearningBehavior> getByBehaviorType(String behaviorType) throws IOException {
        return hbaseDao.scanByBehaviorType(behaviorType);
    }

    /** 组合查询：学生+课程+时间范围 */
    public List<LearningBehavior> getCombined(
            String studentId, String courseId, long startTs, long endTs) throws IOException {
        return hbaseDao.scanByStudentCourseTimeRange(studentId, courseId, startTs, endTs);
    }

    /** 全表扫描 */
    public List<LearningBehavior> getAll() throws IOException {
        return hbaseDao.scanAll();
    }

    /** 更新行为记录 */
    public void updateBehavior(String rowKey, Map<String, String> updates) throws IOException {
        hbaseDao.updateBehavior(rowKey, updates);
    }

    /** 删除行为记录 */
    public void deleteBehavior(String rowKey) throws IOException {
        hbaseDao.deleteBehavior(rowKey);
    }

    /** 获取HBase表名（用于Shell验证） */
    public String getTableName() {
        return hbaseDao.getFullTableName();
    }
}
