package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.EnsembleSummaryDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EnsembleSummaryRepository extends MongoRepository<EnsembleSummaryDocument, String> {
    Optional<EnsembleSummaryDocument> findByStateId(String stateId);
}
