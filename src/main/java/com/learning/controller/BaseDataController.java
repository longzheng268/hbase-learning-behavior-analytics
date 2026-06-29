package com.learning.controller;

import com.learning.model.*;
import com.learning.service.BaseDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base")
public class BaseDataController {

    @Autowired
    private BaseDataService service;

    @GetMapping("/students")
    public ApiResponse<List<Student>> getStudents() {
        try { return ApiResponse.success(service.getAllStudents()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/students/{id}")
    public ApiResponse<Student> getStudent(@PathVariable String id) {
        try { return ApiResponse.success(service.getStudent(id)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PostMapping("/students")
    public ApiResponse<String> addStudent(@RequestBody Student s) {
        try { service.addStudent(s); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PutMapping("/students/{id}")
    public ApiResponse<String> updateStudent(@PathVariable String id, @RequestBody Student s) {
        try { s.setStudentId(id); service.updateStudent(s); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @DeleteMapping("/students/{id}")
    public ApiResponse<String> deleteStudent(@PathVariable String id) {
        try { service.deleteStudent(id); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/courses")
    public ApiResponse<List<Course>> getCourses() {
        try { return ApiResponse.success(service.getAllCourses()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PostMapping("/courses")
    public ApiResponse<String> addCourse(@RequestBody Course c) {
        try { service.addCourse(c); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PutMapping("/courses/{id}")
    public ApiResponse<String> updateCourse(@PathVariable String id, @RequestBody Course c) {
        try { c.setCourseId(id); service.updateCourse(c); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @DeleteMapping("/courses/{id}")
    public ApiResponse<String> deleteCourse(@PathVariable String id) {
        try { service.deleteCourse(id); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/resources")
    public ApiResponse<List<LearningResource>> getResources(
            @RequestParam(required = false) String courseId) {
        try {
            if (courseId != null) return ApiResponse.success(service.getResourcesByCourse(courseId));
            return ApiResponse.success(service.getAllResources());
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PostMapping("/resources")
    public ApiResponse<String> addResource(@RequestBody LearningResource r) {
        try { service.addResource(r); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @PutMapping("/resources/{id}")
    public ApiResponse<String> updateResource(@PathVariable String id, @RequestBody LearningResource r) {
        try { r.setResourceId(id); service.updateResource(r); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @DeleteMapping("/resources/{id}")
    public ApiResponse<String> deleteResource(@PathVariable String id) {
        try { service.deleteResource(id); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/behavior-types")
    public ApiResponse<Object> getBehaviorTypes() {
        java.util.List<java.util.Map<String, String>> types = new java.util.ArrayList<>();
        for (BehaviorType bt : BehaviorType.values()) {
            java.util.Map<String, String> m = new java.util.LinkedHashMap<>();
            m.put("code", bt.name());
            m.put("name", bt.getDisplayName());
            types.add(m);
        }
        return ApiResponse.success(types);
    }
}
