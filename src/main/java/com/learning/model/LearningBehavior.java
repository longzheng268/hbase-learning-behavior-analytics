package com.learning.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningBehavior {
    private String rowKey;
    private String studentId;
    private String courseId;
    private String behaviorType;
    private long timestamp;
    private String resourceId;
    private String device;
    private String ipAddress;
    private Double score;
    private Long duration;       // 时长(秒)
    private String status;       // 开始/暂停/结束/完成
    private String extraInfo;    // 附加JSON信息
}
