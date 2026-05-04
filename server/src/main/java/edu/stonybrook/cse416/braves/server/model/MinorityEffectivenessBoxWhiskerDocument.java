package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "minority_effectiveness_box_whisker")
// Supports findByStateIdAndElectionIdAndEnsembleTypeAndEnsembleIndex efficiently
@CompoundIndex(
    def = "{'stateId': 1, 'electionId': 1, 'ensembleType': 1, 'ensembleIndex': 1}",
    unique = true
)
public class MinorityEffectivenessBoxWhiskerDocument extends BasePayloadDocument {
}
