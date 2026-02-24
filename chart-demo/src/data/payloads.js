import orGingles from '../../../mock-data/v1/gingles-scatter/OR_2024_latino.json';
import scGingles from '../../../mock-data/v1/gingles-scatter/SC_2024_black.json';
import orEiSupport from '../../../mock-data/v1/ei-support/OR_2024_president.json';
import scEiSupport from '../../../mock-data/v1/ei-support/SC_2024_president.json';
import orSplits from '../../../mock-data/v1/ensemble-splits/OR_compare.json';
import scSplits from '../../../mock-data/v1/ensemble-splits/SC_compare.json';
import orBox from '../../../mock-data/v1/box-whisker/OR_latino_cvap.json';
import scBox from '../../../mock-data/v1/box-whisker/SC_black_cvap.json';
import orEiBar from '../../../mock-data/v1/ei-precinct-bar-ci/OR_demo.json';
import scEiBar from '../../../mock-data/v1/ei-precinct-bar-ci/SC_demo.json';
import orKde from '../../../mock-data/v1/ei-kde/OR_demo.json';
import scKde from '../../../mock-data/v1/ei-kde/SC_demo.json';
import orSeatShare from '../../../mock-data/v1/vote-share-seat-share/OR_demo.json';
import scSeatShare from '../../../mock-data/v1/vote-share-seat-share/SC_demo.json';

export const chartCatalog = {
  'GUI-16': {
    label: 'GUI-16 Ensemble Splits',
    description: 'Compare race-blind and VRA-constrained ensemble split frequencies.',
    states: { OR: orSplits, SC: scSplits },
  },
  'GUI-9': {
    label: 'GUI-9 Gingles Scatter',
    description: 'Precinct-level party vote share vs selected demographic share.',
    states: { OR: orGingles, SC: scGingles },
  },
  'GUI-12': {
    label: 'GUI-12 EI Support Distribution',
    description: 'Candidate support distributions by racial group.',
    states: { OR: orEiSupport, SC: scEiSupport },
  },
  'GUI-17': {
    label: 'GUI-17 Box & Whisker',
    description: 'Ensemble distribution summaries by district rank with enacted overlay.',
    states: { OR: orBox, SC: scBox },
  },
  'GUI-13': {
    label: 'GUI-13 EI Precinct Bar + CI (Preferred)',
    description: 'Category peak values with confidence intervals.',
    states: { OR: orEiBar, SC: scEiBar },
  },
  'GUI-15': {
    label: 'GUI-15 EI KDE (Preferred)',
    description: 'KDE comparison chart for group support/difference distributions.',
    states: { OR: orKde, SC: scKde },
  },
  'GUI-18': {
    label: 'GUI-18 Vote Share vs Seat Share (Preferred)',
    description: 'Seat share response curve across statewide vote share levels.',
    states: { OR: orSeatShare, SC: scSeatShare },
  },
};

export const chartOrder = ['GUI-16', 'GUI-9', 'GUI-12', 'GUI-17', 'GUI-13', 'GUI-15', 'GUI-18'];
