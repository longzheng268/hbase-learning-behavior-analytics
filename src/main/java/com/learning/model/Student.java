package com.learning.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    private String studentId;
    private String name;
    private String major;
    private String className;
    private String email;
    private String enrollmentYear;
}
