package com.learning.config;

import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PreDestroy;
import java.io.IOException;

@Configuration
public class HBaseConfig {

    @Value("${hbase.zookeeper.quorum:localhost}")
    private String zookeeperQuorum;

    @Value("${hbase.zookeeper.port:2181}")
    private int zookeeperPort;

    private Connection connection;

    @Bean
    public org.apache.hadoop.conf.Configuration hbaseConfiguration() {
        org.apache.hadoop.conf.Configuration config = HBaseConfiguration.create();
        config.set("hbase.zookeeper.quorum", zookeeperQuorum);
        config.setInt("hbase.zookeeper.property.clientPort", zookeeperPort);
        return config;
    }

    @Bean
    public Connection hbaseConnection() throws IOException {
        if (connection == null || connection.isClosed()) {
            connection = ConnectionFactory.createConnection(hbaseConfiguration());
        }
        return connection;
    }

    @PreDestroy
    public void destroy() throws IOException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }
}
