package com.learning.service;

import com.learning.dao.HBaseDao;
import com.learning.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    @Autowired
    private HBaseDao hbaseDao;

    /** 学生登录次数统计 */
    public Map<String, Long> studentLoginCount() throws IOException {
        return hbaseDao.scanAll().stream()
                .filter(b -> "LOGIN".equals(b.getBehaviorType()))
                .collect(Collectors.groupingBy(LearningBehavior::getStudentId, Collectors.counting()));
    }

    /** 课程访问次数统计 */
    public Map<String, Long> courseAccessCount() throws IOException {
        return hbaseDao.scanAll().stream()
                .filter(b -> "COURSE_ACCESS".equals(b.getBehaviorType()))
                .collect(Collectors.groupingBy(LearningBehavior::getCourseId, Collectors.counting()));
    }

    /** 学习资源浏览次数统计 */
    public Map<String, Long> resourceBrowseCount() throws IOException {
        return hbaseDao.scanAll().stream()
                .filter(b -> "RESOURCE_BROWSE".equals(b.getBehaviorType())
                        && b.getResourceId() != null)
                .collect(Collectors.groupingBy(LearningBehavior::getResourceId, Collectors.counting()));
    }

    /** 视频学习总时长统计(按课程) */
    public Map<String, Long> videoWatchDurationByCourse() throws IOException {
        return hbaseDao.scanAll().stream()
                .filter(b -> "VIDEO_WATCH".equals(b.getBehaviorType()) && b.getDuration() != null)
                .collect(Collectors.groupingBy(LearningBehavior::getCourseId,
                        Collectors.summingLong(LearningBehavior::getDuration)));
    }

    /** 练习/作业完成次数统计 */
    public Map<String, Long> submitCountByType() throws IOException {
        return hbaseDao.scanAll().stream()
                .filter(b -> "QUIZ_SUBMIT".equals(b.getBehaviorType())
                        || "HOMEWORK_SUBMIT".equals(b.getBehaviorType()))
                .collect(Collectors.groupingBy(LearningBehavior::getBehaviorType, Collectors.counting()));
    }

    /** 学生学习活跃度排行(按行为总数) */
    public List<Map<String, Object>> studentActivityRanking() throws IOException {
        Map<String, Long> counts = hbaseDao.scanAll().stream()
                .collect(Collectors.groupingBy(LearningBehavior::getStudentId, Collectors.counting()));
        List<Map<String, Object>> ranking = new ArrayList<>();
        counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("studentId", e.getKey());
                    item.put("count", e.getValue());
                    ranking.add(item);
                });
        return ranking;
    }

    /** 课程访问量排行 */
    public List<Map<String, Object>> courseAccessRanking() throws IOException {
        Map<String, Long> counts = hbaseDao.scanAll().stream()
                .collect(Collectors.groupingBy(LearningBehavior::getCourseId, Collectors.counting()));
        List<Map<String, Object>> ranking = new ArrayList<>();
        counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("courseId", e.getKey());
                    item.put("count", e.getValue());
                    ranking.add(item);
                });
        return ranking;
    }

    /** 每日学习趋势 */
    public Map<String, Long> dailyTrend() throws IOException {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return hbaseDao.scanAll().stream()
                .collect(Collectors.groupingBy(
                        b -> sdf.format(new Date(b.getTimestamp())),
                        TreeMap::new, Collectors.counting()));
    }

    /** 学习时段分布(24小时) */
    public Map<Integer, Long> hourlyDistribution() throws IOException {
        return hbaseDao.scanAll().stream()
                .collect(Collectors.groupingBy(
                        b -> {
                            Calendar cal = Calendar.getInstance();
                            cal.setTimeInMillis(b.getTimestamp());
                            return cal.get(Calendar.HOUR_OF_DAY);
                        },
                        TreeMap::new, Collectors.counting()));
    }

    /** 学习预警：最近N天内未学习的学生 */
    public List<String> inactiveStudents(List<String> allStudentIds, int days) throws IOException {
        long cutoff = System.currentTimeMillis() - (long) days * 24 * 3600 * 1000;
        Set<String> activeStudents = hbaseDao.scanAll().stream()
                .filter(b -> b.getTimestamp() >= cutoff)
                .map(LearningBehavior::getStudentId)
                .collect(Collectors.toSet());
        return allStudentIds.stream()
                .filter(id -> !activeStudents.contains(id))
                .collect(Collectors.toList());
    }
}
