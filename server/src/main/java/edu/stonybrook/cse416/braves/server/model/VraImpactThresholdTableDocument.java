package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vra_impact_threshold_tables")
public class VraImpactThresholdTableDocument extends BasePayloadDocument {
}
