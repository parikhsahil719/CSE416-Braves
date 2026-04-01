package edu.stonybrook.cse416.braves.server.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "minority_effectiveness_box_whisker")
public class MinorityEffectivenessBoxWhiskerDocument extends BasePayloadDocument {
}
