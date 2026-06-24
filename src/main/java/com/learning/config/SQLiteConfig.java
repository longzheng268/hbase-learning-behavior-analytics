package com.learning.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

@Configuration
public class SQLiteConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Bean
    public Connection sqliteConnection() throws SQLException {
        Connection conn = DriverManager.getConnection(dbUrl);
        initSchema(conn);
        return conn;
    }

    private void initSchema(Connection conn) throws SQLException {
        Statement stmt = conn.createStatement();

        stmt.execute("CREATE TABLE IF NOT EXISTS students (" +
                "student_id TEXT PRIMARY KEY, " +
                "name TEXT NOT NULL, " +
                "major TEXT, " +
                "class_name TEXT, " +
                "email TEXT, " +
                "enrollment_year TEXT)");

        stmt.execute("CREATE TABLE IF NOT EXISTS courses (" +
                "course_id TEXT PRIMARY KEY, " +
                "course_name TEXT NOT NULL, " +
                "teacher TEXT, " +
                "department TEXT, " +
                "credit INTEGER DEFAULT 3)");

        stmt.execute("CREATE TABLE IF NOT EXISTS resources (" +
                "resource_id TEXT PRIMARY KEY, " +
                "resource_name TEXT NOT NULL, " +
                "resource_type TEXT, " +
                "course_id TEXT, " +
                "FOREIGN KEY(course_id) REFERENCES courses(course_id))");

        stmt.close();
    }
}
