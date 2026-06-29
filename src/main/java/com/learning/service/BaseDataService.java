package com.learning.service;

import com.learning.dao.SQLiteDao;
import com.learning.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class BaseDataService {

    @Autowired
    private SQLiteDao sqliteDao;

    // Students
    public void addStudent(Student s) throws SQLException { sqliteDao.insertStudent(s); }
    public List<Student> getAllStudents() throws SQLException { return sqliteDao.getAllStudents(); }
    public Student getStudent(String id) throws SQLException { return sqliteDao.getStudentById(id); }
    public void updateStudent(Student s) throws SQLException {
        sqliteDao.updateStudent(s.getStudentId(), s.getName(), s.getMajor(), s.getClassName(), s.getEmail(), s.getEnrollmentYear());
    }
    public void deleteStudent(String id) throws SQLException { sqliteDao.deleteStudent(id); }

    // Courses
    public void addCourse(Course c) throws SQLException { sqliteDao.insertCourse(c); }
    public List<Course> getAllCourses() throws SQLException { return sqliteDao.getAllCourses(); }
    public Course getCourse(String id) throws SQLException { return sqliteDao.getCourseById(id); }
    public void updateCourse(Course c) throws SQLException {
        sqliteDao.updateCourse(c.getCourseId(), c.getCourseName(), c.getTeacher(), c.getDepartment(), c.getCredit());
    }
    public void deleteCourse(String id) throws SQLException { sqliteDao.deleteCourse(id); }

    // Resources
    public void addResource(LearningResource r) throws SQLException { sqliteDao.insertResource(r); }
    public List<LearningResource> getAllResources() throws SQLException { return sqliteDao.getAllResources(); }
    public List<LearningResource> getResourcesByCourse(String courseId) throws SQLException {
        return sqliteDao.getResourcesByCourse(courseId);
    }
    public void updateResource(LearningResource r) throws SQLException {
        sqliteDao.updateResource(r.getResourceId(), r.getResourceName(), r.getResourceType(), r.getCourseId());
    }
    public void deleteResource(String id) throws SQLException { sqliteDao.deleteResource(id); }
}
