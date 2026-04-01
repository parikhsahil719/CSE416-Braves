package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.GinglesTableDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GinglesTableRepository extends MongoRepository<GinglesTableDocument, String> {
    Optional<GinglesTableDocument> findByStateIdAndGroupKeyAndElectionId(String stateId, String groupKey, String electionId);
}
