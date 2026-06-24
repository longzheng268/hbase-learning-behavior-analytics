package com.learning.util;

import com.learning.model.*;
import com.learning.service.BaseDataService;
import com.learning.service.BehaviorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.SQLException;
import java.util.*;

@Component
public class DataGenerator {

    @Autowired
    private BaseDataService baseDataService;

    @Autowired
    private BehaviorService behaviorService;

    private static final String[] NAMES = {
        "张三", "李四", "王五", "赵六", "陈七",
        "刘八", "周九", "吴十", "郑十一", "孙十二",
        "马十三", "朱十四", "胡十五", "林十六", "何十七",
        "高十八", "罗十九", "郭二十", "梁二十一", "宋二十二"
    };

    private static final String[] MAJORS = {"计算机科学", "软件工程", "数据科学", "人工智能", "网络安全"};
    private static final String[] CLASSES = {"2023级1班", "2023级2班", "2024级1班", "2024级2班"};
    private static final String[] DEVICES = {"PC-Chrome", "PC-Firefox", "Android", "iOS", "iPad"};
    private static final String[] IPS = {"192.168.1.101", "192.168.1.102", "10.0.0.55", "172.16.0.33", "192.168.2.201"};

    /** 生成基础数据 */
    public void generateBaseData() throws SQLException {
        // 学生
        for (int i = 0; i < NAMES.length; i++) {
            String sid = String.format("S%04d", i + 1);
            baseDataService.addStudent(new Student(sid, NAMES[i], MAJORS[i % MAJORS.length],
                    CLASSES[i % CLASSES.length], sid.toLowerCase() + "@edu.cn", "2023"));
        }
        // 课程
        String[][] courses = {
            {"C001", "大数据技术基础", "王教授", "计算机学院"},
            {"C002", "HBase原理与实践", "李教授", "计算机学院"},
            {"C003", "Hadoop生态系统", "张教授", "计算机学院"},
            {"C004", "数据库系统概论", "赵教授", "信息学院"},
            {"C005", "分布式系统", "陈教授", "计算机学院"}
        };
        for (String[] c : courses) {
            baseDataService.addCourse(new Course(c[0], c[1], c[2], c[3], 3));
        }
        // 资源
        String[][] resources = {
            {"R001", "第1章课件-PPT", "课件", "C001"},
            {"R002", "第2章课件-PPT", "课件", "C001"},
            {"R003", "HBase安装指南", "文档", "C002"},
            {"R004", "HBase Shell实验", "实验指导", "C002"},
            {"R005", "大数据概述视频", "视频", "C001"},
            {"R006", "HBase架构讲解视频", "视频", "C002"},
            {"R007", "Hadoop安装文档", "文档", "C003"},
            {"R008", "SQL基础教程", "课件", "C004"},
            {"R009", "分布式一致性论文", "文档", "C005"},
            {"R010", "MapReduce实战视频", "视频", "C003"}
        };
        for (String[] r : resources) {
            baseDataService.addResource(new LearningResource(r[0], r[1], r[2], r[3]));
        }
    }

    /** 生成学习行为数据（30天，20个学生，每个学生每天3-8条行为） */
    public int generateBehaviorData(int days) throws IOException {
        Random rand = new Random(42);
        List<LearningBehavior> batch = new ArrayList<>();
        long now = System.currentTimeMillis();
        long dayMs = 24L * 3600 * 1000;

        String[] courseIds = {"C001", "C002", "C003", "C004", "C005"};
        String[] resourceIds = {"R001", "R002", "R003", "R004", "R005", "R006", "R007", "R008", "R009", "R010"};

        for (int day = days; day >= 0; day--) {
            for (int stuIdx = 0; stuIdx < NAMES.length; stuIdx++) {
                String studentId = String.format("S%04d", stuIdx + 1);
                // 80%的概率今天有学习行为
                if (rand.nextDouble() > 0.8) continue;
                int behaviorCount = 3 + rand.nextInt(6); // 3-8条

                for (int b = 0; b < behaviorCount; b++) {
                    long ts = now - day * dayMs + rand.nextInt((int) dayMs);
                    String courseId = courseIds[rand.nextInt(courseIds.length)];
                    String deviceId = DEVICES[rand.nextInt(DEVICES.length)];
                    String ip = IPS[rand.nextInt(IPS.length)];
                    int typeIdx = rand.nextInt(6);

                    LearningBehavior lb = new LearningBehavior();
                    lb.setStudentId(studentId);
                    lb.setCourseId(courseId);
                    lb.setTimestamp(ts);
                    lb.setDevice(deviceId);
                    lb.setIpAddress(ip);

                    switch (typeIdx) {
                        case 0: // 登录
                            lb.setBehaviorType("LOGIN");
                            lb.setStatus("success");
                            break;
                        case 1: // 课程访问
                            lb.setBehaviorType("COURSE_ACCESS");
                            lb.setStatus(rand.nextBoolean() ? "enter" : "leave");
                            break;
                        case 2: // 资源浏览
                            lb.setBehaviorType("RESOURCE_BROWSE");
                            lb.setResourceId(resourceIds[rand.nextInt(resourceIds.length)]);
                            break;
                        case 3: // 视频学习
                            lb.setBehaviorType("VIDEO_WATCH");
                            lb.setResourceId(resourceIds[rand.nextInt(resourceIds.length)]);
                            lb.setDuration((long) (60 + rand.nextInt(3600))); // 1分钟到1小时
                            lb.setStatus(rand.nextBoolean() ? "start" : "end");
                            break;
                        case 4: // 练习
                            lb.setBehaviorType("QUIZ_SUBMIT");
                            lb.setScore(60.0 + rand.nextInt(41)); // 60-100
                            lb.setStatus("completed");
                            break;
                        case 5: // 作业
                            lb.setBehaviorType("HOMEWORK_SUBMIT");
                            lb.setScore(50.0 + rand.nextInt(51)); // 50-100
                            lb.setStatus(rand.nextBoolean() ? "submitted" : "completed");
                            break;
                    }

                    BehaviorType bt = BehaviorType.fromString(lb.getBehaviorType());
                    lb.setRowKey(String.format("%s_%019d_%s_%04d",
                            studentId, Long.MAX_VALUE - ts, bt.name(), rand.nextInt(10000)));
                    batch.add(lb);
                }
            }

            // 每500条批量写入
            if (batch.size() >= 500) {
                behaviorService.recordBehaviors(new ArrayList<>(batch));
                batch.clear();
            }
        }

        // 写入剩余
        if (!batch.isEmpty()) {
            behaviorService.recordBehaviors(batch);
        }

        return days;
    }
}
