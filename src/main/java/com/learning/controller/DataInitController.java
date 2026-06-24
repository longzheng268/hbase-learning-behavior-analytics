package com.learning.controller;

import com.learning.model.ApiResponse;
import com.learning.util.DataGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/init")
public class DataInitController {

    @Autowired
    private DataGenerator dataGenerator;

    /** 初始化全部数据（基础数据 + 行为数据） */
    @PostMapping
    public ApiResponse<Map<String, Object>> initData(
            @RequestParam(defaultValue = "30") int days) {
        try {
            dataGenerator.generateBaseData();
            int generated = dataGenerator.generateBehaviorData(days);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("baseData", "基础数据初始化完成");
            result.put("behaviorData", "行为数据生成完成，覆盖" + generated + "天");
            result.put("days", generated);
            return ApiResponse.success(result);
        } catch (Exception e) { return ApiResponse.error(e.getMessage()); }
    }
}
