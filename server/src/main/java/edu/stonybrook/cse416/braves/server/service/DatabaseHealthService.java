package edu.stonybrook.cse416.braves.server.service;

import java.util.Map;

public interface DatabaseHealthService {
    Map<String, Object> getHealth();
}
