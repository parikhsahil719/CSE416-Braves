package edu.stonybrook.cse416.braves.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.stonybrook.cse416.braves.server.model.StateSummaryDocument;
import edu.stonybrook.cse416.braves.server.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class SeedDataLoaderTest {

    @Test
    void seedStateSummariesPersistsBackendDrivenOrAndScSummaryFields() {
        StateSummaryRepository stateSummaryRepository = mock(StateSummaryRepository.class);

        SeedDataLoader loader = new SeedDataLoader(
                new ObjectMapper(),
                mock(GeometryAssetService.class),
                mock(StateRepository.class),
                stateSummaryRepository,
                mock(EnsembleSummaryRepository.class),
                mock(DistrictTableRepository.class),
                mock(HeatmapBinRepository.class),
                mock(GinglesResultRepository.class),
                mock(GinglesTableRepository.class),
                mock(EiSupportResultRepository.class),
                mock(EiPrecinctBarCiRepository.class),
                mock(EiKdeRepository.class),
                mock(EnsembleSplitRepository.class),
                mock(BoxWhiskerResultRepository.class),
                mock(InterestingPlanRepository.class),
                mock(VraImpactThresholdTableRepository.class),
                mock(MinorityEffectivenessBoxWhiskerRepository.class),
                mock(MinorityEffectivenessHistogramRepository.class),
                mock(RunManifestRepository.class),
                mock(IngestManifestRepository.class),
                mock(CacheManager.class)
        );

        ReflectionTestUtils.invokeMethod(loader, "seedStateSummaries");

        verify(stateSummaryRepository).deleteAll();

        ArgumentCaptor<StateSummaryDocument> captor = ArgumentCaptor.forClass(StateSummaryDocument.class);
        verify(stateSummaryRepository, times(2)).save(captor.capture());

        List<StateSummaryDocument> savedDocs = captor.getAllValues();
        StateSummaryDocument orDoc = savedDocs.stream()
                .filter(doc -> "OR".equals(doc.getStateId()))
                .findFirst()
                .orElseThrow();
        StateSummaryDocument scDoc = savedDocs.stream()
                .filter(doc -> "SC".equals(doc.getStateId()))
                .findFirst()
                .orElseThrow();

        assertSummaryFields(orDoc.getPayload(), Map.of(
                "population", "3,370,625",
                "WhitePopulation", "2,526,251",
                "BlackPopulation", "60,012",
                "AsianPopulation", "194,538",
                "HispanicPopulation", "389,384",
                "voterDistributionDem", "1,240,600 (55.27%)",
                "voterDistributionRep", "919,480 (40.97%)",
                "partyControl", "Democratic",
                "democratReps", "Suzanne Bonamici, Maxine Dexter, Val Hoyle, Janelle Bynum, Andrea Salinas",
                "republicanReps", "Cliff Bentz"
        ));

        assertSummaryFields(scDoc.getPayload(), Map.of(
                "population", "4,014,460",
                "WhitePopulation", "2,603,975",
                "BlackPopulation", "964,667",
                "AsianPopulation", "90,466",
                "HispanicPopulation", "231,124",
                "voterDistributionDem", "1,028,452 (40.36%)",
                "voterDistributionRep", "1,483,747 (58.23%)",
                "partyControl", "Republican",
                "democratReps", "James Clyburn",
                "republicanReps", "Nancy Mace, Joe Wilson, Sheri Biggs, William Timmons, Ralph Norman, Russell Fry"
        ));
    }

    private void assertSummaryFields(Map<String, Object> payload, Map<String, String> expectedFields) {
        expectedFields.forEach((key, value) -> assertEquals(value, payload.get(key), "Unexpected value for " + key));
    }
}
