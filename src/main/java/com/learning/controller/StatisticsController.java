package com.learning.controller;

import com.learning.model.ApiResponse;
import com.learning.service.StatisticsService;
import com.learning.service.BaseDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatisticsController {

    @Autowired
    private StatisticsService statsService;

    @Autowired
    private BaseDataService baseDataService;

    @GetMapping("/login-count")
    public ApiResponse<Map<String, Long>> loginCount() {
        try { return ApiResponse.success(statsService.studentLoginCount()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/course-access")
    public ApiResponse<Map<String, Long>> courseAccess() {
        try { return ApiResponse.success(statsService.courseAccessCount()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/resource-browse")
    public ApiResponse<Map<String, Long>> resourceBrowse() {
        try { return ApiResponse.success(statsService.resourceBrowseCount()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/video-duration")
    public ApiResponse<Map<String, Long>> videoDuration() {
        try { return ApiResponse.success(statsService.videoWatchDurationByCourse()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/submit-count")
    public ApiResponse<Map<String, Long>> submitCount() {
        try { return ApiResponse.success(statsService.submitCountByType()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/student-ranking")
    public ApiResponse<List<Map<String, Object>>> studentRanking() {
        try { return ApiResponse.success(statsService.studentActivityRanking()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/course-ranking")
    public ApiResponse<List<Map<String, Object>>> courseRanking() {
        try { return ApiResponse.success(statsService.courseAccessRanking()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/daily-trend")
    public ApiResponse<Map<String, Long>> dailyTrend() {
        try { return ApiResponse.success(statsService.dailyTrend()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/hourly-distribution")
    public ApiResponse<Map<Integer, Long>> hourlyDistribution() {
        try { return ApiResponse.success(statsService.hourlyDistribution()); }
        catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }

    @GetMapping("/inactive-students")
    public ApiResponse<List<String>> inactiveStudents(@RequestParam(defaultValue = "7") int days) {
        try {
            List<String> allIds = baseDataService.getAllStudents().stream()
                    .map(s -> s.getStudentId()).collect(Collectors.toList());
            return ApiResponse.success(statsService.inactiveStudents(allIds, days));
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }
}
