package com.learning.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    private String courseId;
    private String courseName;
    private String teacher;
    private String department;
    private int credit;
}
