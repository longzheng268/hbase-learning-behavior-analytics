package com.learning.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningResource {
    private String resourceId;
    private String resourceName;
    private String resourceType; // 课件/文档/视频/实验指导
    private String courseId;
}
