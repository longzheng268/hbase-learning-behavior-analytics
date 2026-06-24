package com.learning.dao;

import com.learning.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Repository
public class SQLiteDao {

    @Autowired
    private Connection conn;

    // ==================== Students ====================

    public void insertStudent(Student s) throws SQLException {
        String sql = "INSERT OR REPLACE INTO students VALUES(?,?,?,?,?,?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, s.getStudentId());
            ps.setString(2, s.getName());
            ps.setString(3, s.getMajor());
            ps.setString(4, s.getClassName());
            ps.setString(5, s.getEmail());
            ps.setString(6, s.getEnrollmentYear());
            ps.executeUpdate();
        }
    }

    public List<Student> getAllStudents() throws SQLException {
        List<Student> list = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM students ORDER BY student_id")) {
            while (rs.next()) {
                list.add(mapStudent(rs));
            }
        }
        return list;
    }

    public Student getStudentById(String id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM students WHERE student_id=?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? mapStudent(rs) : null;
        }
    }

    private Student mapStudent(ResultSet rs) throws SQLException {
        return new Student(rs.getString("student_id"), rs.getString("name"),
                rs.getString("major"), rs.getString("class_name"),
                rs.getString("email"), rs.getString("enrollment_year"));
    }

    // ==================== Courses ====================

    public void insertCourse(Course c) throws SQLException {
        String sql = "INSERT OR REPLACE INTO courses VALUES(?,?,?,?,?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getCourseId());
            ps.setString(2, c.getCourseName());
            ps.setString(3, c.getTeacher());
            ps.setString(4, c.getDepartment());
            ps.setInt(5, c.getCredit());
            ps.executeUpdate();
        }
    }

    public List<Course> getAllCourses() throws SQLException {
        List<Course> list = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM courses ORDER BY course_id")) {
            while (rs.next()) {
                list.add(mapCourse(rs));
            }
        }
        return list;
    }

    public Course getCourseById(String id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM courses WHERE course_id=?")) {
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? mapCourse(rs) : null;
        }
    }

    private Course mapCourse(ResultSet rs) throws SQLException {
        return new Course(rs.getString("course_id"), rs.getString("course_name"),
                rs.getString("teacher"), rs.getString("department"), rs.getInt("credit"));
    }

    // ==================== Resources ====================

    public void insertResource(LearningResource r) throws SQLException {
        String sql = "INSERT OR REPLACE INTO resources VALUES(?,?,?,?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getResourceId());
            ps.setString(2, r.getResourceName());
            ps.setString(3, r.getResourceType());
            ps.setString(4, r.getCourseId());
            ps.executeUpdate();
        }
    }

    public List<LearningResource> getAllResources() throws SQLException {
        List<LearningResource> list = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM resources ORDER BY resource_id")) {
            while (rs.next()) {
                list.add(mapResource(rs));
            }
        }
        return list;
    }

    public List<LearningResource> getResourcesByCourse(String courseId) throws SQLException {
        List<LearningResource> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM resources WHERE course_id=?")) {
            ps.setString(1, courseId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapResource(rs));
        }
        return list;
    }

    private LearningResource mapResource(ResultSet rs) throws SQLException {
        return new LearningResource(rs.getString("resource_id"), rs.getString("resource_name"),
                rs.getString("resource_type"), rs.getString("course_id"));
    }
}
