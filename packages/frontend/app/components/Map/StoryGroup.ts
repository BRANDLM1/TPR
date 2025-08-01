interface Step{
  id: number;
  modalContent: string;
  layersToHide: string[];
  layersToShow: string[];
  nextButtonText?: string;
}

interface Story{
  id: string;
  content: string;
  steps: Step[];

}
const StoryConfig: Record<string, Story> = {

  'bison-rehoming': {
    id: 'bison-rehoming',
    content: 'Bison Rehoming Intitiative',
    steps: [
      {
        id: 0,
        modalContent: 'bison-intro',
        layersToShow: [],
        layersToHide: [],
        nextButtonText: 'Continue'
      },
      {
        id: 1,
        modalContent: 'bison-h1',
        layersToShow: ['country-boundaries', 'roads'],
        layersToHide: [],
        nextButtonText: 'Continue'
      },
      {
        id: 2,
        modalContent: 'bison-h2',
        layersToShow: [],
        layersToHide: [],
        nextButtonText: 'Continue'
      },
      {
        id: 3,
        modalContent: 'bison-h3',
        layersToShow: [],
        layersToHide: [],
        nextButtonText: 'Continue'
      },
      {
        id: 4,
        modalContent: 'bison-current',
        layersToShow: [],
        layersToHide: [],
        nextButtonText: 'Explore'
      },
    ]
  }
};
export type { Step, Story };
export default StoryConfig

