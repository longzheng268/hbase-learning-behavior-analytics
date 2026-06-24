package com.learning.model;

public enum BehaviorType {
    LOGIN("登录"),
    COURSE_ACCESS("课程访问"),
    RESOURCE_BROWSE("资源浏览"),
    VIDEO_WATCH("视频学习"),
    QUIZ_SUBMIT("练习提交"),
    HOMEWORK_SUBMIT("作业提交");

    private final String displayName;

    BehaviorType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static BehaviorType fromString(String text) {
        for (BehaviorType b : BehaviorType.values()) {
            if (b.name().equalsIgnoreCase(text) || b.displayName.equals(text)) {
                return b;
            }
        }
        return null;
    }
}
