package com.learning.controller;

import com.learning.model.*;
import com.learning.service.BehaviorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/behavior")
public class BehaviorController {

    @Autowired
    private BehaviorService service;

    /** 记录单条行为 */
    @PostMapping
    public ApiResponse<String> recordBehavior(@RequestBody LearningBehavior behavior) {
        try {
            String rowKey = service.recordBehavior(behavior);
            return ApiResponse.success(rowKey);
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 批量写入 */
    @PostMapping("/batch")
    public ApiResponse<String> recordBatch(@RequestBody List<LearningBehavior> behaviors) {
        try {
            service.recordBehaviors(behaviors);
            return ApiResponse.success("写入" + behaviors.size() + "条");
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** Get 精确查询 */
    @GetMapping("/get/{rowKey}")
    public ApiResponse<LearningBehavior> getByRowKey(@PathVariable String rowKey) {
        try { return ApiResponse.success(service.getByRowKey(rowKey)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 查询指定学生的全部行为 */
    @GetMapping("/student/{studentId}")
    public ApiResponse<List<LearningBehavior>> getByStudent(@PathVariable String studentId) {
        try { return ApiResponse.success(service.getByStudent(studentId)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 查询指定学生在时间范围内的行为 */
    @GetMapping("/student/{studentId}/time")
    public ApiResponse<List<LearningBehavior>> getByStudentAndTime(
            @PathVariable String studentId,
            @RequestParam long startTime, @RequestParam long endTime) {
        try { return ApiResponse.success(service.getByStudentAndTimeRange(studentId, startTime, endTime)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 查询指定学生在某门课程中的行为 */
    @GetMapping("/student/{studentId}/course/{courseId}")
    public ApiResponse<List<LearningBehavior>> getByStudentAndCourse(
            @PathVariable String studentId, @PathVariable String courseId) {
        try { return ApiResponse.success(service.getByStudentAndCourse(studentId, courseId)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 查询某门课程的行为 */
    @GetMapping("/course/{courseId}")
    public ApiResponse<List<LearningBehavior>> getByCourse(@PathVariable String courseId) {
        try { return ApiResponse.success(service.getByCourse(courseId)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 按行为类型查询 */
    @GetMapping("/type/{behaviorType}")
    public ApiResponse<List<LearningBehavior>> getByType(@PathVariable String behaviorType) {
        try { return ApiResponse.success(service.getByBehaviorType(behaviorType)); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 组合查询 */
    @GetMapping("/search")
    public ApiResponse<List<LearningBehavior>> search(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime) {
        try {
            if (studentId != null && courseId != null && startTime != null && endTime != null) {
                return ApiResponse.success(service.getCombined(studentId, courseId, startTime, endTime));
            } else if (studentId != null && startTime != null && endTime != null) {
                return ApiResponse.success(service.getByStudentAndTimeRange(studentId, startTime, endTime));
            } else if (studentId != null && courseId != null) {
                return ApiResponse.success(service.getByStudentAndCourse(studentId, courseId));
            } else if (studentId != null) {
                return ApiResponse.success(service.getByStudent(studentId));
            } else if (courseId != null) {
                return ApiResponse.success(service.getByCourse(courseId));
            } else {
                return ApiResponse.success(service.getAll());
            }
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 更新行为记录 */
    @PutMapping("/{rowKey}")
    public ApiResponse<String> updateBehavior(@PathVariable String rowKey,
            @RequestBody Map<String, String> updates) {
        try { service.updateBehavior(rowKey, updates); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 删除行为记录 */
    @DeleteMapping("/{rowKey}")
    public ApiResponse<String> deleteBehavior(@PathVariable String rowKey) {
        try { service.deleteBehavior(rowKey); return ApiResponse.success("ok"); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    /** 获取HBase表名 */
    @GetMapping("/table-name")
    public ApiResponse<String> getTableName() {
        return ApiResponse.success(service.getTableName());
    }
}
