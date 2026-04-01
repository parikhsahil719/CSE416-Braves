package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.VraImpactThresholdTableDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VraImpactThresholdTableRepository extends MongoRepository<VraImpactThresholdTableDocument, String> {
    Optional<VraImpactThresholdTableDocument> findByStateIdAndGroupKeyAndElectionId(String stateId, String groupKey, String electionId);
}
