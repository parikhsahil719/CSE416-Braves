package edu.stonybrook.cse416.braves.server.repository;

import edu.stonybrook.cse416.braves.server.model.MinorityEffectivenessBoxWhiskerDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MinorityEffectivenessBoxWhiskerRepository extends MongoRepository<MinorityEffectivenessBoxWhiskerDocument, String> {

    // Legacy full-document lookup (kept for any direct test/debug use)
    Optional<MinorityEffectivenessBoxWhiskerDocument> findByStateIdAndElectionId(String stateId, String electionId);

    // Per-ensemble lookup: one document per (state, election, ensembleType, ensembleIndex)
    Optional<MinorityEffectivenessBoxWhiskerDocument> findByStateIdAndElectionIdAndEnsembleTypeAndEnsembleIndex(
            String stateId, String electionId, String ensembleType, Integer ensembleIndex);
}
