package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.InterestingPlanDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface InterestingPlanRepository extends MongoRepository<InterestingPlanDocument, String> {
    Optional<InterestingPlanDocument> findByStateIdAndPlanId(String stateId, String planId);
}
